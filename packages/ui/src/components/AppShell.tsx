import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "../cn";

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
}

export function AppShell({
  title,
  nav,
  actions,
  children,
  className,
}: {
  title: string;
  nav: NavLink[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--bs-surface)]">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="text-base font-semibold text-[color:var(--bs-navy)]">{title}</div>
          <div className="flex items-center gap-2 sm:gap-3">
            {actions}
            <nav className="flex gap-1 sm:gap-3">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    item.active
                      ? "bg-[color:var(--bs-navy)] text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto max-w-5xl px-4 py-5 sm:py-6", className)}>{children}</main>
    </div>
  );
}
