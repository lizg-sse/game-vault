'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Bottom sheet: the mobile-first modal for hints, stats and help.
 * Traps focus, closes on Escape, and restores focus to whatever opened it.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    panel?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      openerRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/70 backdrop-blur-[2px]"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-sheet-in relative max-h-[86dvh] overflow-y-auto rounded-t-3xl border-t border-[var(--line-strong)] bg-surface pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-[var(--line)] bg-surface/95 px-5 pt-3 pb-3 backdrop-blur">
          <div
            aria-hidden
            className="absolute top-1.5 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-edge"
          />
          <h2 className="mt-1 flex-1 text-[15px] font-semibold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="mt-1 -mr-1 grid h-8 w-8 place-items-center rounded-[2px] text-faint transition-colors hover:bg-raised hover:text-paper"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
