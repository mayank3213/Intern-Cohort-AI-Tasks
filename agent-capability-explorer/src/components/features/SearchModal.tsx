import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { BookOpen, Bot, FileOutput, FileText, Search, Server, Terminal, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../../hooks/useCatalog';
import type { SearchResult } from '../../utils/catalog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const typeIcons: Record<string, typeof Bot> = {
  agents: Bot,
  services: Server,
  outputs: FileOutput,
  readmes: BookOpen,
  requirements: FileText,
  command: Terminal,
  markdown: FileText,
};

const typeLabels: Record<string, string> = {
  agents: 'Agent',
  services: 'Service',
  outputs: 'Output',
  readmes: 'README',
  requirements: 'Requirements',
  command: 'Command',
  markdown: 'Markdown',
};

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const results = useGlobalSearch(query, 20);

  const select = (result: SearchResult) => {
    onOpenChange(false);
    setQuery('');
    navigate(result.href);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[12%] z-50 w-full max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/95 shadow-2xl shadow-violet-900/10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 border-b border-zinc-800/80 px-5 py-4">
              <Search className="h-5 w-5 text-zinc-500" />
              <Input
                className="border-0 bg-transparent text-base focus-visible:ring-0"
                placeholder="Search agents, services, outputs, READMEs, commands..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <Dialog.Close asChild>
                <button type="button" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <ScrollArea className="max-h-[28rem]">
              <ul className="p-2">
                {results.map((result, i) => {
                  const Icon = typeIcons[result.type] ?? FileText;
                  return (
                    <motion.li
                      key={result.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.02 }}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition-colors hover:bg-zinc-800/60"
                        onClick={() => select(result)}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700/50 bg-zinc-800/50">
                          <Icon className="h-4 w-4 text-violet-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-100">{result.title}</p>
                          <p className="truncate text-xs text-zinc-500">{result.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px]">{typeLabels[result.type] ?? result.type}</Badge>
                      </button>
                    </motion.li>
                  );
                })}
                {results.length === 0 && (
                  <li className="px-4 py-12 text-center text-sm text-zinc-500">No results found</li>
                )}
              </ul>
            </ScrollArea>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
