/**
 * Core Review Engine
 * 
 * Orchestrates multi-pass code review using MiMo AI models.
 * Each file is analyzed through multiple specialized passes:
 * 1. Security Analysis (mimo-v2.5-pro) - Deep vulnerability scanning
 * 2. Performance Analysis (mimo-v2.5-pro) - Optimization opportunities
 * 3. Best Practices (mimo-v2.5-pro) - Code quality and patterns
 * 4. Bug Detection (mimo-v2.5-pro) - Logic errors and edge cases
 * 5. Summary Generation (mimo-v2.5) - Executive summary
 * 
 * This multi-pass approach ensures thorough coverage and maximizes
 * the depth of analysis for each concern area.
 */

import { deepAnalysis, quickCheck } from './mimo-client';
import { getPromptForCategory, buildFileReviewMessage, SUMMARY_PROMPT } from './prompts';
import { 
  PRFile, 
  ReviewFinding, 
  FileReviewResult, 
  PullRequestReview, 
  ReviewCategory, 
  Severity 
} from './types';
import { fetchFileContent } from './github';

/** Default review passes to perform on each file */
const DEFAULT_REVIEW_PASSES: ReviewCategory[] = [
  'security',
  'performance',
  'best-practices',
  'bugs',
];

/** File extensions to review (skip binary and non-code files) */
const REVIEWABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
  '.rb', '.php', '.cs', '.cpp', '.c', '.h', '.hpp', '.swift',
  '.kt', '.scala', '.vue', '.svelte', '.sql', '.graphql',
  '.yaml', '.yml', '.json', '.toml', '.env', '.sh', '.bash',
]);

/**
 * Perform a complete multi-pass review of a pull request
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @param files - Array of changed files
 * @param headSha - HEAD commit SHA for fetching file contents
 * @param passes - Review passes to perform (defaults to all)
 * @returns Complete pull request review results
 */
export async function reviewPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
  files: PRFile[],
  headSha: string,
  passes: ReviewCategory[] = DEFAULT_REVIEW_PASSES
): Promise<PullRequestReview> {
  const startTime = Date.now();
  let totalTokensUsed = 0;
  const allFileResults: FileReviewResult[] = [];

  console.log(`[Reviewer] Starting multi-pass review for PR #${prNumber}`);
  console.log(`[Reviewer] Files to review: ${files.length}`);
  console.log(`[Reviewer] Passes per file: ${passes.length} (${passes.join(', ')})`);
  console.log(`[Reviewer] Total analysis operations: ${files.length * passes.length}`);

  // Filter to reviewable files only
  const reviewableFiles = files.filter((file) => {
    if (file.status === 'removed') return false;
    const ext = '.' + file.filename.split('.').pop()?.toLowerCase();
    return REVIEWABLE_EXTENSIONS.has(ext);
  });

  console.log(`[Reviewer] Reviewable files after filtering: ${reviewableFiles.length}`);

  // Process each file through all review passes
  for (const file of reviewableFiles) {
    console.log(`\n[Reviewer] ═══════════════════════════════════════`);
    console.log(`[Reviewer] Analyzing: ${file.filename}`);
    console.log(`[Reviewer] Changes: +${file.additions} -${file.deletions}`);

    // Fetch full file content for context
    let fileContent: string;
    try {
      fileContent = await fetchFileContent(owner, repo, file.filename, headSha);
    } catch (error) {
      console.warn(`[Reviewer] Could not fetch content for ${file.filename}, using patch only`);
      fileContent = file.patch || '';
    }

    // Build the review message with full context
    const reviewMessage = buildFileReviewMessage(file.filename, fileContent, file.patch);

    // Run each review pass on this file
    for (const pass of passes) {
      const passStartTime = Date.now();
      console.log(`[Reviewer] ── Pass: ${pass} ──`);

      try {
        const result = await performReviewPass(file.filename, reviewMessage, pass);
        const passDuration = Date.now() - passStartTime;

        allFileResults.push({
          filename: file.filename,
          findings: result.findings,
          tokensUsed: result.tokensUsed,
          passType: pass,
          duration: passDuration,
        });

        totalTokensUsed += result.tokensUsed;

        console.log(`[Reviewer]    Findings: ${result.findings.length}`);
        console.log(`[Reviewer]    Tokens: ${result.tokensUsed.toLocaleString()}`);
        console.log(`[Reviewer]    Duration: ${passDuration}ms`);
      } catch (error) {
        console.error(`[Reviewer]    Pass failed: ${error}`);
        // Continue with other passes even if one fails
        allFileResults.push({
          filename: file.filename,
          findings: [],
          tokensUsed: 0,
          passType: pass,
          duration: Date.now() - passStartTime,
        });
      }
    }
  }

  // Aggregate all findings
  const allFindings = allFileResults.flatMap((r) => r.findings);
  const criticalCount = allFindings.filter((f) => f.severity === 'critical').length;
  const warningCount = allFindings.filter((f) => f.severity === 'warning').length;
  const infoCount = allFindings.filter((f) => f.severity === 'info').length;
  const suggestionCount = allFindings.filter((f) => f.severity === 'suggestion').length;

  console.log(`\n[Reviewer] ═══════════════════════════════════════`);
  console.log(`[Reviewer] Review complete!`);
  console.log(`[Reviewer] Total findings: ${allFindings.length}`);
  console.log(`[Reviewer]   Critical: ${criticalCount}`);
  console.log(`[Reviewer]   Warnings: ${warningCount}`);
  console.log(`[Reviewer]   Info: ${infoCount}`);
  console.log(`[Reviewer]   Suggestions: ${suggestionCount}`);

  // Generate executive summary using quick model
  const summary = await generateSummary(allFindings, reviewableFiles.length, totalTokensUsed);
  totalTokensUsed += summary.tokensUsed;

  const totalDuration = Date.now() - startTime;

  console.log(`[Reviewer] Total tokens used: ${totalTokensUsed.toLocaleString()}`);
  console.log(`[Reviewer] Total duration: ${totalDuration}ms`);

  return {
    prNumber,
    repository: `${owner}/${repo}`,
    totalFindings: allFindings.length,
    criticalCount,
    warningCount,
    infoCount,
    suggestionCount,
    fileResults: allFileResults,
    summary: summary.content,
    totalTokensUsed,
    totalDuration,
    timestamp: new Date().toISOString(),
    model: 'mimo-v2.5-pro + mimo-v2.5',
  };
}

/**
 * Perform a single review pass on a file
 * 
 * @param filename - Name of the file being reviewed
 * @param reviewMessage - The formatted review message with code content
 * @param category - The review category/pass type
 * @returns Findings and token usage for this pass
 */
async function performReviewPass(
  filename: string,
  reviewMessage: string,
  category: ReviewCategory
): Promise<{ findings: ReviewFinding[]; tokensUsed: number }> {
  const prompt = getPromptForCategory(category);

  // Use deep analysis (mimo-v2.5-pro) for thorough review
  const { content, tokensUsed } = await deepAnalysis(prompt, reviewMessage);

  // Parse the JSON response into findings
  const findings = parseFindings(content, filename, category);

  return { findings, tokensUsed };
}

/**
 * Parse the AI response into structured findings
 * Handles various response formats gracefully
 */
function parseFindings(
  response: string,
  filename: string,
  category: ReviewCategory
): ReviewFinding[] {
  try {
    // Extract JSON array from the response (handle markdown code blocks)
    let jsonStr = response;
    
    // Try to extract JSON from code blocks
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Try to find a JSON array in the response
    const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (!arrayMatch) {
      // No JSON array found - might be empty or text response
      if (response.toLowerCase().includes('no issues') || response.trim() === '[]') {
        return [];
      }
      console.warn(`[Reviewer] Could not parse findings JSON for ${filename}`);
      return [];
    }

    const parsed = JSON.parse(arrayMatch[0]);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Map parsed findings to our interface
    return parsed.map((item: Record<string, unknown>) => ({
      file: filename,
      line: typeof item.line === 'number' ? item.line : undefined,
      endLine: typeof item.endLine === 'number' ? item.endLine : undefined,
      severity: validateSeverity(item.severity as string),
      category,
      title: String(item.title || 'Untitled Finding'),
      description: String(item.description || ''),
      suggestion: item.suggestion ? String(item.suggestion) : undefined,
      codeSnippet: item.codeSnippet ? String(item.codeSnippet) : undefined,
    }));
  } catch (error) {
    console.error(`[Reviewer] Failed to parse findings for ${filename}:`, error);
    return [];
  }
}

/**
 * Validate and normalize severity values
 */
function validateSeverity(severity: string): Severity {
  const valid: Severity[] = ['critical', 'warning', 'info', 'suggestion'];
  if (valid.includes(severity as Severity)) {
    return severity as Severity;
  }
  return 'info';
}

/**
 * Generate an executive summary of all findings
 * Uses the faster mimo-v2.5 model for efficiency
 */
async function generateSummary(
  findings: ReviewFinding[],
  filesReviewed: number,
  tokensUsedSoFar: number
): Promise<{ content: string; tokensUsed: number }> {
  console.log(`[Reviewer] Generating executive summary...`);

  const findingsSummary = findings.map((f) => 
    `[${f.severity.toUpperCase()}] ${f.category} - ${f.file}:${f.line || '?'} - ${f.title}: ${f.description}`
  ).join('\n');

  const userMessage = `
## Review Statistics
- Files reviewed: ${filesReviewed}
- Total findings: ${findings.length}
- Critical: ${findings.filter(f => f.severity === 'critical').length}
- Warnings: ${findings.filter(f => f.severity === 'warning').length}
- Info: ${findings.filter(f => f.severity === 'info').length}
- Suggestions: ${findings.filter(f => f.severity === 'suggestion').length}
- Tokens used for analysis: ${tokensUsedSoFar.toLocaleString()}

## All Findings
${findingsSummary || 'No issues found - code looks clean!'}

Generate a comprehensive review summary.`;

  const { content, tokensUsed } = await quickCheck(SUMMARY_PROMPT, userMessage);

  return { content, tokensUsed };
}

/**
 * Quick pre-scan to determine if a file needs deep review
 * Uses mimo-v2.5 for fast triage
 */
export async function quickPreScan(
  filename: string,
  patch: string
): Promise<{ needsDeepReview: boolean; tokensUsed: number }> {
  const prompt = `You are a code review triage system. Look at this diff and determine if it needs deep review.
Respond with JSON: {"needsDeepReview": true/false, "reason": "..."}
Files that need deep review: security-sensitive changes, complex logic, API changes, auth code.
Files that DON'T need deep review: comments only, formatting, simple renames, test data.`;

  const { content, tokensUsed } = await quickCheck(prompt, `File: ${filename}\n\nDiff:\n${patch}`);

  try {
    const result = JSON.parse(content);
    return { needsDeepReview: result.needsDeepReview !== false, tokensUsed };
  } catch {
    // Default to deep review if parsing fails
    return { needsDeepReview: true, tokensUsed };
  }
}
