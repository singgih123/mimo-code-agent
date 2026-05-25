/**
 * GitHub Integration Module
 * 
 * Handles all GitHub API interactions including:
 * - Fetching PR files and diffs
 * - Posting review comments
 * - Creating review summaries
 */

import { Octokit } from '@octokit/rest';
import { PRFile, ReviewFinding, PullRequestReview } from './types';

/** Singleton Octokit instance */
let octokitInstance: Octokit | null = null;

/**
 * Get or create the Octokit client
 */
function getOctokit(): Octokit {
  if (!octokitInstance) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN is required. Set it in your environment variables.');
    }
    octokitInstance = new Octokit({ auth: token });
  }
  return octokitInstance;
}

/**
 * Fetch all files changed in a pull request
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns Array of PR files with patches
 */
export async function fetchPRFiles(
  owner: string,
  repo: string,
  prNumber: number
): Promise<PRFile[]> {
  const octokit = getOctokit();
  
  console.log(`[GitHub] Fetching files for PR #${prNumber} in ${owner}/${repo}`);

  try {
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100, // Fetch up to 100 files
    });

    console.log(`[GitHub] Found ${files.length} changed files`);

    return files.map((file) => ({
      filename: file.filename,
      status: file.status as PRFile['status'],
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      contents_url: file.contents_url,
      raw_url: file.raw_url,
    }));
  } catch (error) {
    console.error('[GitHub] Failed to fetch PR files:', error);
    throw new Error(`Failed to fetch PR files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Fetch the full content of a file from a specific commit
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path in the repository
 * @param ref - Git ref (branch, tag, or SHA)
 * @returns File content as string
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string> {
  const octokit = getOctokit();

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref,
    });

    // Handle file content (base64 encoded)
    if ('content' in data && data.type === 'file') {
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      console.log(`[GitHub] Fetched ${path} (${content.length} chars)`);
      return content;
    }

    throw new Error(`${path} is not a file`);
  } catch (error) {
    console.error(`[GitHub] Failed to fetch file content for ${path}:`, error);
    throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Post a review with inline comments on a pull request
 * 
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @param commitSha - The commit SHA to attach comments to
 * @param review - The complete review results
 */
export async function postReviewComments(
  owner: string,
  repo: string,
  prNumber: number,
  commitSha: string,
  review: PullRequestReview
): Promise<void> {
  const octokit = getOctokit();

  console.log(`[GitHub] Posting review for PR #${prNumber} with ${review.totalFindings} findings`);

  try {
    // Build inline comments from findings
    const comments = review.fileResults
      .flatMap((fileResult) =>
        fileResult.findings
          .filter((finding) => finding.line && finding.line > 0)
          .map((finding) => ({
            path: finding.file,
            line: finding.line!,
            body: formatFindingComment(finding),
          }))
      )
      .slice(0, 50); // GitHub limits to 50 inline comments per review

    // Determine review event based on severity
    const event = review.criticalCount > 0 ? 'REQUEST_CHANGES' : 'COMMENT';

    // Post the review
    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: commitSha,
      body: review.summary,
      event: event as 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT',
      comments: comments.length > 0 ? comments : undefined,
    });

    console.log(`[GitHub] Review posted successfully (${event}, ${comments.length} inline comments)`);
  } catch (error) {
    console.error('[GitHub] Failed to post review:', error);
    
    // Fallback: post as a regular comment if review fails
    try {
      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## 🤖 CodeReview AI Analysis\n\n${review.summary}\n\n---\n*Analyzed with MiMo AI | ${review.totalTokensUsed.toLocaleString()} tokens used*`,
      });
      console.log('[GitHub] Fallback comment posted successfully');
    } catch (fallbackError) {
      console.error('[GitHub] Fallback comment also failed:', fallbackError);
      throw new Error(`Failed to post review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Format a single finding as a GitHub comment
 */
function formatFindingComment(finding: ReviewFinding): string {
  const severityEmoji = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️',
    suggestion: '💡',
  };

  const categoryLabel = {
    security: '🔒 Security',
    performance: '⚡ Performance',
    'best-practices': '📋 Best Practices',
    bugs: '🐛 Bug',
    maintainability: '🏗️ Maintainability',
  };

  let comment = `${severityEmoji[finding.severity]} **${finding.title}** [${categoryLabel[finding.category]}]\n\n`;
  comment += `${finding.description}\n\n`;

  if (finding.suggestion) {
    comment += `**Suggestion:** ${finding.suggestion}\n\n`;
  }

  if (finding.codeSnippet) {
    comment += `\`\`\`suggestion\n${finding.codeSnippet}\n\`\`\`\n`;
  }

  return comment;
}

/**
 * Verify webhook signature for security
 * 
 * @param payload - Raw request body
 * @param signature - X-Hub-Signature-256 header value
 * @returns Whether the signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[GitHub] WEBHOOK_SECRET not set, skipping signature verification');
    return true; // Allow in development
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = `sha256=${Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;

    return signature === expectedSignature;
  } catch (error) {
    console.error('[GitHub] Signature verification failed:', error);
    return false;
  }
}
