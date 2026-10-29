import Avatar from './Avatar';

// Profile header: avatar, names, pronouns, bio + stats.
// For people who aren't friends only the name and avatar are sent, so the rest is optional.
export default function Profile({ user, stats = [], children }) {
  return (
    <section className="card flex flex-col items-center gap-6 sm:flex-row sm:items-start">
      <Avatar src={user.avatar} name={user.name} className="h-32 w-32 border-4 border-burnt" />
      <div className="flex-1 space-y-2 text-center sm:text-left">
        <div>
          <h1 className="font-marker text-4xl font-normal">{user.name}</h1>
          {user.username && (
            <p className="text-muted">
              @{user.username}
              {user.pronouns && <> &middot; {user.pronouns}</>}
              {user.isAdmin && <span className="ml-2 rounded-full bg-burnt px-2 py-0.5 text-xs font-bold text-beige">ADMIN</span>}
            </p>
          )}
        </div>
        {user.bio && <p>{user.bio}</p>}
        {stats.length > 0 && (
          <div className="flex justify-center gap-6 text-sm sm:justify-start">
            {stats.map(([label, value]) => (
              <span key={label}><strong className="text-lg text-burnt">{value}</strong> {label}</span>
            ))}
          </div>
        )}
        {children && <div className="flex flex-wrap justify-center gap-2 pt-2 sm:justify-start">{children}</div>}
      </div>
    </section>
  );
}
