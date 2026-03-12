/**
 * Per-workspace in-memory rate limiter.
 *
 * Tracks a sliding fixed-window counter keyed by workspaceId.
 * The window resets every 60 seconds; if a workspace exceeds
 * `maxRunsPerMinute` within the current window, `checkRateLimit`
 * throws a descriptive error that the execute-run handler can
 * surface as a FAILED run.
 *
 * This is intentionally process-local. For multi-worker deployments
 * the limit is per-process; a Redis-backed counter would be needed
 * for cluster-wide enforcement.
 */

const DEFAULT_MAX_RUNS_PER_MINUTE = 10;
const WINDOW_MS = 60_000;

interface WindowState {
  count: number;
  windowStart: number;
}

const windowMap = new Map<string, WindowState>();

/**
 * Asserts that the workspace has not exceeded its run-rate quota.
 *
 * @param workspaceId       - The workspace being checked.
 * @param maxRunsPerMinute  - Allowed runs per 60-second window (default: 10).
 * @throws {Error}          - If the rate limit has been exceeded.
 */
export function checkRateLimit(
  workspaceId: string,
  maxRunsPerMinute: number = DEFAULT_MAX_RUNS_PER_MINUTE,
): void {
  const now = Date.now();
  const state = windowMap.get(workspaceId);

  if (!state || now - state.windowStart >= WINDOW_MS) {
    // No existing window, or the previous window has expired — open a fresh one.
    windowMap.set(workspaceId, { count: 1, windowStart: now });
    return;
  }

  if (state.count >= maxRunsPerMinute) {
    const windowAgeMs = now - state.windowStart;
    const resetInMs = WINDOW_MS - windowAgeMs;
    const resetInSec = Math.ceil(resetInMs / 1000);
    throw new Error(
      `Rate limit exceeded for workspace ${workspaceId}: ` +
        `${state.count}/${maxRunsPerMinute} runs in the current window. ` +
        `Resets in ${resetInSec}s.`,
    );
  }

  state.count += 1;
}
