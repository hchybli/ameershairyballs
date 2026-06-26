"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Ingest & check" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b pb-4 text-sm">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "font-medium hover:underline",
            pathname === href ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
