import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '../../utils/cn';
import { extractToc } from '../../utils/markdown';
import { ScrollArea } from '../ui/scroll-area';

interface DocLayoutProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export function DocLayout({ content, children, className }: DocLayoutProps) {
  const toc = useMemo(() => extractToc(content), [content]);
  const [activeId, setActiveId] = useState(toc[0]?.id ?? '');

  useEffect(() => {
    if (!toc.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );
    for (const item of toc) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [toc]);

  return (
    <div className={cn('relative flex gap-10', className)}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-w-0 flex-1"
      >
        {children}
      </motion.div>

      {toc.length > 2 && (
        <aside className="hidden w-56 shrink-0 xl:block">
          <div className="sticky top-24">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">On this page</p>
            <ScrollArea className="max-h-[calc(100vh-8rem)]">
              <nav className="space-y-1 border-l border-zinc-800 pl-3">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      'block py-1 text-sm transition-colors hover:text-violet-300',
                      item.level === 2 && 'pl-0',
                      item.level === 3 && 'pl-3 text-xs',
                      activeId === item.id ? 'text-violet-400 font-medium' : 'text-zinc-500',
                    )}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </ScrollArea>
          </div>
        </aside>
      )}
    </div>
  );
}
