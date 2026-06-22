import { ArrowLeft, FileText } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getMarkdown } from '../data/generated/content';
import { MarkdownViewer } from '../components/features/MarkdownViewer';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { agents } from '../data/generated/agents';

export function DocViewerPage() {
  const { pathname } = useLocation();
  const path = decodeURIComponent(pathname.replace(/^\/doc\//, ''));
  const content = getMarkdown(path);
  const agent = agents.find((a) => a.files.some((f) => f.path === path));
  const file = agent?.files.find((f) => f.path === path);
  const filename = path.split('/').pop() ?? path;

  if (!content) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-400">Document not found.</p>
        <Button variant="link" asChild className="mt-4"><Link to="/outputs">Back to outputs</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to={file?.type === 'readme' ? '/readmes' : '/outputs'}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <div className="flex flex-wrap items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
          <FileText className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {agent && <Badge variant="outline" className="font-mono">{agent.taskId}</Badge>}
            <Badge variant="secondary">{file?.type ?? 'markdown'}</Badge>
          </div>
          <h2 className="mt-1 text-2xl font-bold text-zinc-50">{filename}</h2>
          {agent && <p className="text-sm text-zinc-500">{agent.title}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8 backdrop-blur">
        <MarkdownViewer content={content} wide showToc allowFullscreen />
      </div>
    </div>
  );
}
