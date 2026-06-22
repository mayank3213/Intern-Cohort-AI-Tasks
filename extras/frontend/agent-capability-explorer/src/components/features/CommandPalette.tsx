import { Command } from 'cmdk';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchIndex } from '../../hooks/useCatalog';
import { getAgentCommand } from '../../hooks/useAgents';
import { agents } from '../../data/generated/agents';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const index = useSearchIndex();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return index.slice(0, 15);
    return index.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.subtitle.toLowerCase().includes(q) ||
      r.keywords.some((k) => k.toLowerCase().includes(q)),
    ).slice(0, 20);
  }, [index, search]);

  const run = (action: () => void) => {
    onOpenChange(false);
    setSearch('');
    action();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md" />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-[10%] z-50 w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
          >
            <Command label="Command palette" className="flex flex-col">
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Navigate, search, or copy commands..."
                className="w-full border-b border-zinc-800/80 bg-transparent px-5 py-4 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
              />
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="px-4 py-8 text-center text-sm text-zinc-500">No results found.</Command.Empty>

                <Command.Group heading="Navigation" className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {[
                    { v: 'home', l: 'Home', to: '/' },
                    { v: 'agents', l: 'Agents', to: '/agents' },
                    { v: 'services', l: 'Services', to: '/services' },
                    { v: 'outputs', l: 'Outputs', to: '/outputs' },
                    { v: 'readmes', l: 'READMEs', to: '/readmes' },
                  ].map((item) => (
                    <Command.Item
                      key={item.v}
                      value={item.l}
                      onSelect={() => run(() => navigate(item.to))}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-zinc-200 aria-selected:bg-zinc-800/80"
                    >
                      {item.l}
                    </Command.Item>
                  ))}
                </Command.Group>

                {filtered.length > 0 && (
                  <Command.Group heading="Search Results" className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {filtered.map((result) => (
                      <Command.Item
                        key={result.id}
                        value={`${result.title} ${result.subtitle}`}
                        onSelect={() => run(() => navigate(result.href))}
                        className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-zinc-200 aria-selected:bg-zinc-800/80"
                      >
                        <span className="text-zinc-500 text-xs mr-2">[{result.type}]</span>
                        {result.title}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Copy Commands" className="mt-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  {agents.slice(0, 5).map((agent) => (
                    <Command.Item
                      key={`cmd-${agent.id}`}
                      value={`copy ${agent.name}`}
                      onSelect={() => run(() => navigator.clipboard.writeText(getAgentCommand(agent)))}
                      className="cursor-pointer rounded-xl px-3 py-2.5 text-sm text-zinc-200 aria-selected:bg-zinc-800/80"
                    >
                      Copy command for {agent.taskId}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
