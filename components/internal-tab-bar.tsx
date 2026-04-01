"use client";

import { useWorkspaceTabs } from "@/components/workspace-tabs-store";

export function InternalTabBar() {
  const { tabs, activePath, activateTab, closeTab } = useWorkspaceTabs();

  return (
    <div className="border-b border-stone-200 bg-[#fbfbfa]">
      <div className="flex gap-1 overflow-x-auto px-3 py-1.5">
        {tabs.map((tab) => {
          const active = tab.path === activePath;
          return (
            <div
              key={tab.path}
              className={[
                "group flex shrink-0 items-center rounded-md border px-2 py-1 text-sm",
                active
                  ? "border-stone-300 bg-white text-stone-900"
                  : "border-transparent bg-stone-100 text-stone-700 hover:bg-stone-200",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => activateTab(tab.path)}
                className="max-w-56 truncate text-left"
                title={tab.label}
              >
                {tab.label}
              </button>
              <button
                type="button"
                onClick={() => closeTab(tab.path)}
                className="ml-2 rounded px-1 text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                aria-label={`Fermer ${tab.label}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

