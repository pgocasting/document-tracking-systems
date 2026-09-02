import { Wrench } from "lucide-react"

export default function ReportsPage({ title = "Reports" }: { title?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] select-none">
      {/* Animated gear icon */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-sky-100/70 border-2 border-sky-200 flex items-center justify-center shadow-md">
          <Wrench
            className="w-14 h-14 text-sky-600"
            style={{ animation: "spin 4s linear infinite" }}
          />
        </div>
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-sky-300/30 animate-ping" />
      </div>

      <h1 className="text-3xl font-extrabold text-sky-950 tracking-tight mb-2">
        Under Maintenance
      </h1>
      <p className="text-sky-800/70 text-base text-center max-w-md leading-relaxed">
        The <span className="font-semibold text-sky-900">{title}</span> section
        is currently under maintenance. Please check back later. We apologize for
        the inconvenience.
      </p>

      <div className="mt-8 flex items-center gap-2 rounded-full bg-sky-100/90 border border-sky-300 px-5 py-2.5 text-sm font-semibold text-sky-800 shadow-sm">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
        We are working on it — coming soon!
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

