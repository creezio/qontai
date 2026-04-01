"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { WorkspaceTab } from "@/components/workspace-tabs-store";

type Crumb = { href: string; label: string };

function labelForStaticPath(path: string): string | null {
  const m: Record<string, string> = {
    "/": "Tableau de bord",
  };
  return m[path] ?? null;
}

export function TopbarBreadcrumb({
  tabs,
}: {
  tabs: WorkspaceTab[];
  onResolveTabLabel?: (path: string, label: string) => void;
}) {
  const pathname = usePathname() || "/";

  const crumbs = useMemo<Crumb[]>(() => {
    const p = pathname || "/";
    if (p === "/") return [{ href: "/", label: "Tableau de bord" }];
    const segs = p.split("/").filter(Boolean);
    const out: Crumb[] = [{ href: "/", label: "Tableau de bord" }];
    let built = "";
    for (let i = 0; i < segs.length; i += 1) {
      built += `/${segs[i]}`;
      const staticLabel = labelForStaticPath(built);
      const isLast = i === segs.length - 1;
      if (staticLabel) {
        out.push({ href: built, label: staticLabel });
      } else if (isLast) {
        const fromTabs = tabs.find((t) => t.path === p)?.label;
        out.push({ href: built, label: fromTabs || segs[i] });
      }
    }
    return out;
  }, [pathname, tabs]);

  return (
    <div className="border-b border-stone-200 bg-white px-4 py-2.5">
      <nav className="flex items-center gap-1.5 text-sm text-stone-600" aria-label="Fil d'Ariane">
        {crumbs.map((c, idx) => {
          const last = idx === crumbs.length - 1;
          return (
            <div key={`${c.href}-${c.label}`} className="flex items-center gap-1.5">
              {last ? (
                <span className="font-medium text-stone-900">{c.label}</span>
              ) : (
                <Link href={c.href} className="hover:text-stone-900 hover:underline underline-offset-2">
                  {c.label}
                </Link>
              )}
              {!last && <span className="text-stone-400">/</span>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

