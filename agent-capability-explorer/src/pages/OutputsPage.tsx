import { motion } from 'framer-motion';
import { FileOutput, FileText } from 'lucide-react';
import { PremiumCard } from '../components/features/PremiumCard';
import { Badge } from '../components/ui/badge';
import { useOutputs } from '../hooks/useCatalog';
import { formatFileSize } from '../utils/catalog';

export function OutputsPage() {
  const outputs = useOutputs();

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium text-violet-400">📄 Outputs</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Generated artifacts</h2>
        <p className="mt-3 max-w-2xl text-zinc-400 leading-relaxed">
          Reports, inventories, execution logs, and verification documents produced by agent runs.
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {outputs.map((output, i) => (
          <PremiumCard
            key={output.id}
            to={`/doc/${encodeURIComponent(output.path)}`}
            index={i}
            glow="emerald"
            icon={<FileOutput className="h-5 w-5 text-emerald-400" />}
            badge={<Badge variant="outline" className="font-mono text-[10px]">{output.taskId}</Badge>}
            title={output.name}
            description={`${output.title} — ${output.category}`}
            meta={
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{formatFileSize(output.size)}</span>
                {output.updatedAt && <span>{new Date(output.updatedAt).toLocaleDateString()}</span>}
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
