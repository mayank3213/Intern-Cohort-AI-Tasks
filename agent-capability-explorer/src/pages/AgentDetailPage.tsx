import { motion } from 'framer-motion';
import * as Accordion from '@radix-ui/react-accordion';
import { ArrowLeft, ChevronDown, File, FolderOpen } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getMarkdown } from '../data/generated/content';
import { CommandBlock } from '../components/features/CommandBlock';
import { EvidencePanel } from '../components/features/EvidencePanel';
import { MarkdownViewer } from '../components/features/MarkdownViewer';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getAgentCommand, getAgentRunCommand, useAgent } from '../hooks/useAgents';
import { fileTypeLabel, formatFileSize } from '../utils/catalog';
import { getAgentIcon } from '../utils/catalog';

const TAB_VALUES = ['overview', 'requirements', 'artifacts', 'implementation', 'commands', 'notes', 'output'] as const;

export function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const agent = useAgent(id);
  const activeTab = TAB_VALUES.includes(searchParams.get('tab') as typeof TAB_VALUES[number])
    ? (searchParams.get('tab') as string)
    : 'overview';

  const setTab = (tab: string) => setSearchParams({ tab });

  if (!agent) {
    return (
      <div className="py-20 text-center">
        <p className="text-zinc-400">Agent not found.</p>
        <Button variant="link" asChild className="mt-4"><Link to="/agents">Back to agents</Link></Button>
      </div>
    );
  }

  const specMd = agent.agentSpecPath ? getMarkdown(agent.agentSpecPath) : undefined;
  const readmeMd = agent.readmePath ? getMarkdown(agent.readmePath) : undefined;
  const outputMd = agent.primaryOutputPath ? getMarkdown(agent.primaryOutputPath) : undefined;
  const sectionKeys = Object.keys(agent.sections);

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/agents"><ArrowLeft className="h-4 w-4" /> Back to agents</Link>
      </Button>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 text-2xl">
          {getAgentIcon(agent.taskId)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">{agent.taskId}</Badge>
            <Badge variant="secondary">{agent.categoryLabel}</Badge>
            <Badge variant="secondary">{agent.difficulty}</Badge>
          </div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-50">{agent.title}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-400">{agent.description.replace(/\*\*/g, '')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.languages.map((l) => <Badge key={l}>{l}</Badge>)}
            {agent.frameworks.map((f) => <Badge key={f} variant="outline">{f}</Badge>)}
          </div>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setTab}>
        <div className="sticky top-0 z-20 -mx-2 border-b border-zinc-800/60 bg-zinc-950/90 px-2 py-2 backdrop-blur-xl">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-auto w-max min-w-full gap-1 bg-transparent p-0">
              {[
                { v: 'overview', l: 'Overview' },
                { v: 'requirements', l: 'Requirements' },
                { v: 'artifacts', l: 'Artifacts' },
                { v: 'implementation', l: 'Implementation' },
                { v: 'commands', l: 'Commands' },
                { v: 'notes', l: 'Notes' },
                { v: 'output', l: 'Output' },
              ].map((t) => (
                <TabsTrigger key={t.v} value={t.v} className="rounded-lg px-4 py-2">{t.l}</TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </div>

        <TabsContent value="overview" className="mt-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-zinc-800/80 bg-zinc-900/40 lg:col-span-1">
              <CardHeader><CardTitle className="text-base">Agent details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p><span className="text-zinc-500">Name</span><br /><span className="font-mono text-violet-300">{agent.name}</span></p>
                <p><span className="text-zinc-500">Category</span><br />{agent.categoryEmoji} {agent.categoryLabel}</p>
                <p><span className="text-zinc-500">Frameworks</span><br />{agent.frameworks.join(', ') || '—'}</p>
              </CardContent>
            </Card>
            {readmeMd && (
              <Card className="border-zinc-800/80 bg-zinc-900/40 lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">README preview</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/doc/${encodeURIComponent(agent.readmePath!)}`}>Full README →</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <MarkdownViewer content={readmeMd.slice(0, 2000) + (readmeMd.length > 2000 ? '\n\n...' : '')} showToc={false} allowFullscreen={false} />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requirements" className="mt-8">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8">
            {specMd ? <MarkdownViewer content={specMd} wide /> : <p className="text-zinc-500">No agent specification available.</p>}
          </div>
        </TabsContent>

        <TabsContent value="artifacts" className="mt-8">
          <div className="grid gap-3">
            {agent.files.map((f, i) => (
              <motion.div key={f.path} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="border-zinc-800/80 bg-zinc-900/40 transition-colors hover:border-violet-500/30">
                  <CardContent className="flex items-center justify-between py-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900">
                        {f.type === 'readme' ? <File className="h-4 w-4 text-amber-400" /> : <FolderOpen className="h-4 w-4 text-violet-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-200">{f.name}</p>
                        <p className="text-xs text-zinc-500">{f.relativePath} · {formatFileSize(f.size)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fileTypeLabel(f.type)}</Badge>
                      {(f.type === 'readme' || f.type === 'output' || f.type === 'markdown' || f.type === 'agent-spec') && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/doc/${encodeURIComponent(f.path)}`}>Open</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="implementation" className="mt-8">
          {sectionKeys.length > 0 ? (
            <Accordion.Root type="multiple" defaultValue={sectionKeys.slice(0, 2)} className="space-y-3">
              {sectionKeys.map((key) => (
                <Accordion.Item key={key} value={key} className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between px-6 py-4 text-left font-medium text-zinc-200 hover:bg-zinc-900/60">
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                      <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="border-t border-zinc-800/60 px-6 py-4 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <MarkdownViewer content={agent.sections[key]} showToc={false} allowFullscreen={false} />
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          ) : outputMd ? (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8">
              <MarkdownViewer content={outputMd} wide />
            </div>
          ) : (
            <p className="text-zinc-500">No implementation report available.</p>
          )}
        </TabsContent>

        <TabsContent value="commands" className="mt-8 space-y-4">
          <CommandBlock command={getAgentCommand(agent)} label="Invocation" />
          <CommandBlock command={getAgentRunCommand(agent)} label="Run instruction" />
          {agent.evidence.commands.map((cmd) => (
            <CommandBlock key={cmd} command={cmd} label="Documented command" />
          ))}
        </TabsContent>

        <TabsContent value="notes" className="mt-8">
          <EvidencePanel evidence={agent.evidence} proofImages={agent.proofImages} />
        </TabsContent>

        <TabsContent value="output" className="mt-8">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-8">
            {outputMd ? <MarkdownViewer content={outputMd} wide /> : <p className="text-zinc-500">No primary output available.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
