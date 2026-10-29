import ActivityItem from './ActivityItem';
import { EmptyState } from './Message';

export default function Feed({ activity = [], emptyText, onChange }) {
  if (activity.length === 0) return <EmptyState>{emptyText}</EmptyState>;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      {activity.map(item => (
        <ActivityItem key={item._id} item={item} onChange={onChange} />
      ))}
    </section>
  );
}
