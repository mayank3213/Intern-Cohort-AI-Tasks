import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { timeline } from '../data/generated/agents';
import { StatusBadge } from '../components/features/StatusBadge';

function formatDate(iso: string | null) {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function TimelinePage() {
  const sorted = [...timeline].sort((a, b) => {
    const da = a.updatedAt ?? a.createdAt ?? '';
    const db = b.updatedAt ?? b.createdAt ?? '';
    return db.localeCompare(da);
  });

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-violet-500/50 via-zinc-700 to-transparent" />
      <ul className="space-y-6">
        {sorted.map((entry, i) => {
          const agentId = entry.id;
          return (
            <motion.li key={entry.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="relative pl-10">
              <span className="absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-violet-500 bg-zinc-950" />
              <Link to={`/agent/${agentId}`} className="block rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-violet-500/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-violet-400">{entry.taskId} · {entry.category}</p>
                    <p className="font-medium text-zinc-100">{entry.title}</p>
                  </div>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">{formatDate(entry.updatedAt ?? entry.createdAt)} · {entry.outputs.length} output(s) · {entry.evidenceCount} evidence item(s)</p>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
