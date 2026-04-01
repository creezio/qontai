"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

export type WorkspaceTab = {
  path: string;
  label: string;
};

type WorkspaceTabsContextValue = {
  tabs: WorkspaceTab[];
  activePath: string;
  tabsHydrated: boolean;
  openTab: (path: string, label?: string) => void;
  activateTab: (path: string) => void;
  closeTab: (path: string) => void;
  updateTabLabel: (path: string, label: string) => void;
};

const STORAGE_KEY = "qontai_workspace_tabs_v1";
const STORAGE_ACTIVE_KEY = "qontai_workspace_active_tab_v1";
const MAX_TABS = 12;

function inferLabel(path: string): string {
  if (path === "/") return "Tableau de bord";
  return "Page";
}

const WorkspaceTabsContext = createContext<WorkspaceTabsContextValue | null>(null);

function sanitizeTabs(input: WorkspaceTab[]): WorkspaceTab[] {
  const dedup = new Map<string, WorkspaceTab>();
  for (const t of input) {
    if (!t?.path || !t?.label) continue;
    dedup.set(t.path, t);
  }
  return [...dedup.values()].slice(-MAX_TABS);
}

export function WorkspaceTabsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activePath, setActivePath] = useState<string>("/");
  const [tabsHydrated, setTabsHydrated] = useState(false);
  const lastActionRef = useRef<"open" | "activate" | "replace">("replace");
  const hydratedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WorkspaceTab[];
        if (Array.isArray(parsed)) {
          const safe = sanitizeTabs(
            parsed.filter((t) => t && typeof t.path === "string" && typeof t.label === "string")
          );
          setTabs(safe);
        }
      }
      const active = localStorage.getItem(STORAGE_ACTIVE_KEY);
      if (active?.trim()) setActivePath(active.trim());
    } catch {
      // no-op
    } finally {
      hydratedRef.current = true;
      setTabsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!tabsHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs.slice(0, MAX_TABS)));
      localStorage.setItem(STORAGE_ACTIVE_KEY, activePath);
    } catch {
      // no-op
    }
  }, [tabs, activePath, tabsHydrated]);

  useEffect(() => {
    if (!pathname || !hydratedRef.current) return;
    setTabs((prev) => {
      const safePrev = sanitizeTabs(prev);
      if (safePrev.length === 0) {
        setActivePath(pathname);
        return [{ path: pathname, label: inferLabel(pathname) }];
      }
      if (safePrev.some((t) => t.path === pathname)) {
        setActivePath(pathname);
        return safePrev;
      }
      if (lastActionRef.current === "open") {
        setActivePath(pathname);
        return sanitizeTabs([...safePrev, { path: pathname, label: inferLabel(pathname) }]);
      }
      const currentActive = safePrev.find((t) => t.path === activePath) ?? safePrev[safePrev.length - 1];
      const replaced = safePrev.map((t) =>
        t.path === currentActive.path ? { path: pathname, label: inferLabel(pathname) } : t
      );
      setActivePath(pathname);
      return sanitizeTabs(replaced);
    });
    lastActionRef.current = "replace";
  }, [pathname, activePath]);

  const openTab = useCallback(
    (path: string, label?: string) => {
      lastActionRef.current = "open";
      setTabs((prev) => {
        const found = prev.find((t) => t.path === path);
        if (found) {
          setActivePath(path);
          if (!label || found.label === label) return prev;
          return prev.map((t) => (t.path === path ? { ...t, label } : t));
        }
        const next = [...prev, { path, label: label || inferLabel(path) }];
        setActivePath(path);
        return sanitizeTabs(next);
      });
      router.push(path);
    },
    [router]
  );

  const activateTab = useCallback(
    (path: string) => {
      lastActionRef.current = "activate";
      setActivePath(path);
      router.push(path);
    },
    [router]
  );

  const closeTab = useCallback(
    (path: string) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.path === path);
        if (idx < 0) return prev;
        const next = prev.filter((t) => t.path !== path);
        if (path === pathname) {
          const fallback = next[idx - 1]?.path ?? next[idx]?.path ?? next[next.length - 1]?.path ?? "/";
          setActivePath(fallback);
          router.push(fallback);
        } else if (path === activePath) {
          setActivePath(next[next.length - 1]?.path ?? "/");
        }
        return next;
      });
    },
    [pathname, activePath, router]
  );

  const updateTabLabel = useCallback((path: string, label: string) => {
    if (!label.trim()) return;
    setTabs((prev) => prev.map((t) => (t.path === path ? { ...t, label } : t)));
  }, []);

  const value = useMemo<WorkspaceTabsContextValue>(
    () => ({
      tabs,
      activePath: activePath || pathname || "/",
      tabsHydrated,
      openTab,
      activateTab,
      closeTab,
      updateTabLabel,
    }),
    [tabs, activePath, pathname, tabsHydrated, openTab, activateTab, closeTab, updateTabLabel]
  );

  return <WorkspaceTabsContext.Provider value={value}>{children}</WorkspaceTabsContext.Provider>;
}

export function useWorkspaceTabs(): WorkspaceTabsContextValue {
  const ctx = useContext(WorkspaceTabsContext);
  if (!ctx) throw new Error("useWorkspaceTabs must be used within WorkspaceTabsProvider");
  return ctx;
}

