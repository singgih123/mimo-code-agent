/**
 * Manual Review Trigger API
 * 
 * Allows triggering a code review manually via API call.
 * Useful for testing and for reviewing PRs that were created
 * before the webhook was set up.
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPRFiles, postReviewComments } from '@/lib/github';
import { reviewPullRequest } from '@/lib/reviewer';
import { ManualReviewRequest, ReviewCategory } from '@/lib/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  console.log('[ManualReview] Manual review triggered');

  try {
    const body: ManualReviewRequest = await request.json();

    // Validate required fields
    if (!body.owner || !body.repo || !body.prNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: owner, repo, prNumber' },
        { status: 400 }
      );
    }

    const { owner, repo, prNumber, passes } = body;

    // Validate passes if provided
    const validPasses: ReviewCategory[] = ['security', 'performance', 'best-practices', 'bugs'];
    const reviewPasses = passes?.filter((p) => validPasses.includes(p)) || validPasses;

    console.log(`[ManualReview] Reviewing PR #${prNumber} in ${owner}/${repo}`);
    console.log(`[ManualReview] Passes: ${reviewPasses.join(', ')}`);

    // Fetch PR files
    const files = await fetchPRFiles(owner, repo, prNumber);

    if (files.length === 0) {
      return NextResponse.json(
        { message: 'No files to review', prNumber },
        { status: 200 }
      );
    }

    console.log(`[ManualReview] Found ${files.length} files to review`);

    // We need the head SHA - fetch it from the first file's contents_url
    // For manual reviews, we'll use 'HEAD' as the ref
    const headSha = 'HEAD';

    // Perform multi-pass review
    const review = await reviewPullRequest(
      owner,
      repo,
      prNumber,
      files,
      headSha,
      reviewPasses
    );

    // Post review comments to GitHub
    await postReviewComments(owner, repo, prNumber, headSha, review);

    const duration = Date.now() - startTime;

    console.log(`[ManualReview] Complete in ${duration}ms`);

    return NextResponse.json({
      success: true,
      prNumber,
      repository: `${owner}/${repo}`,
      findings: review.totalFindings,
      critical: review.criticalCount,
      warnings: review.warningCount,
      suggestions: review.suggestionCount,
      tokensUsed: review.totalTokensUsed,
      duration,
      summary: review.summary,
    });
  } catch (error) {
    console.error('[ManualReview] Error:', error);

    return NextResponse.json(
      {
        error: 'Review failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** API documentation endpoint */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/review',
    method: 'POST',
    description: 'Manually trigger a code review for a pull request',
    body: {
      owner: 'string (required) - Repository owner',
      repo: 'string (required) - Repository name',
      prNumber: 'number (required) - Pull request number',
      passes: 'string[] (optional) - Review passes to run: security, performance, best-practices, bugs',
    },
    example: {
      owner: 'singgih123',
      repo: 'mimo-code-agent',
      prNumber: 1,
      passes: ['security', 'performance', 'best-practices', 'bugs'],
    },
  });
}
