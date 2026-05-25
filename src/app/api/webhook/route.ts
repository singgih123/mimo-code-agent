/**
 * GitHub Webhook Handler
 * 
 * Receives pull_request events from GitHub and triggers
 * the multi-pass AI code review pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, fetchPRFiles, postReviewComments } from '@/lib/github';
import { reviewPullRequest } from '@/lib/reviewer';
import { WebhookPayload } from '@/lib/types';

/** Supported webhook events */
const SUPPORTED_ACTIONS = ['opened', 'synchronize', 'reopened'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  console.log('[Webhook] Received webhook event');

  try {
    // Read the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256') || '';
    const event = request.headers.get('x-github-event') || '';

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('[Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Only handle pull_request events
    if (event !== 'pull_request') {
      console.log(`[Webhook] Ignoring event type: ${event}`);
      return NextResponse.json(
        { message: `Event type '${event}' not handled` },
        { status: 200 }
      );
    }

    // Parse the payload
    const payload: WebhookPayload = JSON.parse(body);

    // Only handle supported actions
    if (!SUPPORTED_ACTIONS.includes(payload.action)) {
      console.log(`[Webhook] Ignoring action: ${payload.action}`);
      return NextResponse.json(
        { message: `Action '${payload.action}' not handled` },
        { status: 200 }
      );
    }

    const { repository, pull_request: pr } = payload;
    const owner = repository.owner.login;
    const repo = repository.name;
    const prNumber = pr.number;
    const headSha = pr.head.sha;

    console.log(`[Webhook] Processing PR #${prNumber} in ${owner}/${repo}`);
    console.log(`[Webhook] Action: ${payload.action}`);
    console.log(`[Webhook] Author: ${pr.user.login}`);
    console.log(`[Webhook] Title: ${pr.title}`);

    // Fetch PR files
    const files = await fetchPRFiles(owner, repo, prNumber);

    if (files.length === 0) {
      console.log('[Webhook] No files to review');
      return NextResponse.json(
        { message: 'No files to review', prNumber },
        { status: 200 }
      );
    }

    // Perform multi-pass review
    const review = await reviewPullRequest(
      owner,
      repo,
      prNumber,
      files,
      headSha
    );

    // Post review comments to GitHub
    await postReviewComments(owner, repo, prNumber, headSha, review);

    const duration = Date.now() - startTime;

    console.log(`[Webhook] Review complete in ${duration}ms`);
    console.log(`[Webhook] Tokens used: ${review.totalTokensUsed.toLocaleString()}`);

    return NextResponse.json({
      success: true,
      prNumber,
      repository: `${owner}/${repo}`,
      findings: review.totalFindings,
      tokensUsed: review.totalTokensUsed,
      duration,
    });
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/** Health check for the webhook endpoint */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'CodeReview AI Agent',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: [
      'security-analysis',
      'performance-review',
      'best-practices-check',
      'bug-detection',
      'multi-pass-review',
    ],
  });
}
