import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postsApi } from '../api';
import { useAuth } from '../AuthContext';
import { timeAgo } from '../utils';
import Avatar from './Avatar';
import Hashtags from './Hashtags';
import EditPost from './EditPost';
import ReportPost from './ReportPost';
import Message from './Message';

//doesnt fetch anythign the parent page, postpage loads posts and passes it in
//full post: image, author, description, hashtags and owner / admin controls
export default function Post({ post, reported, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const isOwner = post.authorId === user._id;
  const canManage = isOwner || user.isAdmin;

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? Any album where this is the only photo will be deleted too. This cannot be undone.')) return;
    try {
      await postsApi.remove(post._id);
      navigate(`/profile/${user._id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <article className="grid gap-8 md:grid-cols-[1.1fr_1fr]">
      <div className="polaroid -rotate-1 self-start">
        <div className="overflow-hidden bg-ink">
          <img src={post.image} alt={post.caption} className="max-h-[70vh] w-full object-contain" />
        </div>
        <p className="mt-4 text-center font-marker text-2xl">{post.caption}</p>
      </div>

      <div className="card space-y-5 self-start">
        <header className="flex items-center gap-3">
          {post.author ? (
            <Link to={`/profile/${post.author._id}`} className="flex items-center gap-3 hover:text-burnt">
              <Avatar src={post.author.avatar} name={post.author.name} className="h-12 w-12" />
              <div>
                <p className="font-bold">{post.author.name}</p>
                <p className="text-sm text-muted">@{post.author.username} &middot; {timeAgo(post.createdAt)}</p>
              </div>
            </Link>
          ) : (
            <p className="font-bold">Deleted user</p>
          )}
        </header>

        {editing ? (
          <EditPost
            post={post}
            onCancel={() => setEditing(false)}
            onSaved={(updated) => {
              setEditing(false);
              onUpdate(updated);
            }}
          />
        ) : (
          <>
            <p className="text-lg">{post.caption}</p>
            <Hashtags tags={post.hashtags} />
          </>
        )}

        <Message>{error}</Message>

        {canManage && !editing && (
          <div className="flex gap-2">
            <button className="btn-secondary btn-small" onClick={() => setEditing(true)}>Edit post</button>
            <button className="btn-danger btn-small" onClick={handleDelete}>Delete post</button>
          </div>
        )}

        {!isOwner && <ReportPost postId={post._id} alreadyReported={reported} />}
      </div>
    </article>
  );
}
