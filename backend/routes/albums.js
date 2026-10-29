import { Router } from 'express';
import * as Albums from '../api/albums.js';
import * as Posts from '../api/posts.js';
import * as Activity from '../api/activity.js';
import { parseHashtags } from '../db.js';
import { handle, requireAuth, canManage, fail } from '../middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', handle(async (req, res) => {
  res.json({ success: true, albums: await Albums.listAlbums() });
}));

router.get('/:id', handle(async (req, res) => {
  const album = await Albums.getAlbumDetails(req.params.id);
  if (!album) return fail(res, 404, 'Album not found');
  const posts = await Posts.listByIds(album.posts);
  res.json({ success: true, album, posts });
}));

router.post('/', handle(async (req, res) => {
  const { name, description, hashtags, posts } = req.body;
  if (!name?.trim()) return fail(res, 400, 'Album name is required');

  const album = await Albums.createAlbum({
    userId: req.user._id,
    name: name.trim(),
    description: description?.trim() || '',
    hashtags: parseHashtags(hashtags),
    posts: Array.isArray(posts) ? posts : []
  });
  await Activity.logActivity({
    userId: req.user._id, type: 'album', albumId: album._id,
    text: `${req.user.name} created the album ${album.name}`
  });
  res.status(201).json({ success: true, album });
}));

async function getOwnedAlbum(req, res) {
  const album = await Albums.findById(req.params.id);
  if (!album) {
    fail(res, 404, 'Album not found');
    return null;
  }
  if (!canManage(req.user, album.userId)) {
    fail(res, 403, 'You can only change your own albums');
    return null;
  }
  return album;
}

router.put('/:id', handle(async (req, res) => {
  const album = await getOwnedAlbum(req, res);
  if (!album) return;

  const { name, description, hashtags } = req.body;
  if (name !== undefined && !name.trim()) return fail(res, 400, 'Album name cannot be empty');

  await Albums.updateAlbum(album._id, {
    name: name?.trim(),
    description: description?.trim(),
    hashtags: hashtags === undefined ? undefined : parseHashtags(hashtags)
  });
  res.json({ success: true, album: await Albums.getAlbumDetails(album._id) });
}));

router.delete('/:id', handle(async (req, res) => {
  const album = await getOwnedAlbum(req, res);
  if (!album) return;
  await Promise.all([Albums.deleteAlbum(album._id), Activity.deleteForAlbum(album._id)]);
  res.json({ success: true, message: 'Album deleted' });
}));

router.post('/:id/posts', handle(async (req, res) => {
  const album = await getOwnedAlbum(req, res);
  if (!album) return;
  const post = await Posts.findById(req.body.postId);
  if (!post) return fail(res, 404, 'Post not found');
  if (album.posts.some(id => id.equals(post._id))) return fail(res, 400, 'That post is already in this album');

  await Albums.addPost(album._id, post._id);
  await Activity.logActivity({
    userId: req.user._id, type: 'album_add', postId: post._id, albumId: album._id,
    text: `${req.user.name} added a photo to the album ${album.name}`
  });
  res.json({ success: true });
}));

router.delete('/:id/posts/:postId', handle(async (req, res) => {
  const album = await getOwnedAlbum(req, res);
  if (!album) return;
  await Albums.removePost(album._id, req.params.postId);
  res.json({ success: true });
}));

export default router;
