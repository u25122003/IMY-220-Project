import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityApi } from '../api';
import { useAuth } from '../AuthContext';
import Feed from '../components/Feed';
import SearchInput from '../components/SearchInput';
import Message, { Loading } from '../components/Message';

const FEEDS = {
  local: { label: 'Local Feed', description: 'Activity from you and your friends', empty: 'Nothing here yet. Add some friends or share a photo!' },
  global: { label: 'Global Feed', description: 'Activity from everyone on Pick n Post', empty: 'No activity yet.' }
};

const SORTS = {
  newest: 'Newest first',
  comments: 'Most commented'
};

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState('local');
  const [sort, setSort] = useState('newest');
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async () => {
    try {
      const data = await activityApi.feed(scope, sort);
      setActivity(data.activity);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [scope, sort]);

  useEffect(() => {
    setLoading(true);
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-marker text-4xl font-normal">Hey {user.name.split(' ')[0]}!</h1>
        <p className="text-muted">{FEEDS[scope].description}</p>
      </section>

      {/* Searching from the home page opens the full results on the search page */}
      <SearchInput onSearch={(q) => q && navigate(`/search?q=${encodeURIComponent(q)}`)} />

      <div className="mx-auto flex w-fit rounded-full bg-sand p-1">
        {Object.entries(FEEDS).map(([key, feed]) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            className={`rounded-full px-6 py-2.5 font-bold transition-colors ${scope === key ? 'bg-burnt text-beige shadow' : 'hover:text-burnt'}`}
          >
            {feed.label}
          </button>
        ))}
      </div>

      <label className="mx-auto flex w-fit items-center gap-3">
        <span className="font-bold text-muted">Sort by</span>
        <select className="input w-auto py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          {Object.entries(SORTS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>

      <Message>{error}</Message>
      {loading ? <Loading text="Loading feed..." /> : <Feed activity={activity} emptyText={FEEDS[scope].empty} onChange={loadFeed} />}
    </div>
  );
}
