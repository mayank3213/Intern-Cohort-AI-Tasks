import { motion } from 'framer-motion';
import {
  Activity, Box, Cloud, Container, Database, GitBranch, Layers, Server, Workflow, Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PremiumCard } from '../components/features/PremiumCard';
import { Badge } from '../components/ui/badge';
import { useServices } from '../hooks/useCatalog';

const iconMap: Record<string, typeof Server> = {
  fastapi: Zap,
  'node-worker': Workflow,
  'rust-scorer': Box,
  express: Server,
  docker: Container,
  kubernetes: Layers,
  terraform: Cloud,
  'github-actions': GitBranch,
  prometheus: Activity,
  grafana: Activity,
  postgresql: Database,
  'slim-php': Server,
};

const categoryLabels: Record<string, string> = {
  api: 'API Services',
  worker: 'Workers & Pipelines',
  infra: 'Infrastructure',
  observability: 'Observability',
  data: 'Data Layer',
  platform: 'Platform',
};

export function ServicesPage() {
  const services = useServices();
  const grouped = services.reduce<Record<string, typeof services>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium text-violet-400">⚙ Services</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50">Polyglot implementations</h2>
        <p className="mt-3 max-w-2xl text-zinc-400 leading-relaxed">
          Real services built across the task catalog — APIs, workers, infrastructure, and observability stacks.
        </p>
      </motion.div>

      {Object.entries(grouped).map(([category, items], gi) => (
        <section key={category}>
          <h3 className="mb-5 text-lg font-semibold text-zinc-200">{categoryLabels[category] ?? category}</h3>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((service, i) => {
              const Icon = iconMap[service.id] ?? Server;
              return (
                <div key={service.id} id={service.id}>
                  <PremiumCard
                    index={gi * 3 + i}
                    glow="blue"
                    icon={<Icon className="h-5 w-5 text-blue-400" />}
                    title={service.name}
                    description={service.description}
                    meta={
                      <div className="flex flex-wrap gap-1.5">
                        {service.tech.map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                    }
                    footer={
                      <div className="flex flex-wrap gap-2">
                        {service.agentIds.slice(0, 3).map((id) => (
                          <Link key={id} to={`/agent/${id}`} className="text-xs text-violet-400 hover:text-violet-300">
                            View task →
                          </Link>
                        ))}
                      </div>
                    }
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
