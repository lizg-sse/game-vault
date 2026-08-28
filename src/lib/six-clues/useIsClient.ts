import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/**
 * False during SSR and the hydration pass, true afterwards — the supported way to
 * gate on the browser without risking a hydration mismatch. The board reads
 * browser-only state such as the saved mode and help preference.
 */
export function useIsClient() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  )
}
