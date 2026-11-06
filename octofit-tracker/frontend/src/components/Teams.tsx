import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadTeams = () => getJson<{ teams: Record<string, unknown>[] }>('/api/teams');

export default function Teams() {
  return <CapabilityCard
    title="Teams"
    description="Manage teams and members."
    loadData={loadTeams}
    collectionKey="teams"
    emptyMessage="No teams yet."
    renderItem={(team) => String(team.name)}
  />;
}
