import type { ReactNode } from "react";

const SEVERITY_CLASS: Record<string, string> = {
  critical: "bg-red-100 text-red-900 border-red-200",
  high: "bg-orange-100 text-orange-900 border-orange-200",
  medium: "bg-amber-100 text-amber-900 border-amber-200",
  low: "bg-slate-100 text-slate-800 border-slate-200",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium uppercase ${SEVERITY_CLASS[severity] ?? SEVERITY_CLASS.low}`}
    >
      {severity}
    </span>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="font-semibold">Backstop Operator</div>
          <nav className="flex gap-4 text-sm">
            <a href="/" className="hover:underline">
              Work queue
            </a>
            <a href="/upload" className="hover:underline">
              Upload CSV
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
