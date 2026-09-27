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
