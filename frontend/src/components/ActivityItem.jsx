import { useState } from 'react';
import { Link } from 'react-router-dom';
import { activityApi } from '../api';
import { useAuth } from '../AuthContext';
import { photoCount, timeAgo } from '../utils';
import Avatar from './Avatar';
import Hashtags from './Hashtags';
import FeedComments from './FeedComments';

//report limit is 2, cant see unless user allows it
const REPORT_LIMIT = 2;

//one entry in the local or global activity feed
export default function ActivityItem({ item, onChange }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [error, setError] = useState('');
  const [showAnyway, setShowAnyway] = useState(false);

  const isHidden = (item.post?.reportCount || 0) > REPORT_LIMIT && !showAnyway;

  const save = async (e) => {
    e.preventDefault();
    try {
      await activityApi.update(item._id, text);
      setEditing(false);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this activity from the feed?')) return;
    try {
      await activityApi.remove(item._id);
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <article className="card space-y-4">
      <header className="flex items-start gap-3">
        {item.user ? (
          <Link to={`/profile/${item.user._id}`}>
            <Avatar src={item.user.avatar} name={item.user.name} className="h-11 w-11" />
          </Link>
        ) : (
          <Avatar className="h-11 w-11" />
        )}
        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={save} className="flex flex-wrap items-end gap-2">
              <label className="flex-1">
                <span className="label">Activity text</span>
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} required />
              </label>
              <button className="btn-primary btn-small">Save</button>
              <button type="button" className="btn-secondary btn-small" onClick={() => setEditing(false)}>Cancel</button>
            </form>
          ) : (
            <p className="font-bold">{item.text}</p>
          )}
          <p className="text-sm text-muted">{timeAgo(item.createdAt)}</p>
          {error && <p className="text-sm font-bold text-danger">{error}</p>}
        </div>
        {user.isAdmin && !editing && (
          <div className="flex gap-2">
            <button className="btn-secondary btn-small" onClick={() => setEditing(true)}>Edit</button>
            <button className="btn-danger btn-small" onClick={remove}>Delete</button>
          </div>
        )}
      </header>
        {/*if it is hidden show the blocked placeholder */}
      {item.post && isHidden && (
        <div className="space-y-3 rounded-xl border-2 border-dashed border-danger/40 bg-sand px-6 py-10 text-center">
          <p className="font-marker text-2xl text-danger">This post has been reported</p>
          <p className="text-muted">Multiple people reported this post, so it is hidden from the feed.</p>
          <button className="btn-secondary btn-small" onClick={() => setShowAnyway(true)}>Show anyway</button>
        </div>
      )}

      {/*sand backdrop*/}
      {item.post && !isHidden && (
        <div className="rounded-xl bg-sand px-4 py-8 sm:px-8">
          <Link to={`/post/${item.post._id}`} className="polaroid mx-auto block max-w-md -rotate-1 hover:rotate-0">
            <div className="aspect-square overflow-hidden bg-ink">
              <img src={item.post.image} alt={item.post.caption} className="h-full w-full object-cover" />
            </div>
            <p className="mt-3 font-marker text-xl">{item.post.caption}</p>
          </Link>
        </div>
      )}
      {/*show the hashtags */}
      {item.post && !isHidden && <Hashtags tags={item.post.hashtags} />}

      {/*show the feed comments */}
      {item.post && !isHidden && <FeedComments post={item.post} />}

      {item.album && (
        <Link
          to={`/album/${item.album._id}`}
          className="block rounded-xl border-2 border-sand bg-beige p-4 transition-colors hover:border-burnt"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-burnt">Album</p>
          <p className="font-marker text-xl">{item.album.name}</p>
          {item.album.description && <p className="text-muted">{item.album.description}</p>}
          <p className="mt-1 text-sm text-muted">{photoCount(item.album.posts?.length || 0)}</p>
        </Link>
      )}
    </article>
  );
}
