import { useState } from 'react';
import { readImageFile } from '../utils';

// Lets the user upload an image file or paste an image URL
export default function ImagePicker({ value, onChange, label = 'Image' }) {
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setError('');
      onChange(await readImageFile(file));
    } catch (err) {
      setError(err.message);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <span className="label">{label}</span>
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-sand bg-polaroid sm:w-48">
          {value ? (
            <img src={value} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <span className="px-4 text-center text-sm text-muted">No image chosen</span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <label className="btn-secondary w-fit">
            Upload a photo
            <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">or paste an image link</span>
            <input
              type="url"
              className="input"
              placeholder="https://..."
              value={value.startsWith('data:') ? '' : value}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>
          {error && <span className="text-sm font-bold text-danger">{error}</span>}
        </div>
      </div>
    </div>
  );
}
