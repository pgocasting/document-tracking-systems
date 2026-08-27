import { useEffect, useRef, useState } from "react"
import { toast as toastApi } from "../lib/toast"

type ToastItem = {
  id: string
  message: string
  variant: "success" | "error" | "info"
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([])
  const timeoutsRef = useRef<Record<string, number>>({})

  useEffect(() => {
    function onToast(e: Event) {
      const ce = e as CustomEvent<{ message: string; variant: ToastItem["variant"]; durationMs?: number }>
      const detail = ce.detail
      if (!detail?.message) return

      const id = uid()
      const duration = typeof detail.durationMs === "number" ? detail.durationMs : 3500

      const next: ToastItem = {
        id,
        message: detail.message,
        variant: detail.variant,
      }

      setItems((prev) => [...prev, next].slice(-4))

      const t = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== id))
        delete timeoutsRef.current[id]
      }, Math.max(1000, duration))

      timeoutsRef.current[id] = t
    }

    window.addEventListener(toastApi._eventName, onToast)
    return () => {
      window.removeEventListener(toastApi._eventName, onToast)
      for (const id of Object.keys(timeoutsRef.current)) {
        window.clearTimeout(timeoutsRef.current[id])
      }
      timeoutsRef.current = {}
    }
  }, [])

  function dismiss(id: string) {
    const t = timeoutsRef.current[id]
    if (t) {
      window.clearTimeout(t)
      delete timeoutsRef.current[id]
    }
    setItems((prev) => prev.filter((x) => x.id !== id))
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-100 flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => {
        const variantClass =
          t.variant === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : t.variant === "error"
              ? "border-rose-200 bg-rose-50 text-rose-900"
              : "border-slate-200 bg-white text-slate-900"

        const icon = t.variant === "success" ? "✓" : t.variant === "error" ? "!" : "i"

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${variantClass}`}
            role="status"
          >
            <div className="grid size-7 flex-none place-items-center rounded-full border border-current/20">
              <span className="text-sm font-bold leading-none">{icon}</span>
            </div>
            <div className="min-w-0 flex-1 text-sm leading-snug">{t.message}</div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 -mt-1 inline-flex size-7 items-center justify-center rounded-md text-current/70 transition hover:bg-black/5 hover:text-current"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
