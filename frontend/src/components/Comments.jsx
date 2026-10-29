import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { postsApi } from '../api';
import { useAuth } from '../AuthContext';
import { timeAgo } from '../utils';
import Avatar from './Avatar';
import Message from './Message';

//full comment sections for post, list, delete button per comment and a form to add

//component doesnt hold its own comment in its own state it comes from post.comments so the parent

//only the newest few comments are shown until user asks for the rest
const VISIBLE_COMMENTS = 5;

export default function Comments({ post, onUpdate }) {
  const { user } = useAuth();
  const [text, setText] = useState(''); //new comment input
  const [error, setError] = useState(''); //error messages
  const [sending, setSending] = useState(false); //error messages
  const [showAll, setShowAll] = useState(false); // old comments are expanded?
  const inputId = useId(); // generates unique id so label<html> links to input correctly

  const isPostOwner = post.authorId === user._id; //if post owner is this comment
  const hiddenCount = showAll ? 0 : Math.max(post.comments.length - VISIBLE_COMMENTS, 0); // num of older comments hidden-> zero once showAll is true
  const shownComments = post.comments.slice(hiddenCount); //list without the hidden comments

  //calls postsApi.comment clears input and calls onUpdate
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const data = await postsApi.comment(post._id, text);
      setText('');
      onUpdate(data.post);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId) => {
    try {
      const data = await postsApi.removeComment(post._id, commentId);
      onUpdate(data.post);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="card space-y-4">
      <h3 className="section-title text-2xl font-normal">Comments ({post.comments.length})</h3>

      {post.comments.length === 0 && <p className="text-muted">No comments yet. Say something nice!</p>}

      {hiddenCount > 0 && (
        <button onClick={() => setShowAll(true)} className="text-sm font-bold text-burnt hover:underline">
          Show {hiddenCount} earlier {hiddenCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      <ul className="space-y-3">
        {shownComments.map(comment => (
          <li key={comment._id} className="flex gap-3">
            <Avatar src={comment.user?.avatar} name={comment.user?.name} className="h-9 w-9" />
            <div className="flex-1 rounded-xl bg-beige px-4 py-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                {comment.user ? (
                  <Link to={`/profile/${comment.user._id}`} className="font-bold hover:text-burnt">{comment.user.name}</Link>
                ) : (
                  <span className="font-bold">Deleted user</span>
                )}
                <span className="text-xs text-muted">{timeAgo(comment.createdAt)}</span>
              </div>
              <p>{comment.text}</p>
            </div>
            {(comment.userId === user._id || isPostOwner || user.isAdmin) && (
              <button onClick={() => remove(comment._id)} className="self-center text-sm font-bold text-danger hover:underline">
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>

      <Message>{error}</Message>

      <form onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="label">Add a comment</label>
        <div className="flex gap-2">
          <input
            id={inputId}
            className="input"
            placeholder="Say something nice..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            required
          />
          <button className="btn-primary" disabled={sending}>{sending ? 'Sending...' : 'Send'}</button>
        </div>
      </form>
    </section>
  );
}
