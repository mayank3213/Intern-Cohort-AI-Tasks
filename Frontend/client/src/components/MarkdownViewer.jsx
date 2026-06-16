import { useCallback, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Maximize2, Minimize2, Check } from 'lucide-react';
import MermaidBlock from './MermaidBlock';

export default function MarkdownViewer({ content, filename, dark, onClose }) {
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [content, filename]);

  const components = {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match?.[1];
      const codeStr = String(children).replace(/\n$/, '');

      if (!inline && lang === 'mermaid') {
        return <MermaidBlock chart={codeStr} dark={dark} />;
      }

      if (!inline && match) {
        return (
          <SyntaxHighlighter
            style={oneDark}
            language={lang}
            PreTag="div"
            customStyle={{ borderRadius: '0.5rem', margin: '1rem 0', fontSize: '0.85rem' }}
            {...props}
          >
            {codeStr}
          </SyntaxHighlighter>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  const toolbar = (
    <div className="flex items-center gap-1 border-b border-surface-border px-4 py-2">
      <span className="mr-auto truncate text-sm font-medium text-slate-600 dark:text-slate-300">
        {filename}
      </span>
      <button
        type="button"
        className={`btn-icon ${copied ? 'copy-flash text-green-600' : ''}`}
        onClick={handleCopy}
        title="Copy Markdown"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
      <button type="button" className="btn-icon" onClick={handleDownload} title="Download .md">
        <Download className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="btn-icon"
        onClick={() => setFullscreen((f) => !f)}
        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
      {onClose && (
        <button type="button" className="btn-icon text-red-500" onClick={onClose} title="Close tab">
          ×
        </button>
      )}
    </div>
  );

  const body = (
    <article className="prose prose-slate max-w-none p-6 dark:prose-invert prose-headings:scroll-mt-4 prose-pre:p-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );

  if (fullscreen) {
    return (
      <div className="markdown-fullscreen">
        <div className="panel mx-auto max-w-5xl">
          {toolbar}
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      {toolbar}
      <div className="flex-1 overflow-auto">{body}</div>
    </div>
  );
}
