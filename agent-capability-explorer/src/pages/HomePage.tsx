import { motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, Bot, Cloud, FileOutput, Layers, Search, Server, Sparkles, Workflow, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AgentCard } from '../components/features/AgentCard';
import { PremiumCard } from '../components/features/PremiumCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAgents } from '../hooks/useAgents';
import { useRecentOutputs, useServices } from '../hooks/useCatalog';

const categories = [
  { id: 'basics', label: 'Basics', emoji: '📦', desc: 'Repository mapping & discovery', to: '/agents?category=basics' },
  { id: 'intermediate', label: 'Intermediate', emoji: '🔧', desc: 'Targeted fixes & tracing', to: '/agents?category=intermediate' },
  { id: 'advanced', label: 'Advanced', emoji: '🚀', desc: 'Parallel workflows & polyglot builds', to: '/agents?category=advanced' },
  { id: 'devops', label: 'DevOps', emoji: '☁️', desc: 'Infrastructure & observability', to: '/agents?category=devops' },
];

export function HomePage() {
  const agents = useAgents();
  const services = useServices().slice(0, 4);
  const recentOutputs = useRecentOutputs(4);
  const featured = [...agents].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 6);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-zinc-800/60 p-10 md:p-14"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/10 via-zinc-900/50 to-blue-600/10" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3 w-3" /> Interactive showcase
          </motion.div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl lg:text-6xl">
            AgentAtlas
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-zinc-400 md:text-xl">
            Interactive showcase of repository analysis, multi-agent workflows, polyglot systems, and infrastructure artifacts.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/agents"><Bot className="h-4 w-4" /> Explore agents</Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="rounded-xl border-zinc-700">
              <Link to="/services"><Server className="h-4 w-4" /> View services</Link>
            </Button>
            <Button variant="ghost" size="lg" asChild className="rounded-xl text-zinc-400">
              <Link to="/outputs"><FileOutput className="h-4 w-4" /> Browse outputs</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Category cards */}
      <section>
        <h2 className="mb-6 text-xl font-semibold text-zinc-100">Explore by category</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((cat, i) => (
            <PremiumCard
              key={cat.id}
              to={cat.to}
              index={i}
              icon={<span className="text-2xl">{cat.emoji}</span>}
              title={cat.label}
              description={cat.desc}
              footer={
                <span className="flex items-center gap-1 text-sm text-violet-400">
                  Browse <ArrowRight className="h-3.5 w-3.5" />
                </span>
              }
            />
          ))}
        </div>
      </section>

      {/* Architecture overview */}
      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-8 backdrop-blur">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-violet-400" />
          <h2 className="text-xl font-semibold text-zinc-100">Architecture overview</h2>
        </div>
        <p className="mt-3 max-w-3xl text-zinc-400 leading-relaxed">
          From single-repo artifact mapping to polyglot pipelines — agents discover, analyze, execute, and document across Python, Node, Rust, PHP, and infrastructure stacks.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {['Repository Analysis', 'API Discovery', 'Test Execution', 'Parallel Worktrees', 'Polyglot Pipelines', 'IaC & K8s', 'CI/CD', 'Observability'].map((tag) => (
            <Badge key={tag} variant="secondary" className="px-3 py-1">{tag}</Badge>
          ))}
        </div>
      </section>

      {/* Featured agents */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-400">🤖 Agents</p>
            <h2 className="text-xl font-semibold text-zinc-100">Featured agents</h2>
          </div>
          <Button variant="ghost" size="sm" asChild><Link to="/agents">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {featured.map((agent, i) => <AgentCard key={agent.id} agent={agent} index={i} />)}
        </div>
      </section>

      {/* Featured services */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-400">⚙ Services</p>
            <h2 className="text-xl font-semibold text-zinc-100">Featured services</h2>
          </div>
          <Button variant="ghost" size="sm" asChild><Link to="/services">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {services.map((service, i) => (
            <PremiumCard
              key={service.id}
              to={`/services#${service.id}`}
              index={i}
              glow="blue"
              icon={<Zap className="h-5 w-5 text-blue-400" />}
              title={service.name}
              description={service.description}
              meta={
                <div className="flex flex-wrap gap-1">
                  {service.tech.slice(0, 2).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                </div>
              }
            />
          ))}
        </div>
      </section>

      {/* Recent outputs */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-violet-400">📄 Outputs</p>
            <h2 className="text-xl font-semibold text-zinc-100">Recent outputs</h2>
          </div>
          <Button variant="ghost" size="sm" asChild><Link to="/outputs">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {recentOutputs.map((output, i) => (
            <PremiumCard
              key={output.id}
              to={`/doc/${encodeURIComponent(output.path)}`}
              index={i}
              glow="emerald"
              icon={<FileOutput className="h-5 w-5 text-emerald-400" />}
              badge={<Badge variant="outline" className="font-mono text-[10px]">{output.taskId}</Badge>}
              title={output.name}
              description={output.title}
            />
          ))}
        </div>
      </section>

      {/* Quick search CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-dashed border-zinc-700/60 bg-zinc-900/20 p-8 text-center"
      >
        <Search className="mx-auto h-8 w-8 text-zinc-600" />
        <h3 className="mt-4 text-lg font-semibold text-zinc-200">Quick search</h3>
        <p className="mt-2 text-sm text-zinc-500">Press <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs">⌘K</kbd> to search agents, services, outputs, READMEs, and commands.</p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" size="sm" asChild><Link to="/readmes"><BookOpen className="h-4 w-4" /> READMEs</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/agents"><Workflow className="h-4 w-4" /> Requirements</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/services"><Cloud className="h-4 w-4" /> Services</Link></Button>
        </div>
      </motion.section>
    </div>
  );
}
