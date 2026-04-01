"use client";

import { usePathname } from "next/navigation";
import { useWorkspaceTabs } from "@/components/workspace-tabs-store";

type NavItem = { href: string; label: string; exact?: boolean };
type NavSection = { title: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/", label: "Tableau de bord", exact: true },
      { href: "/login", label: "Connexion" },
    ],
  },
  {
    title: "MVP",
    items: [
      { href: "/wizard", label: "Entrée en relation (wizard)" },
      { href: "/operations-atypiques", label: "Opérations atypiques" },
      { href: "/ged", label: "GED" },
      { href: "/tracfin", label: "Coffre-fort TRACFIN" },
    ],
  },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href.includes("[")) {
    const prefix = item.href.split("[")[0];
    return pathname.startsWith(prefix);
  }
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppNav() {
  const pathname = usePathname() || "/";
  const { openTab } = useWorkspaceTabs();

  return (
    <aside className="sticky top-0 h-screen w-72 shrink-0 overflow-y-auto border-r border-stone-200 bg-[#fbfbfa]">
      <div className="px-3 py-4">
        <button
          type="button"
          onClick={() => openTab("/", "Tableau de bord")}
          className="mb-4 block rounded-md px-2 py-1 text-sm font-semibold tracking-tight text-stone-900 hover:bg-stone-100"
        >
          Qontai
        </button>
        <nav className="space-y-3 text-sm">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-stone-500">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const nested = item.href.split("/").length > 2;
                  return (
                    <li key={item.href}>
                      <button
                        type="button"
                        onClick={() => openTab(item.href, item.label)}
                        className={[
                          "block w-full rounded-md py-1.5 pr-2 text-left text-stone-700 hover:bg-stone-100 hover:text-stone-900",
                          nested ? "pl-6" : "pl-2",
                          active ? "bg-stone-200/70 font-medium text-stone-900" : "",
                        ].join(" ")}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}

