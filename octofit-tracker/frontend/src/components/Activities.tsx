import { CapabilityCard } from './CapabilityCard.js';
export default function Activities() {
  return <CapabilityCard
    title="Activities"
    description="Track student activity minutes and points."
    endpoint="/api/activities"
    collectionKey="activities"
    emptyMessage="No activities yet."
    renderItem={(activity) => `${activity.type}: ${activity.minutes} minutes, ${activity.points} points`}
  />;
}
