import { Router } from 'express';
import * as Users from '../api/users.js';
import * as Posts from '../api/posts.js';
import * as Albums from '../api/albums.js';
import * as Activity from '../api/activity.js';
import * as Reports from '../api/reports.js';
import { handle, requireAuth, requireAdmin, canManage, fail, reject } from '../middleware.js';

const router = Router();

router.use(requireAuth);

// Admin: every account
router.get('/', requireAdmin, handle(async (req, res) => {
  res.json({ success: true, users: await Users.listAll() });
}));

// Friend requests waiting for the logged-in user (used by the notification bell)
router.get('/me/requests', handle(async (req, res) => {
  res.json({ success: true, requests: await Users.findSummaries(req.user.friendRequests || []) });
}));

// A profile page: user details, friends, posts and albums
router.get('/:id', handle(async (req, res) => {
  const user = await Users.findById(req.params.id);
  if (!user) return fail(res, 404, 'User not found');

  const relationship = Users.relationshipBetween(req.user, user);
  const isMe = relationship === 'self';

  // Only friends (and admins) see the full profile, everyone else just sees the name and picture
  if (!isMe && relationship !== 'friends' && !req.user.isAdmin) {
    return res.json({
      success: true,
      isPrivate: true,
      user: { _id: user._id, name: user.name, avatar: user.avatar },
      friends: [],
      requests: [],
      posts: [],
      albums: [],
      relationship
    });
  }

  const [friends, requests, posts, albums] = await Promise.all([
    Users.findSummaries(user.friends || []),
    isMe ? Users.findSummaries(user.friendRequests || []) : [],
    Posts.listByAuthor(user._id),
    Albums.listByUser(user._id)
  ]);

  const { email, friendRequests, ...profile } = Users.publicUser(user);
  res.json({
    success: true,
    user: isMe || req.user.isAdmin ? { ...profile, email } : profile,
    friends,
    requests,
    posts,
    albums,
    relationship
  });
}));

router.put('/:id', handle(async (req, res) => {
  const target = await Users.findById(req.params.id);
  if (!target) return fail(res, 404, 'User not found');
  if (!canManage(req.user, target._id)) return fail(res, 403, 'You can only edit your own profile');

  const { name, username, pronouns, bio, avatar, isAdmin } = req.body;
  if (name !== undefined && !name.trim()) return reject(res, 'Name cannot be empty');
  if (username !== undefined) {
    if (!/^[a-z0-9_.]{3,30}$/i.test(username)) {
      return reject(res, 'Username must be 3-30 letters, numbers, dots or underscores');
    }
    const taken = await Users.findByUsername(username);
    if (taken && !taken._id.equals(target._id)) return reject(res, 'That username is taken');
  }

  const updated = await Users.updateUser(target._id, {
    name: name?.trim(),
    username,
    pronouns,
    bio,
    avatar,
    // Only admins may promote or demote accounts
    isAdmin: req.user.isAdmin && typeof isAdmin === 'boolean' ? isAdmin : undefined
  });
  res.json({ success: true, user: Users.publicUser(updated) });
}));

// Deletes the account and everything it created
router.delete('/:id', handle(async (req, res) => {
  const target = await Users.findById(req.params.id);
  if (!target) return fail(res, 404, 'User not found');
  if (!canManage(req.user, target._id)) return fail(res, 403, 'You can only delete your own profile');

  const postIds = await Posts.deleteByAuthor(target._id);
  // Other people's albums that only held this user's posts are deleted too
  const deletedAlbums = (await Promise.all(postIds.map(id => Albums.removePostEverywhere(id)))).flat();
  await Promise.all([
    Activity.deleteForPosts(postIds),
    Activity.deleteForAlbums(deletedAlbums),
    Activity.deleteForUser(target._id),
    Reports.deleteForPosts(postIds),
    Reports.deleteByReporter(target._id),
    Albums.deleteByUser(target._id),
    Posts.deleteCommentsByUser(target._id)
  ]);
  await Users.deleteUser(target._id);
  res.json({ success: true, message: 'Account deleted' });
}));

// ---FRIENDS (all from the point of view of the logged-in user)

async function getOther(req, res) {
  const other = await Users.findById(req.params.id);
  if (!other) {
    fail(res, 404, 'User not found');
    return null;
  }
  if (other._id.equals(req.user._id)) {
    fail(res, 400, "You can't friend yourself");
    return null;
  }
  return other;
}

router.post('/:id/friend-request', handle(async (req, res) => {
  const other = await getOther(req, res);
  if (!other) return;
  if (other.friends?.some(id => id.equals(req.user._id))) return fail(res, 400, 'You are already friends');

  const result = await Users.sendFriendRequest(req.user._id, other._id);
  if (result === 'accepted') {
    await Activity.logActivity({ userId: req.user._id, type: 'friend', text: `${req.user.name} and ${other.name} are now friends` });
  }
  res.json({ success: true, status: result });
}));

router.delete('/:id/friend-request', handle(async (req, res) => {
  const other = await getOther(req, res);
  if (!other) return;
  await Users.removeFriendRequest(other._id, req.user._id);
  res.json({ success: true });
}));

router.post('/:id/accept', handle(async (req, res) => {
  const other = await getOther(req, res);
  if (!other) return;
  if (!req.user.friendRequests?.some(id => id.equals(other._id))) return fail(res, 400, 'No friend request from this user');

  await Users.acceptFriendRequest(req.user._id, other._id);
  await Activity.logActivity({ userId: req.user._id, type: 'friend', text: `${req.user.name} and ${other.name} are now friends` });
  res.json({ success: true });
}));

router.post('/:id/decline', handle(async (req, res) => {
  const other = await getOther(req, res);
  if (!other) return;
  await Users.removeFriendRequest(req.user._id, other._id);
  res.json({ success: true });
}));

router.delete('/:id/friend', handle(async (req, res) => {
  const other = await getOther(req, res);
  if (!other) return;
  await Users.unfriend(req.user._id, other._id);
  res.json({ success: true });
}));

export default router;
