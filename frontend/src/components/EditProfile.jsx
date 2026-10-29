import { useState } from 'react';
import { usersApi } from '../api';
import ImagePicker from './ImagePicker';
import Message from './Message';

//edit users own profile, name username pronouns bio and profile picture
export default function EditProfile({ user, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: user.name,
    username: user.username,
    pronouns: user.pronouns || '',
    bio: user.bio || '',
    avatar: user.avatar || ''
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = await usersApi.update(user._id, form);
      onSaved(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="section-title font-normal">Edit Profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="label">Name</span>
          <input className="input" name="name" value={form.name} onChange={handleChange} required />
        </label>
        <label>
          <span className="label">Username</span>
          <input className="input" name="username" value={form.username} onChange={handleChange} pattern="[A-Za-z0-9_.]{3,30}" title="3-30 letters, numbers, dots or underscores" required />
        </label>
        <label>
          <span className="label">Pronouns</span>
          <input className="input" name="pronouns" value={form.pronouns} onChange={handleChange} placeholder="e.g. she/her" />
        </label>
      </div>
      <label className="block">
        <span className="label">Bio</span>
        <textarea className="input" name="bio" rows="3" value={form.bio} onChange={handleChange} maxLength={300} />
      </label>
      <ImagePicker label="Profile picture" value={form.avatar} onChange={(avatar) => setForm({ ...form, avatar })} />
      <Message>{error}</Message>
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
