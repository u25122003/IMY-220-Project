import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authApi, FRIENDS_CHANGED, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import Profile from '../components/Profile';
import EditProfile from '../components/EditProfile';
import FriendButton from '../components/FriendButton';
import FriendsList, { FriendRequests } from '../components/FriendsList';
import PostPreview from '../components/PostPreview';
import AlbumPreview from '../components/AlbumPreview';
import Message, { Loading, EmptyState } from '../components/Message';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: me, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await usersApi.get(id));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    setData(null);
    setEditing(false);
    setTab('posts');
    load();
  }, [load]);

  // Accepting a request from the notification bell should update this page too
  useEffect(() => {
    window.addEventListener(FRIENDS_CHANGED, load);
    return () => window.removeEventListener(FRIENDS_CHANGED, load);
  }, [load]);

  if (error && !data) return <Message>{error}</Message>;
  if (!data) return <Loading />;

  const { user, friends, requests, posts, albums, relationship } = data;
  const isMe = relationship === 'self' && user._id === me._id;
  const canManage = isMe || me.isAdmin;

  const handleSaved = (updated) => {
    if (isMe) updateUser(updated);
    setEditing(false);
    load();
  };

  const handleDelete = async () => {
    const who = isMe ? 'your account' : `${user.name}'s account`;
    if (!window.confirm(`Permanently delete ${who} and all of its posts and albums?`)) return;
    try {
      await usersApi.remove(user._id);
      if (isMe) {
        await logout();
        navigate('/');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Refreshes this profile and the logged-in user (their friends list changed)
  const refreshFriends = async () => {
    await load();
    const fresh = await authApi.me();
    updateUser(fresh.user);
  };

  const tabs = [
    ['posts', `Posts (${posts.length})`],
    ['albums', `Albums (${albums.length})`],
    ['friends', `Friends (${friends.length})`],
    ...(isMe ? [['requests', `Requests (${requests.length})`]] : [])
  ];

  // Not friends yet: the backend only sends the name and picture
  if (data.isPrivate) {
    return (
      <div className="space-y-8">
        <Profile user={user}>
          <FriendButton userId={user._id} relationship={relationship} onChange={refreshFriends} />
        </Profile>
        <Message>{error}</Message>
        <EmptyState>
          Only friends can see {user.name.split(' ')[0]}'s posts, albums and friends.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {editing ? (
        <EditProfile user={user} onSaved={handleSaved} onCancel={() => setEditing(false)} />
      ) : (
        <Profile user={user} stats={[['posts', posts.length], ['albums', albums.length], ['friends', friends.length]]}>
          {!isMe && <FriendButton userId={user._id} relationship={relationship} onChange={refreshFriends} />}
          {canManage && <button className="btn-secondary" onClick={() => setEditing(true)}>Edit profile</button>}
          {canManage && <button className="btn-danger" onClick={handleDelete}>Delete {isMe ? 'my' : 'this'} account</button>}
        </Profile>
      )}

      <Message>{error}</Message>

      <nav className="flex flex-wrap gap-2 border-b-2 border-sand">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-0.5 border-b-[3px] px-4 py-2 font-bold transition-colors ${tab === key ? 'border-burnt text-burnt' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'posts' && (posts.length ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => <PostPreview key={post._id} post={post} />)}
        </div>
      ) : (
        <EmptyState>
          No posts yet. {isMe && <Link to="/create-post" className="font-bold text-burnt">Share your first photo</Link>}
        </EmptyState>
      ))}

      {tab === 'albums' && (albums.length ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map(album => <AlbumPreview key={album._id} album={album} />)}
        </div>
      ) : (
        <EmptyState>
          No albums yet. {isMe && <Link to="/create-album" className="font-bold text-burnt">Create an album</Link>}
        </EmptyState>
      ))}

      {tab === 'friends' && <FriendsList friends={friends} canEdit={isMe} onChange={refreshFriends} />}
      {tab === 'requests' && <FriendRequests requests={requests} onChange={refreshFriends} />}
    </div>
  );
}
