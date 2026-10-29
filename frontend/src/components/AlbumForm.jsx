import { useState } from 'react';
import { hashtagsToText } from '../utils';
import Message from './Message';

//reusable form for creating and editing an album, parent passes in what to do on submit

//used for creating and editing an album
export default function AlbumForm({ album, submitLabel, onSubmit, onCancel, children }) {
  const [name, setName] = useState(album?.name || '');
  const [description, setDescription] = useState(album?.description || '');
  const [hashtags, setHashtags] = useState(hashtagsToText(album?.hashtags));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); //stops from reloading the page
    setSaving(true);
    setError('');
    try {
      await onSubmit({ name, description, hashtags });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="label">Album name</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
      </label>
      <label className="block">
        <span className="label">Description</span>
        <textarea className="input" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
      </label>
      <label className="block">
        <span className="label">Hashtags</span>
        <input className="input" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#holiday #family" />
      </label>
      {children}
      <Message>{error}</Message>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
