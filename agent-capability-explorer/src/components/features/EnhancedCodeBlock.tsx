import { Check, ChevronDown, ChevronRight, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useCopyCommand } from '../../hooks/useAgents';
import { cn } from '../../utils/cn';
import { Button } from '../ui/button';

interface EnhancedCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  terminal?: boolean;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function EnhancedCodeBlock({
  code,
  language,
  filename,
  terminal = false,
  collapsible = false,
  defaultOpen = true,
}: EnhancedCodeBlockProps) {
  const { copy, isCopied } = useCopyCommand();
  const [open, setOpen] = useState(defaultOpen);
  const isTerminal = terminal || language === 'bash' || language === 'sh' || language === 'shell' || language === 'zsh';

  const header = (
    <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/80 px-4 py-2">
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {collapsible && (
          <button type="button" onClick={() => setOpen((v) => !v)} className="rounded p-0.5 hover:bg-zinc-800">
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        )}
        {isTerminal && <Terminal className="h-3.5 w-3.5 text-emerald-400" />}
        {filename ? (
          <span className="rounded-md border border-zinc-700/60 bg-zinc-800/60 px-2 py-0.5 font-mono text-zinc-300">{filename}</span>
        ) : language ? (
          <span className="font-mono uppercase tracking-wider">{language}</span>
        ) : (
          <span>Code</span>
        )}
      </div>
      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(code)} aria-label="Copy code">
        {isCopied(code) ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );

  return (
    <div className={cn('my-4 overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-950/90 shadow-lg', isTerminal && 'border-emerald-900/30')}>
      {header}
      {(!collapsible || open) && (
        <pre className={cn('overflow-x-auto p-4 text-[13px] leading-relaxed', isTerminal ? 'font-mono text-emerald-100/90' : 'text-zinc-300')}>
          <code className="hljs">{code}</code>
        </pre>
      )}
    </div>
  );
}
