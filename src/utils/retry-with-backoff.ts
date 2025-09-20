import { slackNotifier } from '@/services/notifications/slack.service';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number; // milliseconds
  maxDelay?: number; // milliseconds
  factor?: number; // exponential factor
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
  alertAfterRetries?: number; // Send Slack alert after N retries
  provider?: string; // For alert context
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'shouldRetry' | 'provider'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  factor: 2,
  alertAfterRetries: 2,
};

/**
 * Execute a function with exponential backoff retry logic
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Attempt the operation
      const result = await fn();

      // If we had retries and succeeded, send recovery notification
      if (attempt > 0 && opts.provider) {
        const downtime = calculateDowntime(attempt, opts);
        await slackNotifier.sendRecoveryNotification(opts.provider, downtime);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (opts.shouldRetry && !opts.shouldRetry(lastError)) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        if (opts.provider) {
          await slackNotifier.sendApiFailureAlert(
            opts.provider,
            lastError.message,
            attempt
          );
        }
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.factor, attempt),
        opts.maxDelay
      );

      // Call retry callback
      if (opts.onRetry) {
        opts.onRetry(lastError, attempt + 1);
      }

      // Send alert after specified number of retries
      if (attempt + 1 >= opts.alertAfterRetries && opts.provider) {
        await slackNotifier.sendApiFailureAlert(
          opts.provider,
          lastError.message,
          attempt + 1
        );
      }

      console.log(
        `⚠️ Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms delay. Error: ${lastError.message}`
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate approximate downtime based on retry attempts
 */
function calculateDowntime(attempts: number, options: typeof DEFAULT_OPTIONS): number {
  let totalTime = 0;
  for (let i = 0; i < attempts; i++) {
    totalTime += Math.min(
      options.initialDelay * Math.pow(options.factor, i),
      options.maxDelay
    );
  }
  return totalTime;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') || message.includes('econnrefused') || message.includes('timeout')) {
    return true;
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return true;
  }

  // Temporary server errors
  if (message.includes('502') || message.includes('503') || message.includes('504')) {
    return true;
  }

  // API-specific temporary errors
  if (message.includes('temporarily unavailable') || message.includes('service unavailable')) {
    return true;
  }

  return false;
}

/**
 * Wrap an async function with retry logic
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    return retryWithBackoff(() => fn(...args), options);
  }) as T;
}

/**
 * Create a retry wrapper for a specific provider
 */
export function createProviderRetry(provider: string, customOptions: RetryOptions = {}) {
  return <T>(fn: () => Promise<T>, options: RetryOptions = {}) => {
    return retryWithBackoff(fn, {
      ...customOptions,
      ...options,
      provider,
      shouldRetry: isRetryableError,
    });
  };
}