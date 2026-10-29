import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { albumsApi, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import { timeAgo } from '../utils';
import AlbumForm from '../components/AlbumForm';
import Avatar from '../components/Avatar';
import Hashtags from '../components/Hashtags';
import PostPreview from '../components/PostPreview';
import Message, { Loading, EmptyState } from '../components/Message';


//single album loaded by :id in URL, has a header card photo grid and add photo pannel
export default function AlbumPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [albumData, me] = await Promise.all([albumsApi.get(id), usersApi.get(user._id)]);
      setData(albumData);
      setMyPosts(me.posts);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id, user._id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error && !data) return <Message>{error}</Message>;
  if (!data) return <Loading />;

  const { album, posts } = data;
  const canManage = album.userId === user._id || user.isAdmin;
  const postsToAdd = myPosts.filter(p => !album.posts.includes(p._id));

  const save = async (fields) => {
    await albumsApi.update(album._id, fields);
    setEditing(false);
    load();
  };

  const remove = async () => {
    if (!window.confirm(`Delete the album "${album.name}"? The photos themselves will not be deleted.`)) return;
    try {
      await albumsApi.remove(album._id);
      navigate(`/profile/${album.userId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const changePosts = async (action, postId) => {
    try {
      await action(album._id, postId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="btn-secondary btn-small">&larr; Back</button>

      <section className="card space-y-4">
        {editing ? (
          <>
            <h2 className="section-title font-normal">Edit album</h2>
            <AlbumForm album={album} submitLabel="Save changes" onSubmit={save} onCancel={() => setEditing(false)} />
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-wide text-burnt">Album</p>
            <h1 className="font-marker text-5xl font-normal">{album.name}</h1>
            {album.description && <p className="text-lg">{album.description}</p>}
            <Hashtags tags={album.hashtags} />
            {album.owner && (
              <Link to={`/profile/${album.owner._id}`} className="flex w-fit items-center gap-2 text-muted hover:text-burnt">
                <Avatar src={album.owner.avatar} name={album.owner.name} className="h-8 w-8" />
                <span>by <strong>{album.owner.name}</strong> &middot; {timeAgo(album.createdAt)}</span>
              </Link>
            )}
            {canManage && (
              <div className="flex gap-2">
                <button className="btn-secondary btn-small" onClick={() => setEditing(true)}>Edit album</button>
                <button className="btn-danger btn-small" onClick={remove}>Delete album</button>
              </div>
            )}
          </>
        )}
        <Message>{error}</Message>
      </section>

      {posts.length ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <PostPreview key={post._id} post={post}>
              {canManage && (
                <button className="btn-secondary btn-small w-full" onClick={() => changePosts(albumsApi.removePost, post._id)}>
                  Remove from album
                </button>
              )}
            </PostPreview>
          ))}
        </div>
      ) : (
        <EmptyState>This album is empty.</EmptyState>
      )}

      {album.userId === user._id && (
        <section className="card space-y-4">
          <h2 className="section-title text-2xl font-normal">Add your photos</h2>
          {postsToAdd.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {postsToAdd.map(post => (
                <button
                  key={post._id}
                  onClick={() => changePosts(albumsApi.addPost, post._id)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-ink"
                  title="Add to album"
                >
                  <img src={post.image} alt={post.caption} className="h-full w-full object-cover transition-opacity group-hover:opacity-50" />
                  <span className="absolute inset-0 flex items-center justify-center font-marker text-2xl text-beige opacity-0 group-hover:opacity-100">+ Add</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-muted">
              All your photos are already in this album. <Link to="/create-post" className="font-bold text-burnt">Share a new one</Link>
            </p>
          )}
          <p className="text-sm text-muted">Tip: you can also add other people's photos from their post page.</p>
        </section>
      )}
    </div>
  );
}
