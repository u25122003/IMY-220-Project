import { Link } from 'react-router-dom';

//the latest couple of comments under a post in the activity feed.
//backend only sends last 2, plus commentCount so we know if there are more.
export default function FeedComments({ post }) {
  const comments = post.comments || [];
  const total = post.commentCount ?? comments.length;
  const linkText = total > comments.length ? `View all ${total} comments` : total ? 'Add a comment' : 'Be the first to comment';

  return (
    <div className="space-y-2 border-t-2 border-sand pt-3">
      {comments.map(comment => (
        <p key={comment._id} className="text-sm">
          {comment.user ? (
            <Link to={`/profile/${comment.user._id}`} className="font-bold hover:text-burnt">{comment.user.name}</Link>
          ) : (
            <span className="font-bold">Deleted user</span>
          )}{' '}
          {comment.text}
        </p>
      ))}
      <Link to={`/post/${post._id}`} className="inline-block text-sm font-bold text-burnt hover:underline">
        {linkText}
      </Link>
    </div>
  );
}
