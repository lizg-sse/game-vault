import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * False during SSR and the hydration pass, true afterwards — the supported way to
 * gate on the browser without risking a hydration mismatch. The daily puzzle keys
 * off the visitor's local date and their saved progress, neither of which the
 * server can know.
 */
export function useIsClient() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}
