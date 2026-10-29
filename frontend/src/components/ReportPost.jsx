import { useEffect, useState } from 'react';
import { postsApi, reportsApi } from '../api';
import Message from './Message';

export default function ReportPost({ postId, alreadyReported }) {
  const [open, setOpen] = useState(false);
  const [reasons, setReasons] = useState([]);
  const [reasonId, setReasonId] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(alreadyReported);

  useEffect(() => {
    if (!open) return;
    reportsApi.reasons()
      .then(data => setReasons(data.reasons))
      .catch(err => setError(err.message));
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await postsApi.report(postId, reasonId);
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (done) return <p className="text-sm font-bold text-muted">You reported this post. An admin will review it.</p>;

  if (!open) {
    return <button className="text-sm font-bold text-danger hover:underline" onClick={() => setOpen(true)}>Report post</button>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border-2 border-danger/30 p-4">
      <label className="block">
        <span className="mb-2 block font-bold">Why are you reporting this post?</span>
        <select className="input" value={reasonId} onChange={(e) => setReasonId(e.target.value)} required>
          <option value="">Choose a reason</option>
          {reasons.map(r => <option key={r._id} value={r._id}>{r.reason}</option>)}
        </select>
      </label>
      <Message>{error}</Message>
      <div className="flex gap-2">
        <button className="btn-danger btn-small">Submit report</button>
        <button type="button" className="btn-secondary btn-small" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
