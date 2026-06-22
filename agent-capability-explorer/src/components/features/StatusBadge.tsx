import type { AgentStatus } from '../../data/types';
import { Badge } from '../ui/badge';

const map: Record<AgentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'secondary' }> = {
  PASS: { label: 'Pass', variant: 'success' },
  PARTIAL: { label: 'Partial', variant: 'warning' },
  FAIL: { label: 'Fail', variant: 'danger' },
  INCOMPLETE: { label: 'Incomplete', variant: 'secondary' },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
