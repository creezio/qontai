"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { InternalTabBar } from "@/components/internal-tab-bar";
import { TopbarBreadcrumb } from "@/components/topbar-breadcrumb";
import { WorkspaceTabsProvider, useWorkspaceTabs } from "@/components/workspace-tabs-store";

type CachedPanel = {
  path: string;
  node: React.ReactNode;
};

function WorkspaceShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { tabs, activePath, updateTabLabel, tabsHydrated } = useWorkspaceTabs();
  const [panels, setPanels] = useState<CachedPanel[]>([{ path: pathname, node: children }]);

  useEffect(() => {
    setPanels((prev) => {
      const idx = prev.findIndex((p) => p.path === pathname);
      if (idx >= 0) return prev;
      const next = [...prev, { path: pathname, node: children }];
      return next.slice(-12);
    });
  }, [pathname, children]);

  useEffect(() => {
    if (!tabsHydrated || tabs.length === 0) return;
    setPanels((prev) => prev.filter((p) => tabs.some((t) => t.path === p.path)));
  }, [tabs, tabsHydrated]);

  const visiblePath =
    panels.some((p) => p.path === activePath) ? activePath
    : panels.some((p) => p.path === pathname) ? pathname
    : panels[0]?.path ?? "/";

  const renderedPanels = useMemo(() => {
    return panels.map((panel) => (
      <div
        key={panel.path}
        className={panel.path === visiblePath ? "block min-h-0 flex-1 overflow-auto" : "hidden min-h-0 flex-1 overflow-auto"}
      >
        {panel.node}
      </div>
    ));
  }, [panels, visiblePath]);

  return (
    <div className="flex min-h-screen">
      <AppNav />
      <div className="min-w-0 flex flex-1 flex-col">
        <InternalTabBar />
        <TopbarBreadcrumb tabs={tabs} onResolveTabLabel={updateTabLabel} />
        <div className="min-h-0 flex-1">{renderedPanels}</div>
      </div>
    </div>
  );
}

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceTabsProvider>
      <WorkspaceShellInner>{children}</WorkspaceShellInner>
    </WorkspaceTabsProvider>
  );
}

