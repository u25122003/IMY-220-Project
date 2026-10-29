import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { albumsApi, postsApi, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import Post from '../components/Post';
import Comments from '../components/Comments';
import Message, { Loading } from '../components/Message';

//clicking individual post
export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [myAlbums, setMyAlbums] = useState([]);
  const [albumId, setAlbumId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [postData, me] = await Promise.all([postsApi.get(id), usersApi.get(user._id)]);
      setData(postData);
      setMyAlbums(me.albums);
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

  const { post, albums, reported } = data;
  const albumsToAddTo = myAlbums.filter(a => !albums.some(existing => existing._id === a._id));

  const addToAlbum = async (e) => {
    e.preventDefault();
    try {
      await albumsApi.addPost(albumId, post._id);
      setAlbumId('');
      setNotice('Added to your album!');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="btn-secondary btn-small">&larr; Back</button>

      <Post post={post} reported={reported} onUpdate={(updated) => setData({ ...data, post: updated })} />

      <section className="card space-y-4">
        <h3 className="section-title text-2xl font-normal">Albums</h3>
        {albums.length ? (
          <div className="flex flex-wrap gap-2">
            {albums.map(album => (
              <Link key={album._id} to={`/album/${album._id}`} className="hashtag hover:bg-burnt hover:text-beige">
                {album.name} &middot; {album.owner?.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted">This photo isn't in any albums yet.</p>
        )}

        {albumsToAddTo.length > 0 && (
          <form onSubmit={addToAlbum} className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="label">Add this photo to one of your albums</span>
              <select className="input" value={albumId} onChange={(e) => setAlbumId(e.target.value)} required>
                <option value="">Choose an album...</option>
                {albumsToAddTo.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </label>
            <button className="btn-primary">Add</button>
          </form>
        )}
        <Message type="success">{notice}</Message>
        {data && <Message>{error}</Message>}
      </section>

      <Comments post={post} onUpdate={(updated) => setData({ ...data, post: updated })} />
    </div>
  );
}
