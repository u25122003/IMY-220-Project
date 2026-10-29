import { Link } from 'react-router-dom';
import Avatar from './Avatar';

export default function ProfilePreview({ user, children }) {
  return (
    <article className="card flex flex-wrap items-center gap-4 p-4">
      <Link to={`/profile/${user._id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={user.avatar} name={user.name} className="h-12 w-12" />
        <div className="min-w-0">
          <h4 className="truncate font-bold">{user.name}</h4>
          <p className="truncate text-sm text-muted">@{user.username}</p>
        </div>
      </Link>
      {children}
    </article>
  );
}
