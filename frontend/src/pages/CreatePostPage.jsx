import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsApi, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import ImagePicker from '../components/ImagePicker';
import Message from '../components/Message';

export default function CreatePostPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [image, setImage] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    usersApi.get(user._id).then(data => setAlbums(data.albums)).catch(() => setAlbums([]));
  }, [user._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return setError('Please add an image');
    setSubmitting(true);
    setError('');
    try {
      const data = await postsApi.create({ image, caption, hashtags, albumId: albumId || undefined });
      navigate(`/post/${data.post._id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl space-y-5">
      <h1 className="section-title text-4xl font-normal">Share a photo</h1>
      <ImagePicker value={image} onChange={setImage} />
      <label className="block">
        <span className="label">Description</span>
        <textarea className="input" rows="3" placeholder="Write a caption..." value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} required />
      </label>
      <label className="block">
        <span className="label">Hashtags</span>
        <input className="input" placeholder="#sunset #weekend" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
      </label>
      {albums.length > 0 && (
        <label className="block">
          <span className="label">Add to album (optional)</span>
          <select className="input" value={albumId} onChange={(e) => setAlbumId(e.target.value)}>
            <option value="">No album</option>
            {albums.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
          </select>
        </label>
      )}
      <Message>{error}</Message>
      <button className="btn-primary w-full py-3 text-lg" disabled={submitting}>{submitting ? 'Sharing...' : 'Share post'}</button>
    </form>
  );
}
