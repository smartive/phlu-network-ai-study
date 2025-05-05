import type { LanguageModelV1Middleware } from 'ai';

const MAX_RETRIES = 7;
const DEFAULT_RETRY_DELAY_MS = 15000; // 15 seconds

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface RateLimitError {
  statusCode?: number;
  responseHeaders?: Headers;
}

function isRateLimitError(error: unknown): error is RateLimitError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    (error as RateLimitError).statusCode === 429 &&
    'responseHeaders' in error
  );
}

export const retryMiddleware: LanguageModelV1Middleware = {
  wrapGenerate: async (options) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await options.doGenerate();
      } catch (error: unknown) {
        lastError = error;
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const waitMs = DEFAULT_RETRY_DELAY_MS;
          console.warn(
            `Rate limit hit (generate). Retrying attempt ${
              attempt + 1
            }/${MAX_RETRIES} after ${waitMs}ms...`
          );
          await delay(waitMs);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  },

  wrapStream: async (options) => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await options.doStream();
      } catch (error: unknown) {
        lastError = error;
        if (isRateLimitError(error) && attempt < MAX_RETRIES) {
          const waitMs = DEFAULT_RETRY_DELAY_MS;
          console.warn(
            `Rate limit hit (stream). Retrying attempt ${
              attempt + 1
            }/${MAX_RETRIES} after ${waitMs}ms...`
          );
          await delay(waitMs);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  },
};
