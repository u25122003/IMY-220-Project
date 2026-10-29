// Inline error or success banner
export default function Message({ type = 'error', children }) {
  if (!children) return null;
  const styles = type === 'error' ? 'bg-danger/10 text-danger' : 'bg-olive/15 text-olive';
  return <p className={`rounded-lg px-4 py-2 text-sm font-bold ${styles}`}>{children}</p>;
}

//Loading... when users are waiting for data
export function Loading({ text = 'Loading...' }) {
  return <p className="py-12 text-center font-marker text-xl text-muted">{text}</p>;
}

/// dashed border box with a message
export function EmptyState({ children }) {
  return <p className="rounded-2xl border-2 border-dashed border-sand py-10 text-center text-muted">{children}</p>;
}

//3 components for common UI states 
