import { Link } from 'react-router-dom';

//clicking a hashtag searches for it. clickable hastag clips
export default function Hashtags({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="hashtag hover:bg-burnt hover:text-beige">
          {tag}
        </Link>
      ))}
    </div>
  );
}
