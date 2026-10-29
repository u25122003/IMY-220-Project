import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { albumsApi, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import AlbumForm from '../components/AlbumForm';


//reuses ALbumForm the same form for Album Page and adds a photo picker
export default function CreateAlbumPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myPosts, setMyPosts] = useState([]);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    usersApi.get(user._id).then(data => setMyPosts(data.posts)).catch(() => setMyPosts([]));
  }, [user._id]);

  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);

  const create = async (fields) => {
    const data = await albumsApi.create({ ...fields, posts: selected });
    navigate(`/album/${data.album._id}`);
  };

  return (
    <div className="card mx-auto max-w-2xl space-y-5">
      <h1 className="section-title text-4xl font-normal">New album</h1>
      <AlbumForm submitLabel="Create album" onSubmit={create}>
        {myPosts.length > 0 && (
          <div>
            <span className="label">Choose photos to include ({selected.length} selected)</span>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {myPosts.map(post => (
                <button
                  type="button"
                  key={post._id}
                  onClick={() => toggle(post._id)}
                  className={`aspect-square overflow-hidden rounded-lg border-4 transition-colors ${selected.includes(post._id) ? 'border-burnt' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={post.image} alt={post.caption} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </AlbumForm>
    </div>
  );
}
