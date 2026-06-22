import { useEffect, useId, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

export function MermaidBlock({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
      initialized = true;
    }
    let cancelled = false;
    (async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, chart.trim());
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to render diagram');
      }
    })();
    return () => { cancelled = true; };
  }, [chart, id]);

  if (error) return <pre className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-300">{error}</pre>;
  return <div ref={ref} className="my-4 flex justify-center overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 [&_svg]:max-w-full" />;
}
