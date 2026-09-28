/**
 * Races a promise against a timeout, resolving to `fallback` if the promise
 * hasn't settled in time — for calls that should degrade gracefully rather
 * than block rendering (e.g. a personalization lookup that isn't essential
 * to the page working). Never use this for a security check: a hung auth
 * call must fail closed, not silently resolve to "no user."
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

/**
 * Races a promise against a timeout, REJECTING with a clear error if the
 * promise hasn't settled in time — for data that must never be silently
 * faked. Use this (not withTimeout) for anything shown to the user as a
 * real figure: a dashboard section should show "couldn't load, retry"
 * rather than a plausible-looking number that timed out into a fallback.
 */
export class TimeoutError extends Error {
  constructor(label: string, ms: number) {
    super(`${label} timed out after ${ms}ms`)
    this.name = "TimeoutError"
  }
}

export function withTimeoutOrThrow<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError(label, ms)), ms)
    ),
  ])
}
