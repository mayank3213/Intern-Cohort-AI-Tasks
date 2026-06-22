import { Check, Copy, Terminal } from 'lucide-react';
import { useCopyCommand } from '../../hooks/useAgents';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

export function CommandBlock({ command, label }: { command: string; label?: string }) {
  const { copy, isCopied } = useCopyCommand();
  return (
    <div className="group relative overflow-hidden rounded-xl border border-emerald-900/30 bg-zinc-950/90 shadow-lg">
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Terminal className="h-3.5 w-3.5 text-emerald-400" />
          {label ?? 'Command'}
        </div>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(command)} aria-label="Copy command">
          {isCopied(command) ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className={cn('overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-emerald-100/90')}>
        <code>{command}</code>
      </pre>
    </div>
  );
}
