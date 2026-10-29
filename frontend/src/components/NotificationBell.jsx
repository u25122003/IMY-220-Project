import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi, FRIENDS_CHANGED, notifyFriendsChanged, usersApi } from '../api';
import { useAuth } from '../AuthContext';
import Avatar from './Avatar';

const CHECK_EVERY_MS = 15000;

//bell listens for it, wuthout being connected through props it uses custom browser event on window
//bell in header shows incoming friend requests, with accept or decline
export default function NotificationBell() {
  const { updateUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapper = useRef(null);

  const load = useCallback(async () => {
    try {
      const data = await usersApi.myRequests();
      setRequests(data.requests);
    } catch {
      // A failed check just keeps the last known list
    }
  }, []);

  //check now, every few seconds, and if a friend change happens elsewhere
  useEffect(() => {
    load();
    const timer = setInterval(load, CHECK_EVERY_MS);
    window.addEventListener(FRIENDS_CHANGED, load);
    return () => {
      clearInterval(timer);
      window.removeEventListener(FRIENDS_CHANGED, load);
    };
  }, [load]);

  // close the dropdown when clicking anywhere else
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!wrapper.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const respond = async (action, id) => {
    await action(id);
    const fresh = await authApi.me();
    updateUser(fresh.user);
    notifyFriendsChanged();
  };

  return (
    <div ref={wrapper} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-beige transition-colors hover:bg-beige hover:text-burnt"
        aria-label={`Friend requests (${requests.length})`}
        title="Friend requests"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {requests.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-xs font-bold text-beige">
            {requests.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-polaroid p-4 text-ink shadow-[0_12px_32px_rgba(0,0,0,0.25)]">
          <h3 className="mb-3 font-marker text-xl font-normal text-burnt">Friend requests</h3>
          {requests.length === 0 ? (
            <p className="text-sm text-muted">No new friend requests.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map(person => (
                <li key={person._id} className="flex items-center gap-3">
                  <Link to={`/profile/${person._id}`} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2 hover:text-burnt">
                    <Avatar src={person.avatar} name={person.name} className="h-9 w-9" />
                    <span className="truncate font-bold">{person.name}</span>
                  </Link>
                  <button className="btn-primary btn-small" onClick={() => respond(usersApi.accept, person._id)}>Accept</button>
                  <button className="btn-secondary btn-small" onClick={() => respond(usersApi.decline, person._id)}>Decline</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
