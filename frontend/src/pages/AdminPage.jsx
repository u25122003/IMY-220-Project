import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { activityApi, postsApi, reportsApi, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import { timeAgo } from '../utils';
import Avatar from '../components/Avatar';
import Feed from '../components/Feed';
import Message, { Loading, EmptyState } from '../components/Message';

const TABS = ['Reports', 'Report reasons', 'Users', 'Posts', 'Activity'];

export default function AdminPage() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-marker text-4xl font-normal">Admin dashboard</h1>
        <p className="text-muted">Review reports and manage every account, post and activity on Pick n Post.</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {TABS.map(name => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`rounded-full px-4 py-2 font-bold transition-colors ${tab === name ? 'bg-burnt text-beige' : 'bg-sand hover:bg-ink hover:text-beige'}`}
          >
            {name}
          </button>
        ))}
      </nav>

      {tab === 'Reports' && <ReportsTab />}
      {tab === 'Report reasons' && <ReasonsTab />}
      {tab === 'Users' && <UsersTab />}
      {tab === 'Posts' && <PostsTab />}
      {tab === 'Activity' && <ActivityTab />}
    </div>
  );
}

//loads a list from the API and gives back a reload function
function useAdminData(fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await fetcher());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [fetcher]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Runs an action, then refreshes the list
  const run = async (action) => {
    try {
      await action();
      await reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return { data, error, reload, run };
}

function ReportsTab() {
  const { data, error, run } = useAdminData(reportsApi.list);
  if (!data) return error ? <Message>{error}</Message> : <Loading />;

  const deletePost = (postId) => {
    if (window.confirm('Delete the reported post?')) run(() => postsApi.remove(postId));
  };

  return (
    <section className="space-y-4">
      <Message>{error}</Message>
      {data.reports.length === 0 && <EmptyState>No reports to review.</EmptyState>}
      {data.reports.map(report => (
        <article key={report._id} className="card flex flex-col gap-4 sm:flex-row sm:items-center">
          {report.post ? (
            <Link to={`/post/${report.post._id}`} className="shrink-0">
              <img src={report.post.image} alt={report.post.caption} className="h-24 w-24 rounded-lg object-cover" />
            </Link>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-sand text-sm text-muted">Deleted</div>
          )}
          <div className="flex-1">
            <p className="font-bold text-danger">{report.reason}</p>
            <p>{report.post?.caption || 'This post no longer exists'}</p>
            <p className="text-sm text-muted">Reported by {report.reporter?.name || 'a deleted user'} &middot; {timeAgo(report.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            {report.post && <button className="btn-danger btn-small" onClick={() => deletePost(report.post._id)}>Delete post</button>}
            <button className="btn-secondary btn-small" onClick={() => run(() => reportsApi.dismiss(report._id))}>Dismiss</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function ReasonsTab() {
  const { data, error, run } = useAdminData(reportsApi.reasons);
  const [reason, setReason] = useState('');
  if (!data) return error ? <Message>{error}</Message> : <Loading />;

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await reportsApi.addReason(reason);
      setReason('');
    });
  };

  return (
    <section className="card space-y-4">
      <h2 className="section-title text-2xl font-normal">Reasons users can pick when reporting a post</h2>
      <ul className="divide-y divide-sand">
        {data.reasons.map(r => (
          <li key={r._id} className="flex items-center justify-between py-2">
            <span>{r.reason}</span>
            <button className="text-sm font-bold text-danger hover:underline" onClick={() => run(() => reportsApi.removeReason(r._id))}>Remove</button>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="flex-1">
          <span className="label">New reason</span>
          <input className="input" placeholder="e.g. Copyright violation" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        <button className="btn-primary">Add reason</button>
      </form>
      <Message>{error}</Message>
    </section>
  );
}

function UsersTab() {
  const { user: me } = useAuth();
  const { data, error, run } = useAdminData(usersApi.list);
  if (!data) return error ? <Message>{error}</Message> : <Loading />;

  const remove = (u) => {
    if (window.confirm(`Delete ${u.name}'s account and everything they posted?`)) run(() => usersApi.remove(u._id));
  };

  return (
    <section className="space-y-3">
      <Message>{error}</Message>
      {data.users.map(u => (
        <article key={u._id} className="card flex flex-wrap items-center gap-4 p-4">
          <Avatar src={u.avatar} name={u.name} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {u.name} {u.isAdmin && <span className="ml-1 rounded-full bg-burnt px-2 py-0.5 text-xs text-beige">ADMIN</span>}
            </p>
            <p className="truncate text-sm text-muted">@{u.username} &middot; {u.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Editing happens on the profile page, which admins can edit for any user */}
            <Link to={`/profile/${u._id}`} className="btn-secondary btn-small">View / edit</Link>
            {u._id !== me._id && (
              <>
                <button className="btn-secondary btn-small" onClick={() => run(() => usersApi.update(u._id, { isAdmin: !u.isAdmin }))}>
                  {u.isAdmin ? 'Remove admin' : 'Make admin'}
                </button>
                <button className="btn-danger btn-small" onClick={() => remove(u)}>Delete</button>
              </>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function PostsTab() {
  const { data, error, run } = useAdminData(postsApi.list);
  if (!data) return error ? <Message>{error}</Message> : <Loading />;

  const remove = (post) => {
    if (window.confirm('Delete this post?')) run(() => postsApi.remove(post._id));
  };

  return (
    <section className="space-y-3">
      <Message>{error}</Message>
      {data.posts.length === 0 && <EmptyState>No posts yet.</EmptyState>}
      {data.posts.map(post => (
        <article key={post._id} className="card flex flex-wrap items-center gap-4 p-4">
          <img src={post.image} alt={post.caption} className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{post.caption}</p>
            <p className="text-sm text-muted">by {post.author?.name || 'deleted user'} &middot; {timeAgo(post.createdAt)} &middot; {post.commentCount} comments</p>
          </div>
          <div className="flex gap-2">
            <Link to={`/post/${post._id}`} className="btn-secondary btn-small">View / edit</Link>
            <button className="btn-danger btn-small" onClick={() => remove(post)}>Delete</button>
          </div>
        </article>
      ))}
    </section>
  );
}

function ActivityTab() {
  const fetchGlobal = useCallback(() => activityApi.feed('global'), []);
  const { data, error, reload } = useAdminData(fetchGlobal);
  if (!data) return error ? <Message>{error}</Message> : <Loading />;
  return <Feed activity={data.activity} emptyText="No activity yet." onChange={reload} />;
}
