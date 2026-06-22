import { Search } from 'lucide-react';
import type { AgentFilters } from '../../hooks/useAgents';
import type { FilterCategory } from '../../data/types';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const categories: { value: FilterCategory; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '✨' },
  { value: 'basics', label: 'Basics', emoji: '📦' },
  { value: 'intermediate', label: 'Intermediate', emoji: '🔧' },
  { value: 'advanced', label: 'Advanced', emoji: '🚀' },
  { value: 'devops', label: 'DevOps', emoji: '☁️' },
];

interface FilterBarProps {
  filters: AgentFilters;
  onChange: (filters: AgentFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <Input
          className="border-zinc-800/80 bg-zinc-900/50 pl-9 backdrop-blur"
          placeholder="Search agents by name, task ID, or technology..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            key={c.value}
            size="sm"
            variant={filters.category === c.value ? 'default' : 'outline'}
            onClick={() => onChange({ ...filters, category: c.value })}
          >
            {c.emoji} {c.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
