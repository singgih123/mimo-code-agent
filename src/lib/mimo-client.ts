/**
 * MiMo API Client
 * 
 * OpenAI-compatible client configured for the MiMo API.
 * Supports both mimo-v2.5-pro (deep analysis) and mimo-v2.5 (quick checks).
 */

import OpenAI from 'openai';
import { MiMoConfig, TokenUsage } from './types';

/** Default configuration for MiMo API */
const DEFAULT_CONFIG: MiMoConfig = {
  apiKey: process.env.MIMO_API_KEY || '',
  baseUrl: process.env.MIMO_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1',
  proModel: process.env.MIMO_PRO_MODEL || 'mimo-v2.5-pro',
  fastModel: process.env.MIMO_FAST_MODEL || 'mimo-v2.5',
  maxTokens: 16384,
  temperature: 0.1,
};

/** Token usage accumulator for tracking consumption */
let totalTokenUsage: TokenUsage[] = [];

/**
 * Creates and returns a configured OpenAI client pointing to MiMo API
 */
function createClient(config: Partial<MiMoConfig> = {}): OpenAI {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (!mergedConfig.apiKey) {
    throw new Error('MIMO_API_KEY is required. Set it in your environment variables.');
  }

  return new OpenAI({
    apiKey: mergedConfig.apiKey,
    baseURL: mergedConfig.baseUrl,
  });
}

/** Singleton client instance */
let clientInstance: OpenAI | null = null;

/**
 * Get or create the MiMo client singleton
 */
export function getMiMoClient(): OpenAI {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}

/**
 * Perform a deep analysis using mimo-v2.5-pro
 * Used for thorough multi-pass code review
 * 
 * @param systemPrompt - The system prompt defining the review focus
 * @param userMessage - The code content to analyze
 * @param config - Optional configuration overrides
 * @returns The analysis result and token usage
 */
export async function deepAnalysis(
  systemPrompt: string,
  userMessage: string,
  config: Partial<MiMoConfig> = {}
): Promise<{ content: string; tokensUsed: number }> {
  const client = getMiMoClient();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  const startTime = Date.now();
  
  console.log(`[MiMo] Starting deep analysis with ${mergedConfig.proModel}...`);
  console.log(`[MiMo] Input length: ${userMessage.length} characters`);

  try {
    const response = await client.chat.completions.create({
      model: mergedConfig.proModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: mergedConfig.maxTokens,
      temperature: mergedConfig.temperature,
      // Enable extended thinking for deeper analysis
      stream: false,
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    const tokensUsed = usage?.total_tokens || 0;

    // Track token usage
    const tokenRecord: TokenUsage = {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: tokensUsed,
      model: mergedConfig.proModel,
      timestamp: new Date().toISOString(),
    };
    totalTokenUsage.push(tokenRecord);

    const duration = Date.now() - startTime;
    console.log(`[MiMo] Deep analysis complete in ${duration}ms`);
    console.log(`[MiMo] Tokens used: ${tokensUsed} (prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens})`);

    return { content, tokensUsed };
  } catch (error) {
    console.error('[MiMo] Deep analysis failed:', error);
    throw new Error(`MiMo deep analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Perform a quick check using mimo-v2.5
 * Used for fast preliminary scans and summary generation
 * 
 * @param systemPrompt - The system prompt
 * @param userMessage - The content to analyze
 * @param config - Optional configuration overrides
 * @returns The analysis result and token usage
 */
export async function quickCheck(
  systemPrompt: string,
  userMessage: string,
  config: Partial<MiMoConfig> = {}
): Promise<{ content: string; tokensUsed: number }> {
  const client = getMiMoClient();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const startTime = Date.now();
  
  console.log(`[MiMo] Starting quick check with ${mergedConfig.fastModel}...`);

  try {
    const response = await client.chat.completions.create({
      model: mergedConfig.fastModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 8192,
      temperature: 0.2,
      stream: false,
    });

    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    const tokensUsed = usage?.total_tokens || 0;

    // Track token usage
    const tokenRecord: TokenUsage = {
      promptTokens: usage?.prompt_tokens || 0,
      completionTokens: usage?.completion_tokens || 0,
      totalTokens: tokensUsed,
      model: mergedConfig.fastModel,
      timestamp: new Date().toISOString(),
    };
    totalTokenUsage.push(tokenRecord);

    const duration = Date.now() - startTime;
    console.log(`[MiMo] Quick check complete in ${duration}ms, tokens: ${tokensUsed}`);

    return { content, tokensUsed };
  } catch (error) {
    console.error('[MiMo] Quick check failed:', error);
    throw new Error(`MiMo quick check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get accumulated token usage statistics
 */
export function getTokenUsageStats(): {
  totalTokens: number;
  totalRequests: number;
  byModel: Record<string, number>;
  history: TokenUsage[];
} {
  const byModel: Record<string, number> = {};
  let totalTokens = 0;

  for (const usage of totalTokenUsage) {
    totalTokens += usage.totalTokens;
    byModel[usage.model] = (byModel[usage.model] || 0) + usage.totalTokens;
  }

  return {
    totalTokens,
    totalRequests: totalTokenUsage.length,
    byModel,
    history: totalTokenUsage,
  };
}

/**
 * Reset token usage tracking (useful for testing)
 */
export function resetTokenUsage(): void {
  totalTokenUsage = [];
}
