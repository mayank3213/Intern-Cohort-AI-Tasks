import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen, Bot, ChevronDown, FileOutput, FileText, Home, Server, Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { agents } from '../../data/generated/agents';
import { cn } from '../../utils/cn';
import { Separator } from '../ui/separator';

const mainNav = [
  { to: '/', label: 'Home', icon: Home },
];

const sections = [
  {
    id: 'agents',
    label: 'Agents',
    emoji: '🤖',
    icon: Bot,
    to: '/agents',
    items: agents.map((a) => ({
      to: `/agent/${a.id}`,
      label: `${a.taskId} ${a.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 24)}`,
      short: a.taskId,
    })),
  },
  {
    id: 'services',
    label: 'Services',
    emoji: '⚙',
    icon: Server,
    to: '/services',
    items: [],
  },
  {
    id: 'outputs',
    label: 'Outputs',
    emoji: '📄',
    icon: FileOutput,
    to: '/outputs',
    items: [],
  },
  {
    id: 'readmes',
    label: 'READMEs',
    emoji: '📚',
    icon: BookOpen,
    to: '/readmes',
    items: [],
  },
  {
    id: 'requirements',
    label: 'Requirements',
    emoji: '📋',
    icon: FileText,
    to: '/agents',
    items: [],
  },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ agents: true });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20">
            <Sparkles className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">AgentAtlas</p>
            <p className="text-[11px] text-zinc-500">Agent evaluation tasks</p>
          </div>
        </div>
      </div>

      <Separator className="bg-zinc-800/60" />

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {mainNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
              isActive
                ? 'bg-gradient-to-r from-violet-600/15 to-blue-600/10 text-violet-200 shadow-sm'
                : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-100',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Catalog</p>

          {sections.map((section) => (
            <div key={section.id} className="mb-1">
              <div className="flex items-center">
                <NavLink
                  to={section.to}
                  className={({ isActive }) => cn(
                    'flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all',
                    isActive
                      ? 'bg-zinc-900/80 text-zinc-100'
                      : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200',
                  )}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  <span>{section.emoji} {section.label}</span>
                </NavLink>
                {section.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggle(section.id)}
                    className="mr-2 rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-400"
                  >
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', expanded[section.id] && 'rotate-180')} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {section.items.length > 0 && expanded[section.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-4 space-y-0.5 border-l border-zinc-800/60 py-1 pl-3">
                      {section.items.slice(0, 12).map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) => cn(
                            'block rounded-lg px-2 py-1.5 text-xs transition-colors',
                            isActive ? 'text-violet-300 bg-violet-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50',
                          )}
                        >
                          <span className="font-mono text-zinc-600">{item.short}</span>{' '}
                          {item.label.replace(item.short, '').trim()}
                        </NavLink>
                      ))}
                      {section.items.length > 12 && (
                        <NavLink to={section.to} className="block px-2 py-1 text-xs text-violet-400 hover:text-violet-300">
                          View all {section.items.length} →
                        </NavLink>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </nav>

      <Separator className="bg-zinc-800/60" />
      <div className="p-4">
        <p className="text-[11px] text-zinc-600 leading-relaxed">
          {agents.length} agents · showcase mode
        </p>
      </div>
    </aside>
  );
}
