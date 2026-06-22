import { useCallback, useEffect, useMemo, useState } from 'react';
import { agents } from '../data/generated/agents';
import type { Agent, FilterCategory } from '../data/types';

export interface AgentFilters {
  category: FilterCategory;
  status: 'all';
  search: string;
}

const THEME_KEY = 'ace-theme';

export function useAgents() {
  return useMemo(() => agents, []);
}

export function useAgent(id: string | undefined) {
  return useMemo(() => agents.find((a) => a.id === id), [id]);
}

export function useFilteredAgents(filters: AgentFilters) {
  return useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return agents.filter((agent) => {
      if (filters.category !== 'all' && agent.category !== filters.category) return false;
      if (!q) return true;
      return (
        agent.taskId.toLowerCase().includes(q) ||
        agent.name.toLowerCase().includes(q) ||
        agent.title.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        agent.languages.some((l) => l.toLowerCase().includes(q)) ||
        agent.frameworks.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [filters]);
}

export function useFeaturedAgents(count = 6) {
  return useMemo(
    () => [...agents].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, count),
    [count],
  );
}

export function useTheme() {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme, setTheme: setThemeState };
}

export function useCopyCommand() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      window.setTimeout(() => setCopied(null), 2000);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { copy, copied, isCopied: (text: string) => copied === text };
}

export function useKeyboardShortcuts(handlers: {
  onSearch?: () => void;
  onCommandPalette?: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== 'k') return;
      e.preventDefault();
      if (e.shiftKey) handlers.onCommandPalette?.();
      else handlers.onSearch?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

export function getAgentCommand(agent: Agent): string {
  return `Run the ${agent.title} agent (${agent.name}) on this repository.`;
}

export function getAgentRunCommand(agent: Agent): string {
  return `Follow ${agent.name}.md: scan, execute, and return the full structured report.`;
}
