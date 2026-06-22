import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useKeyboardShortcuts } from '../../hooks/useAgents';
import { CommandPalette } from '../features/CommandPalette';
import { SearchModal } from '../features/SearchModal';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';

const titles: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'AgentAtlas', subtitle: 'A map of timed agent evaluation tasks — from repo discovery to DevOps' },
  '/agents': { title: 'Agents', subtitle: 'Browse all agent specifications and capabilities' },
  '/explore': { title: 'Agents', subtitle: 'Browse all agent specifications and capabilities' },
  '/services': { title: 'Services', subtitle: 'Polyglot implementations across the task catalog' },
  '/outputs': { title: 'Outputs', subtitle: 'Generated reports, inventories, and execution artifacts' },
  '/readmes': { title: 'READMEs', subtitle: 'Task documentation with GitHub-style rendering' },
};

function matchMeta(pathname: string) {
  if (pathname.startsWith('/agent/')) return { title: 'Agent Detail', subtitle: 'Requirements, artifacts, and implementation' };
  if (pathname.startsWith('/doc/')) return { title: 'Document', subtitle: 'Markdown documentation viewer' };
  return titles[pathname] ?? { title: 'AgentAtlas' };
}

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { pathname } = useLocation();
  const meta = matchMeta(pathname);

  const handlers = useCallback(() => ({
    onSearch: () => setSearchOpen(true),
    onCommandPalette: () => setCommandOpen(true),
  }), []);

  useKeyboardShortcuts(handlers());

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-zinc-950 to-zinc-950" />
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onSearchOpen={() => setSearchOpen(true)}
          onCommandOpen={() => setCommandOpen(true)}
        />
        <main className="flex-1 overflow-auto px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <PageTransition key={pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
