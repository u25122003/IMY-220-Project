import { useState } from 'react';
import { notifyFriendsChanged, usersApi } from '../api';

//Shows the right action for how the viewer is related to this user
export default function FriendButton({ userId, relationship, onChange, small = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const size = small ? ' btn-small' : '';

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action(userId);
      notifyFriendsChanged();
      if (onChange) await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  let buttons;
  if (relationship === 'self') {
    return null;
  } else if (relationship === 'friends') {
    buttons = (
      <>
        <span className="font-bold text-olive">&#10003; Friends</span>
        <button className={`btn-secondary${size}`} disabled={busy} onClick={() => run(usersApi.unfriend)}>Unfriend</button>
      </>
    );
  } else if (relationship === 'requested') {
    buttons = (
      <>
        <span className="font-bold text-muted">Friend request sent</span>
        <button className={`btn-secondary${size}`} disabled={busy} onClick={() => run(usersApi.cancelRequest)}>Cancel</button>
      </>
    );
  } else if (relationship === 'incoming') {
    buttons = (
      <>
        <span className="font-bold text-burnt">Wants to be your friend</span>
        <button className={`btn-primary${size}`} disabled={busy} onClick={() => run(usersApi.accept)}>Accept</button>
        <button className={`btn-secondary${size}`} disabled={busy} onClick={() => run(usersApi.decline)}>Decline</button>
      </>
    );
  } else {
    buttons = <button className={`btn-primary${size}`} disabled={busy} onClick={() => run(usersApi.sendRequest)}>+ Add friend</button>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buttons}
      {error && <span className="text-sm font-bold text-danger">{error}</span>}
    </div>
  );
}
