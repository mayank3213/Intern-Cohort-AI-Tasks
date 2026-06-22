import type { AgentEvidence } from '../../data/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CommandBlock } from './CommandBlock';

interface EvidencePanelProps {
  evidence: AgentEvidence;
  proofImages?: string[];
}

export function EvidencePanel({ evidence, proofImages = [] }: EvidencePanelProps) {
  const hasContent = evidence.commands.length || evidence.commits.length || evidence.testResults.length || evidence.risks || evidence.verification || proofImages.length;
  if (!hasContent) return <p className="text-sm text-zinc-500">No evidence captured for this agent yet.</p>;

  return (
    <div className="space-y-4">
      {proofImages.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Proof Screenshots</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {proofImages.map((img) => (
                <figure key={img} className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
                  <img src={`/task-assets/${img}`} alt={img.split('/').pop()} className="w-full object-cover" loading="lazy" />
                  <figcaption className="px-3 py-2 text-xs text-zinc-500 font-mono">{img.split('/').pop()}</figcaption>
                </figure>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {evidence.commands.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Commands Executed</CardTitle></CardHeader>
          <CardContent className="space-y-3">{evidence.commands.map((cmd) => <CommandBlock key={cmd} command={cmd} />)}</CardContent></Card>
      )}
      {evidence.commits.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Commit Hashes</CardTitle></CardHeader>
          <CardContent><ul className="space-y-1 text-sm text-zinc-300">{evidence.commits.map((c) => <li key={c} className="font-mono">{c}</li>)}</ul></CardContent></Card>
      )}
      {evidence.testResults.length > 0 && (
        <Card><CardHeader><CardTitle className="text-base">Test Results</CardTitle></CardHeader>
          <CardContent><ul className="space-y-1 text-sm text-zinc-300">{evidence.testResults.map((t) => <li key={t}>{t}</li>)}</ul></CardContent></Card>
      )}
      {evidence.risks && (
        <Card><CardHeader><CardTitle className="text-base">Risk Notes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-300 whitespace-pre-wrap">{evidence.risks}</p></CardContent></Card>
      )}
      {evidence.verification && (
        <Card><CardHeader><CardTitle className="text-base">Verification Commands</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-zinc-300 whitespace-pre-wrap">{evidence.verification}</p></CardContent></Card>
      )}
    </div>
  );
}
