import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;

function initMermaid(dark) {
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  });
  mermaidInitialized = true;
}

export default function MermaidBlock({ chart, dark }) {
  const ref = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(null);
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!mermaidInitialized) initMermaid(dark);
    else mermaid.initialize({ theme: dark ? 'dark' : 'default' });
  }, [dark]);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!chart?.trim()) return;
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, chart.trim());
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setSvg('');
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [chart, dark]);

  if (error) {
    return (
      <div className="mermaid-container">
        <pre className="text-xs text-red-500">{error}</pre>
        <pre className="mt-2 text-xs text-slate-500">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="mermaid-container"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
