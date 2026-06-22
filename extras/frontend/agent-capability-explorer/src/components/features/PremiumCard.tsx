import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface PremiumCardProps {
  to?: string;
  onClick?: () => void;
  icon?: ReactNode;
  badge?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  footer?: ReactNode;
  index?: number;
  className?: string;
  glow?: 'violet' | 'blue' | 'emerald' | 'amber';
}

const glowMap = {
  violet: 'hover:shadow-violet-500/10 hover:border-violet-500/40',
  blue: 'hover:shadow-blue-500/10 hover:border-blue-500/40',
  emerald: 'hover:shadow-emerald-500/10 hover:border-emerald-500/40',
  amber: 'hover:shadow-amber-500/10 hover:border-amber-500/40',
};

export function PremiumCard({
  to,
  onClick,
  icon,
  badge,
  title,
  description,
  meta,
  footer,
  index = 0,
  className,
  glow = 'violet',
}: PremiumCardProps) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl border border-zinc-800/80',
        'bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90',
        'backdrop-blur-xl shadow-lg shadow-black/20',
        'transition-all duration-300',
        glowMap[glow],
        (to || onClick) && 'cursor-pointer',
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-3xl transition-all duration-500 group-hover:bg-violet-500/20" />

      <div className="relative flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/60 text-lg shadow-inner">
              {icon}
            </div>
          )}
          {badge}
        </div>

        <div className="mt-4 flex-1">
          <h3 className="text-base font-semibold tracking-tight text-zinc-50 group-hover:text-white">{title}</h3>
          {description && (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">{description}</p>
          )}
          {meta && <div className="mt-3">{meta}</div>}
        </div>

        {footer && (
          <div className="mt-4 border-t border-zinc-800/60 pt-4">{footer}</div>
        )}
      </div>
    </motion.div>
  );

  if (to) return <Link to={to} className="block h-full">{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="block h-full w-full text-left">{inner}</button>;
  return inner;
}
