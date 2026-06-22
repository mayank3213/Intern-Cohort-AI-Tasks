import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { agents } from '../data/generated/agents';
import { cn } from '../utils/cn';
import { StatusBadge } from '../components/features/StatusBadge';

const GRID = [
  { prefix: 'B', label: 'Basics', category: 'basics' },
  { prefix: 'I', label: 'Intermediate', category: 'intermediate' },
  { prefix: 'A', label: 'Advanced', category: 'advanced' },
  { prefix: 'D', label: 'DevOps', category: 'devops' },
];

function cellAgent(prefix: string, num: number) {
  const taskId = `${prefix}${num}`;
  return agents.find((a) => a.taskId === taskId);
}

export function ProgressPage() {
  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">Completion heatmap across the 24-task grid. Click a cell to open the agent detail page.</p>
      {GRID.map((row, ri) => (
        <section key={row.prefix}>
          <h3 className="mb-3 text-sm font-medium text-zinc-300">{row.label}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((n, ci) => {
              const agent = cellAgent(row.prefix, n);
              const completed = agent?.completed ?? false;
              return (
                <motion.div key={`${row.prefix}${n}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: ri * 0.05 + ci * 0.03 }}>
                  {agent ? (
                    <Link to={`/agent/${agent.id}`} className={cn('block rounded-xl border p-4 transition-all hover:scale-[1.02]', completed ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50' : 'border-zinc-800 bg-zinc-900 hover:border-violet-500/40')}>
                      <p className="text-lg font-bold text-zinc-100">{agent.taskId}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{agent.title}</p>
                      <div className="mt-3"><StatusBadge status={agent.status} /></div>
                    </Link>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-zinc-600">{row.prefix}{n}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
