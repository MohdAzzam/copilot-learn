import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

const loadLeaderboard = () => getJson<{ leaderboard: Record<string, unknown>[] }>('/api/leaderboard');

export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    loadData={loadLeaderboard}
    collectionKey="leaderboard"
    emptyMessage="No leaderboard rankings yet."
    renderItem={(entry) => `${entry.rank}. ${entry.teamName}: ${entry.totalPoints} points`}
  />;
}
