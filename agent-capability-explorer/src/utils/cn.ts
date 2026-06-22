import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatScore(score: number): string {
  return score.toFixed(1);
}

export function statusColor(status: string): string {
  switch (status) {
    case 'PASS': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'PARTIAL': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    case 'FAIL': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
  }
}

export function categoryGradient(category: string): string {
  switch (category) {
    case 'basics': return 'from-blue-500/20 to-violet-500/20';
    case 'intermediate': return 'from-violet-500/20 to-purple-500/20';
    case 'advanced': return 'from-purple-500/20 to-fuchsia-500/20';
    case 'devops': return 'from-cyan-500/20 to-blue-500/20';
    default: return 'from-zinc-500/20 to-zinc-600/20';
  }
}
