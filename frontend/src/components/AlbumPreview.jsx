import { Link } from 'react-router-dom';
import { photoCount } from '../utils';

//A small stack of polaroids representing an album, whole card is just a link to the album page
export default function AlbumPreview({ album }) {
  return (
    <Link to={`/album/${album._id}`} className="group block">
      <div className="relative mx-2 mt-2">
        <div className="absolute inset-0 rotate-3 bg-sand shadow" />
        <div className="absolute inset-0 -rotate-2 bg-polaroid shadow" />
        <div className="polaroid relative group-hover:-rotate-1">
          <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-burnt/80">
            {album.cover ? (
              <img src={album.cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-marker text-2xl text-beige">Empty album</span>
            )}
          </div>
          <h3 className="mt-3 font-marker text-xl font-normal">{album.name}</h3>
          <p className="text-sm text-muted">
            {photoCount(album.postCount ?? album.posts?.length ?? 0)}
            {album.owner && <> &middot; {album.owner.name}</>}
          </p>
        </div>
      </div>
    </Link>
  );
}
