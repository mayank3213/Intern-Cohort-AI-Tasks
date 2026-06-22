import { Command, Moon, Search, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useAgents';
import { Button } from '../ui/button';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onSearchOpen: () => void;
  onCommandOpen: () => void;
}

export function Header({ title, subtitle, onSearchOpen, onCommandOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-30 flex flex-col gap-4 border-b border-zinc-800/60 bg-zinc-950/80 px-8 py-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="rounded-xl border-zinc-800/80 bg-zinc-900/50" onClick={onSearchOpen}>
          <Search className="h-4 w-4" /> Search
          <kbd className="ml-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">⌘K</kbd>
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl border-zinc-800/80 bg-zinc-900/50" onClick={onCommandOpen}>
          <Command className="h-4 w-4" /> Commands
          <kbd className="ml-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">⇧⌘K</kbd>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
    </header>
  );
}
