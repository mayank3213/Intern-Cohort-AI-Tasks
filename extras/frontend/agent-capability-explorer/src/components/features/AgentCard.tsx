import { ArrowRight, Bot } from 'lucide-react';
import type { Agent } from '../../data/types';
import { Badge } from '../ui/badge';
import { getAgentIcon } from '../../utils/catalog';
import { PremiumCard } from './PremiumCard';

export function AgentCard({ agent, index = 0 }: { agent: Agent; index?: number }) {
  return (
    <PremiumCard
      to={`/agent/${agent.id}`}
      index={index}
      icon={<span className="text-xl">{getAgentIcon(agent.taskId)}</span>}
      badge={<Badge variant="outline" className="font-mono text-[10px]">{agent.taskId}</Badge>}
      title={agent.title}
      description={agent.description.replace(/\*\*/g, '')}
      meta={
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{agent.categoryLabel}</Badge>
          {agent.languages.slice(0, 3).map((l) => (
            <Badge key={l} variant="outline" className="text-[10px]">{l}</Badge>
          ))}
        </div>
      }
      footer={
        <div className="flex items-center gap-2 text-sm text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
          <Bot className="h-3.5 w-3.5" />
          Explore agent
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      }
    />
  );
}
