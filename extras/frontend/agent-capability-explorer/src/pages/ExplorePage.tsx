import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgentCard } from '../components/features/AgentCard';
import { FilterBar } from '../components/features/FilterBar';
import type { AgentFilters } from '../hooks/useAgents';
import { useFilteredAgents } from '../hooks/useAgents';

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [filters, setFilters] = useState<AgentFilters>({
    category: (categoryParam as AgentFilters['category']) || 'all',
    status: 'all',
    search: '',
  });
  const agents = useFilteredAgents(filters);

  const grouped = useMemo(() => {
    if (filters.category !== 'all') return null;
    const groups: Record<string, typeof agents> = {};
    for (const agent of agents) {
      if (!groups[agent.categoryLabel]) groups[agent.categoryLabel] = [];
      groups[agent.categoryLabel].push(agent);
    }
    return groups;
  }, [agents, filters.category]);

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium text-violet-400">🤖 Agents</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Agent catalog</h2>
        <p className="mt-3 max-w-2xl text-zinc-400 leading-relaxed">
          Structured specifications for repository analysis, discovery, execution, and infrastructure automation.
        </p>
      </motion.div>

      <FilterBar filters={filters} onChange={setFilters} />

      {grouped ? (
        Object.entries(grouped).map(([label, items]) => (
          <section key={label}>
            <h3 className="mb-5 text-lg font-semibold text-zinc-200">{label}</h3>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
            </div>
          </section>
        ))
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
        </div>
      )}
    </div>
  );
}
