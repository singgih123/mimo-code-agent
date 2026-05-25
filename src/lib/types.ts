/**
 * TypeScript interfaces for the CodeReview AI Agent
 */

/** Severity levels for review findings */
export type Severity = 'critical' | 'warning' | 'info' | 'suggestion';

/** Categories of code review analysis */
export type ReviewCategory = 'security' | 'performance' | 'best-practices' | 'bugs' | 'maintainability';

/** A single finding from the code review */
export interface ReviewFinding {
  file: string;
  line?: number;
  endLine?: number;
  severity: Severity;
  category: ReviewCategory;
  title: string;
  description: string;
  suggestion?: string;
  codeSnippet?: string;
}

/** Result of a single file review pass */
export interface FileReviewResult {
  filename: string;
  findings: ReviewFinding[];
  tokensUsed: number;
  passType: ReviewCategory;
  duration: number;
}

/** Aggregated review result for an entire PR */
export interface PullRequestReview {
  prNumber: number;
  repository: string;
  totalFindings: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  suggestionCount: number;
  fileResults: FileReviewResult[];
  summary: string;
  totalTokensUsed: number;
  totalDuration: number;
  timestamp: string;
  model: string;
}

/** GitHub PR file from the API */
export interface PRFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  contents_url: string;
  raw_url: string;
}

/** GitHub webhook payload for pull_request events */
export interface WebhookPayload {
  action: string;
  number: number;
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    head: {
      sha: string;
      ref: string;
    };
    base: {
      sha: string;
      ref: string;
    };
    user: {
      login: string;
    };
    diff_url: string;
    html_url: string;
  };
  repository: {
    full_name: string;
    owner: {
      login: string;
    };
    name: string;
  };
}

/** Configuration for the MiMo client */
export interface MiMoConfig {
  apiKey: string;
  baseUrl: string;
  proModel: string;
  fastModel: string;
  maxTokens: number;
  temperature: number;
}

/** Review request for manual trigger */
export interface ManualReviewRequest {
  owner: string;
  repo: string;
  prNumber: number;
  passes?: ReviewCategory[];
}

/** Dashboard statistics */
export interface DashboardStats {
  totalReviews: number;
  totalTokensUsed: number;
  totalIssuesFound: number;
  criticalIssues: number;
  avgTokensPerReview: number;
  avgIssuesPerReview: number;
  recentReviews: PullRequestReview[];
}

/** Token usage tracking */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: string;
}
