import { Router } from 'express';
import * as Posts from '../api/posts.js';
import * as Albums from '../api/albums.js';
import * as Activity from '../api/activity.js';
import * as Reports from '../api/reports.js';
import { parseHashtags } from '../db.js';
import { handle, requireAuth, canManage, fail } from '../middleware.js';

const router = Router();

router.use(requireAuth);

// Images are either a URL, an uploaded file encoded as a data URL, or a bundled asset
const isValidImage = (image) => typeof image === 'string' && /^(https?:\/\/|data:image\/|\/assets\/)/.test(image);

router.get('/', handle(async (req, res) => {
  res.json({ success: true, posts: await Posts.listPosts() });
}));

router.get('/:id', handle(async (req, res) => {
  const post = await Posts.getPostDetails(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  const albums = await Albums.listContainingPost(post._id);
  const reported = Boolean(await Reports.hasReported(post._id, req.user._id));
  res.json({ success: true, post, albums, reported });
}));

router.post('/', handle(async (req, res) => {
  const { image, caption, hashtags, albumId } = req.body;
  if (!isValidImage(image)) return fail(res, 400, 'Please add an image');
  if (!caption?.trim()) return fail(res, 400, 'Please add a description');

  const post = await Posts.createPost({
    authorId: req.user._id,
    image,
    caption: caption.trim(),
    hashtags: parseHashtags(hashtags)
  });

  // Optionally drop the new post straight into one of the user's albums
  const album = albumId ? await Albums.findById(albumId) : null;
  if (album && album.userId.equals(req.user._id)) {
    await Albums.addPost(album._id, post._id);
    await Activity.logActivity({
      userId: req.user._id, type: 'album_add', postId: post._id, albumId: album._id,
      text: `${req.user.name} added a new photo to the album ${album.name}`
    });
  } else {
    await Activity.logActivity({
      userId: req.user._id, type: 'post', postId: post._id,
      text: `${req.user.name} shared a new photo`
    });
  }
  res.status(201).json({ success: true, post });
}));

router.put('/:id', handle(async (req, res) => {
  const post = await Posts.findById(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  if (!canManage(req.user, post.authorId)) return fail(res, 403, 'You can only edit your own posts');

  const { caption, hashtags } = req.body;
  if (caption !== undefined && !caption.trim()) return fail(res, 400, 'Description cannot be empty');

  await Posts.updatePost(post._id, {
    caption: caption?.trim(),
    hashtags: hashtags === undefined ? undefined : parseHashtags(hashtags)
  });
  res.json({ success: true, post: await Posts.getPostDetails(post._id) });
}));

router.delete('/:id', handle(async (req, res) => {
  const post = await Posts.findById(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  if (!canManage(req.user, post.authorId)) return fail(res, 403, 'You can only delete your own posts');

  // Albums that only held this post are deleted along with it
  const deletedAlbums = await Albums.removePostEverywhere(post._id);
  await Promise.all([
    Posts.deletePost(post._id),
    Activity.deleteForPost(post._id),
    Activity.deleteForAlbums(deletedAlbums),
    Reports.deleteForPosts([post._id])
  ]);
  res.json({ success: true, message: 'Post deleted' });
}));

// ---COMMENTS

router.post('/:id/comments', handle(async (req, res) => {
  const post = await Posts.findById(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  const text = req.body.text?.trim();
  if (!text) return fail(res, 400, 'Comment cannot be empty');

  await Posts.addComment(post._id, req.user._id, text);
  await Activity.logActivity({
    userId: req.user._id, type: 'comment', postId: post._id,
    text: `${req.user.name} commented: "${text.length > 60 ? `${text.slice(0, 60)}...` : text}"`
  });
  res.status(201).json({ success: true, post: await Posts.getPostDetails(post._id) });
}));

// The comment's author, the post's owner and admins can remove a comment
router.delete('/:id/comments/:commentId', handle(async (req, res) => {
  const post = await Posts.findById(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  const comment = post.comments?.find(c => c._id.toString() === req.params.commentId);
  if (!comment) return fail(res, 404, 'Comment not found');
  if (!canManage(req.user, comment.userId) && !canManage(req.user, post.authorId)) {
    return fail(res, 403, 'You cannot delete this comment');
  }
  await Posts.deleteComment(post._id, comment._id);
  res.json({ success: true, post: await Posts.getPostDetails(post._id) });
}));

// ---REPORTING

router.post('/:id/report', handle(async (req, res) => {
  const post = await Posts.findById(req.params.id);
  if (!post) return fail(res, 404, 'Post not found');
  if (post.authorId.equals(req.user._id)) return fail(res, 400, "You can't report your own post");
  if (await Reports.hasReported(post._id, req.user._id)) return fail(res, 400, 'You have already reported this post');

  const reason = await Reports.findReason(req.body.reasonId);
  if (!reason) return fail(res, 400, 'Please choose a reason');

  await Reports.createReport({ postId: post._id, reporterId: req.user._id, reason: reason.reason });
  res.status(201).json({ success: true, message: 'Thanks, an admin will review this post' });
}));

export default router;
