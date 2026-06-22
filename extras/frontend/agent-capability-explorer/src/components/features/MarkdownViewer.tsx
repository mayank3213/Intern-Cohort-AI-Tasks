import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { AlertCircle, Info, Lightbulb, Maximize2, Minimize2 } from 'lucide-react';
import { MermaidBlock } from './MermaidBlock';
import { EnhancedCodeBlock } from './EnhancedCodeBlock';
import { DocLayout } from './DocLayout';
import { slugify } from '../../utils/markdown';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '../../utils/cn';

interface MarkdownViewerProps {
  content: string;
  className?: string;
  allowFullscreen?: boolean;
  showToc?: boolean;
  wide?: boolean;
}


function parseAdmonition(text: string): { type: string; title: string; body: string } | null {
  const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/s);
  if (!match) return null;
  const type = match[1].toLowerCase();
  const rest = match[2].trim();
  const lines = rest.split('\n');
  const title = lines[0] || type;
  const body = lines.slice(1).join('\n').trim() || rest;
  return { type, title, body };
}

const admonitionStyles: Record<string, { border: string; bg: string; icon: typeof Info }> = {
  note: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: Info },
  tip: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: Lightbulb },
  important: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', icon: Info },
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: AlertCircle },
  caution: { border: 'border-red-500/30', bg: 'bg-red-500/5', icon: AlertCircle },
};

function Admonition({ type, title, children }: { type: string; title: string; children: React.ReactNode }) {
  const style = admonitionStyles[type] ?? admonitionStyles.note;
  const Icon = style.icon;
  return (
    <div className={cn('my-6 rounded-xl border p-4', style.border, style.bg)}>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-200">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="text-sm text-zinc-300 [&>p]:m-0">{children}</div>
    </div>
  );
}

export function MarkdownViewer({ content, className, allowFullscreen = true, showToc = true, wide = false }: MarkdownViewerProps) {
  const [fullscreen, setFullscreen] = useState(false);

  const components = useMemo(() => ({
    h1: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      return <h1 id={slugify(text)} className="scroll-mt-24 text-3xl font-bold tracking-tight text-zinc-50">{children}</h1>;
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      return (
        <h2 id={slugify(text)} className="scroll-mt-24 mt-12 border-b border-zinc-800/60 pb-3 text-2xl font-semibold tracking-tight text-zinc-100">
          <a href={`#${slugify(text)}`} className="no-underline hover:text-violet-300">{children}</a>
        </h2>
      );
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      return <h3 id={slugify(text)} className="scroll-mt-24 mt-8 text-xl font-semibold text-zinc-100">{children}</h3>;
    },
    h4: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      return <h4 id={slugify(text)} className="scroll-mt-24 mt-6 text-lg font-medium text-zinc-200">{children}</h4>;
    },
    p: ({ children }: { children?: React.ReactNode }) => {
      const text = String(children);
      const admonition = parseAdmonition(text);
      if (admonition) {
        return (
          <Admonition type={admonition.type} title={admonition.title}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{admonition.body}</ReactMarkdown>
          </Admonition>
        );
      }
      return <p className="leading-7 text-zinc-300">{children}</p>;
    },
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="my-6 border-l-4 border-violet-500/50 bg-zinc-900/50 py-2 pl-4 pr-2 italic text-zinc-400">{children}</blockquote>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="my-6 overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-zinc-900/80">{children}</thead>,
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="border-b border-zinc-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">{children}</th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="border-b border-zinc-800/60 px-4 py-3 text-zinc-300">{children}</td>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => <tr className="transition-colors hover:bg-zinc-900/40">{children}</tr>,
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
      <a href={href} className="font-medium text-violet-400 underline decoration-violet-500/30 underline-offset-2 hover:text-violet-300 hover:decoration-violet-400">{children}</a>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="my-4 list-disc space-y-2 pl-6 text-zinc-300">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="my-4 list-decimal space-y-2 pl-6 text-zinc-300">{children}</ol>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="leading-7">{children}</li>,
    hr: () => <hr className="my-10 border-zinc-800" />,
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <figure className="my-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
        <img src={src} alt={alt ?? ''} className="w-full" loading="lazy" />
        {alt && <figcaption className="px-4 py-2 text-center text-xs text-zinc-500">{alt}</figcaption>}
      </figure>
    ),
    pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    code: ({ className: codeClass, children, ...props }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) => {
      const match = /language-(\w+)/.exec(codeClass || '');
      const lang = match?.[1];
      const text = String(children).replace(/\n$/, '');
      const inline = !codeClass && !text.includes('\n');

      if (lang === 'mermaid') return <MermaidBlock chart={text} />;
      if (inline) {
        return <code className="rounded-md border border-zinc-700/50 bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-300" {...props}>{children}</code>;
      }

      const filenameMatch = text.match(/^\/\/\s*file:\s*(.+)\n/);
      const filename = filenameMatch?.[1];
      const code = filenameMatch ? text.replace(filenameMatch[0], '') : text;

      return (
        <EnhancedCodeBlock
          code={code}
          language={lang}
          filename={filename}
          terminal={lang === 'bash' || lang === 'sh' || lang === 'shell' || lang === 'zsh'}
          collapsible={code.split('\n').length > 12}
        />
      );
    },
  }), []);

  const article = (
    <article className={cn(
      'prose prose-invert max-w-none',
      wide ? 'prose-lg' : 'prose-zinc',
      'prose-headings:font-semibold prose-strong:text-zinc-100',
      className,
    )}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight, rehypeRaw]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );

  const body = showToc ? (
    <DocLayout content={content}>{article}</DocLayout>
  ) : article;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <span className="text-sm text-zinc-400">Document viewer</span>
          <Button size="sm" variant="ghost" onClick={() => setFullscreen(false)}><Minimize2 className="h-4 w-4" /> Exit fullscreen</Button>
        </div>
        <ScrollArea className="flex-1"><div className="mx-auto max-w-5xl p-8">{body}</div></ScrollArea>
      </div>
    );
  }

  return (
    <div className="relative">
      {allowFullscreen && (
        <Button size="icon" variant="ghost" className="absolute right-0 top-0 z-10" onClick={() => setFullscreen(true)} aria-label="Fullscreen">
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
      {body}
    </div>
  );
}

