import { useState } from 'react';
import { postsApi } from '../api';
import { hashtagsToText } from '../utils';
import Message from './Message';

//the creator(or admin) can change description and hashtags
export default function EditPost({ post, onSaved, onCancel }) {
  const [caption, setCaption] = useState(post.caption);
  const [hashtags, setHashtags] = useState(hashtagsToText(post.hashtags));
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await postsApi.update(post._id, { caption, hashtags });
      onSaved(data.post);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="label">Description</span>
        <textarea className="input" rows="3" value={caption} onChange={(e) => setCaption(e.target.value)} required />
      </label>
      <label className="block">
        <span className="label">Hashtags</span>
        <input className="input" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#travel #food" />
      </label>
      <Message>{error}</Message>
      <div className="flex gap-2">
        <button className="btn-primary">Save</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
