import type { ReactNode } from "react";
import { cn } from "../cn";

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

export function AppShell({
  title,
  nav,
  children,
  className,
}: {
  title: string;
  nav: NavLink[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--bs-surface)]">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="text-base font-semibold text-[color:var(--bs-navy)]">{title}</div>
          <nav className="flex gap-1 sm:gap-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  item.active
                    ? "bg-[color:var(--bs-navy)] text-white"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className={cn("mx-auto max-w-5xl px-4 py-5 sm:py-6", className)}>{children}</main>
    </div>
  );
}
