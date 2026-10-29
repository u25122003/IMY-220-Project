import { collection, toId, escapeRegex } from '../db.js';

const users = () => collection('users');

export const DEFAULT_AVATAR = '/assets/avatars/default.svg';

// The spec asks for passwords to be stored as plain text so markers can log in
export const checkPassword = (password, stored) => password === stored;

// Never send passwords to the frontend
export function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

const summaryFields = { projection: { name: 1, username: 1, avatar: 1, isAdmin: 1 } };

export async function findById(id) {
  const _id = toId(id);
  return _id ? users().findOne({ _id }) : null;
}

export const findByEmail = (email) => users().findOne({ email: String(email).toLowerCase() });

export const findByUsername = (username) => users().findOne({ username });

export async function findSummaries(ids = []) {
  if (!ids.length) return [];
  return users().find({ _id: { $in: ids } }, summaryFields).toArray();
}

export const listAll = () =>
  users().find({}, { projection: { password: 0 } }).sort({ name: 1 }).toArray();

// Users can be found by name, username or email address.
// Search results include how the viewer relates to each user
export async function search(text, viewer) {
  const regex = new RegExp(escapeRegex(text), 'i');
  const found = await users()
    .find({ $or: [{ name: regex }, { username: regex }, { email: regex }] }, { projection: { ...summaryFields.projection, friends: 1, friendRequests: 1 } })
    .limit(20)
    .toArray();
  return found.map(({ friends, friendRequests, ...user }) => ({
    ...user,
    relationship: relationshipBetween(viewer, { ...user, friends, friendRequests })
  }));
}

export async function createUser({ name, username, email, password }) {
  const user = {
    name,
    username,
    email: email.toLowerCase(),
    password,
    pronouns: '',
    bio: '',
    avatar: DEFAULT_AVATAR,
    friends: [],
    friendRequests: [],
    isAdmin: false,
    createdAt: new Date()
  };
  const result = await users().insertOne(user);
  return { ...user, _id: result.insertedId };
}

export async function updateUser(id, fields) {
  const allowed = ['name', 'username', 'pronouns', 'bio', 'avatar', 'isAdmin'];
  const update = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) update[key] = fields[key];
  }
  await users().updateOne({ _id: toId(id) }, { $set: update });
  return findById(id);
}

// Removes the user and every reference other users hold to them
export async function deleteUser(id) {
  const _id = toId(id);
  await users().updateMany({}, { $pull: { friends: _id, friendRequests: _id } });
  await users().deleteOne({ _id });
}

// ---FRIENDS
// friendRequests on a user holds the ids of people who asked to be their friend

// How the viewer relates to another user, used to pick the right friend button:
// self, friends, requested (viewer sent a request), incoming (viewer received one) or none
export function relationshipBetween(viewer, other) {
  if (viewer._id.equals(other._id)) return 'self';
  if (other.friends?.some(id => id.equals(viewer._id))) return 'friends';
  if (other.friendRequests?.some(id => id.equals(viewer._id))) return 'requested';
  if (viewer.friendRequests?.some(id => id.equals(other._id))) return 'incoming';
  return 'none';
}

export async function sendFriendRequest(fromId, toUserId) {
  const from = toId(fromId);
  const to = toId(toUserId);
  const sender = await users().findOne({ _id: from });

  // If they already asked us, sending a request back accepts theirs
  if (sender.friendRequests?.some(id => id.equals(to))) {
    await acceptFriendRequest(from, to);
    return 'accepted';
  }
  await users().updateOne({ _id: to }, { $addToSet: { friendRequests: from } });
  return 'sent';
}

export async function acceptFriendRequest(userId, requesterId) {
  const me = toId(userId);
  const other = toId(requesterId);
  await users().updateOne({ _id: me }, { $pull: { friendRequests: other }, $addToSet: { friends: other } });
  await users().updateOne({ _id: other }, { $pull: { friendRequests: me }, $addToSet: { friends: me } });
}

// Used both to decline a request someone sent you and to cancel one you sent
export async function removeFriendRequest(userId, requesterId) {
  await users().updateOne({ _id: toId(userId) }, { $pull: { friendRequests: toId(requesterId) } });
}

export async function unfriend(userId, friendId) {
  const me = toId(userId);
  const other = toId(friendId);
  await users().updateOne({ _id: me }, { $pull: { friends: other } });
  await users().updateOne({ _id: other }, { $pull: { friends: me } });
}
