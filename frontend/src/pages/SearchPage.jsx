import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { activityApi, FRIENDS_CHANGED } from '../api';
import SearchInput from '../components/SearchInput';
import ProfilePreview from '../components/ProfilePreview';
import FriendButton from '../components/FriendButton';
import PostPreview from '../components/PostPreview';
import AlbumPreview from '../components/AlbumPreview';
import Message, { Loading, EmptyState } from '../components/Message';

export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const runSearch = useCallback(() => {
    activityApi.search(query)
      .then(data => {
        setResults(data);
        setError('');
      })
      .catch(err => setError(err.message));
  }, [query]);

  useEffect(() => {
    if (!query) return setResults(null);
    setResults(undefined);
    runSearch();
  }, [query, runSearch]);

  // Keep the friend buttons up to date after a change from the bell
  useEffect(() => {
    if (!query) return;
    window.addEventListener(FRIENDS_CHANGED, runSearch);
    return () => window.removeEventListener(FRIENDS_CHANGED, runSearch);
  }, [query, runSearch]);

  const total = results ? results.users.length + results.posts.length + results.albums.length : 0;

  return (
    <div className="space-y-8">
      <h1 className="text-center font-marker text-4xl font-normal">Find users, posts & albums</h1>
      <SearchInput key={query} initialValue={query} onSearch={(q) => setParams(q ? { q } : {})} />
      <Message>{error}</Message>

      {results === undefined && <Loading text="Searching..." />}
      {results === null && <EmptyState>Type a name, a word or a #hashtag to start searching.</EmptyState>}
      {results && total === 0 && <EmptyState>Nothing matched "{query}".</EmptyState>}

      {results?.users.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title font-normal">Users</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.users.map(u => (
              <ProfilePreview key={u._id} user={u}>
                <FriendButton userId={u._id} relationship={u.relationship} small />
              </ProfilePreview>
            ))}
          </div>
        </section>
      )}

      {results?.albums.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title font-normal">Albums</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {results.albums.map(a => <AlbumPreview key={a._id} album={a} />)}
          </div>
        </section>
      )}

      {results?.posts.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title font-normal">Posts</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {results.posts.map(p => <PostPreview key={p._id} post={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
