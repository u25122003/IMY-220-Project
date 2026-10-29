import { Link } from 'react-router-dom';

// Polaroid-style used in grids (in profile, album + search)
export default function PostPreview({ post, children }) {
  return (
    <article className="polaroid flex flex-col odd:hover:-rotate-2 even:hover:rotate-2 hover:scale-[1.02]">
      <Link to={`/post/${post._id}`} className="block">
        <div className="aspect-square overflow-hidden bg-ink">
          <img src={post.image} alt={post.caption} className="h-full w-full object-cover" />
        </div>
        <p className="mt-3 line-clamp-2 font-marker text-lg leading-snug">{post.caption}</p>
        {post.author && <p className="mt-1 text-sm text-muted">by {post.author.name}</p>}
      </Link>
      {children && <div className="mt-3">{children}</div>}
    </article>
  );
}
