import { useMemo } from 'react';
import { agents } from '../data/generated/agents';
import {
  buildSearchIndex,
  getOutputs,
  getReadmes,
  getRecentOutputs,
  getRequirementsAgents,
  getServices,
  groupAgentsByCategory,
  type SearchResult,
} from '../utils/catalog';

export function useServices() {
  return useMemo(() => getServices(), []);
}

export function useOutputs() {
  return useMemo(() => getOutputs(), []);
}

export function useReadmes() {
  return useMemo(() => getReadmes(), []);
}

export function useRecentOutputs(count = 6) {
  return useMemo(() => getRecentOutputs(count), [count]);
}

export function useRequirementsAgents() {
  return useMemo(() => getRequirementsAgents(), []);
}

export function useAgentsByCategory() {
  return useMemo(() => groupAgentsByCategory(), []);
}

export function useSearchIndex() {
  return useMemo(() => buildSearchIndex(), []);
}

export function useGlobalSearch(query: string, limit = 16): SearchResult[] {
  const index = useSearchIndex();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return index.filter((r) => r.type === 'agents').slice(0, limit);
    return index
      .filter((r) =>
        r.title.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q) ||
        r.keywords.some((k) => k.toLowerCase().includes(q)),
      )
      .slice(0, limit);
  }, [index, query, limit]);
}

export function useCategoryAgents(category: string) {
  return useMemo(() => agents.filter((a) => a.category === category), [category]);
}
