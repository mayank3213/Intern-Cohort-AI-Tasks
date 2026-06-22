import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { PremiumCard } from '../components/features/PremiumCard';
import { Badge } from '../components/ui/badge';
import { useReadmes } from '../hooks/useCatalog';

export function ReadmesPage() {
  const readmes = useReadmes();

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium text-violet-400">📚 READMEs</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Task documentation</h2>
        <p className="mt-3 max-w-2xl text-zinc-400 leading-relaxed">
          GitHub-style README files for every task — goals, setup, commands, and architecture notes.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {readmes.map((readme, i) => (
          <PremiumCard
            key={readme.id}
            to={`/doc/${encodeURIComponent(readme.path)}`}
            index={i}
            glow="amber"
            icon={<span className="text-xl">{readme.categoryEmoji}</span>}
            badge={<Badge variant="outline" className="font-mono text-[10px]">{readme.taskId}</Badge>}
            title={readme.title}
            description={`${readme.category} task README`}
            footer={
              <div className="flex items-center gap-2 text-sm text-amber-400/80">
                <BookOpen className="h-3.5 w-3.5" />
                Read documentation
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
