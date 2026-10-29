import { notifyFriendsChanged, usersApi } from '../api';
import ProfilePreview from './ProfilePreview';
import { EmptyState } from './Message';

//friends you have
export default function FriendsList({ friends, canEdit, onChange }) {
  if (!friends.length) return <EmptyState>No friends yet.</EmptyState>;

  const unfriend = async (id) => {
    await usersApi.unfriend(id);
    notifyFriendsChanged();
    onChange();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {friends.map(friend => (
        <ProfilePreview key={friend._id} user={friend}>
          {canEdit && <button className="btn-secondary btn-small" onClick={() => unfriend(friend._id)}>Unfriend</button>}
        </ProfilePreview>
      ))}
    </div>
  );
}

//friend requests, only shown on your own profile
export function FriendRequests({ requests, onChange }) {
  if (!requests.length) return <EmptyState>No pending friend requests.</EmptyState>;

  const respond = async (action, id) => {
    await action(id);
    notifyFriendsChanged();
    onChange();
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {requests.map(requester => (
        <ProfilePreview key={requester._id} user={requester}>
          <div className="flex gap-2">
            <button className="btn-primary btn-small" onClick={() => respond(usersApi.accept, requester._id)}>Accept</button>
            <button className="btn-secondary btn-small" onClick={() => respond(usersApi.decline, requester._id)}>Decline</button>
          </div>
        </ProfilePreview>
      ))}
    </div>
  );
}
