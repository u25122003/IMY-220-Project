import { ObjectId } from 'mongodb';
import { collection, toId, escapeRegex } from '../db.js';
import { findSummaries } from './users.js';

const posts = () => collection('posts');

// Joins the author's public details onto each post
const withAuthor = [
  {
    $lookup: {
      from: 'users',
      localField: 'authorId',
      foreignField: '_id',
      as: 'author',
      pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
    }
  },
  { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
  { $addFields: { commentCount: { $size: { $ifNull: ['$comments', []] } } } },
  { $project: { comments: 0 } }
];

export function listPosts(filter = {}) {
  return posts().aggregate([{ $match: filter }, { $sort: { createdAt: -1 } }, ...withAuthor]).toArray();
}

export const listByAuthor = (authorId) => listPosts({ authorId: toId(authorId) });

export function listByIds(ids = []) {
  return listPosts({ _id: { $in: ids } });
}

export function search(text) {
  const regex = new RegExp(escapeRegex(text.replace(/^#/, '')), 'i');
  return posts()
    .aggregate([
      { $match: { $or: [{ caption: regex }, { hashtags: regex }] } },
      { $sort: { createdAt: -1 } },
      { $limit: 30 },
      ...withAuthor
    ])
    .toArray();
}

export async function findById(id) {
  const _id = toId(id);
  return _id ? posts().findOne({ _id }) : null;
}

// Full post for the post page: author plus the name/avatar of every commenter
export async function getPostDetails(id) {
  const _id = toId(id);
  if (!_id) return null;
  const [post] = await posts().aggregate([{ $match: { _id } }, ...withAuthor.slice(0, 2)]).toArray();
  if (!post) return null;

  const comments = post.comments || [];
  const commenters = await findSummaries([...new Set(comments.map(c => c.userId.toString()))].map(toId));
  post.comments = comments.map(comment => ({
    ...comment,
    user: commenters.find(u => u._id.equals(comment.userId)) || null
  }));
  return post;
}

export async function createPost({ authorId, image, caption, hashtags }) {
  const post = { authorId: toId(authorId), image, caption, hashtags, comments: [], createdAt: new Date() };
  const result = await posts().insertOne(post);
  return { ...post, _id: result.insertedId };
}

export async function updatePost(id, { caption, hashtags }) {
  const update = {};
  if (caption !== undefined) update.caption = caption;
  if (hashtags !== undefined) update.hashtags = hashtags;
  await posts().updateOne({ _id: toId(id) }, { $set: { ...update, updatedAt: new Date() } });
}

export const deletePost = (id) => posts().deleteOne({ _id: toId(id) });

export const deleteByAuthor = async (authorId) => {
  const owned = await posts().find({ authorId: toId(authorId) }, { projection: { _id: 1 } }).toArray();
  await posts().deleteMany({ authorId: toId(authorId) });
  return owned.map(p => p._id);
};

// ---COMMENTS (stored inside the post document)

export async function addComment(postId, userId, text) {
  const comment = { _id: new ObjectId(), userId: toId(userId), text, createdAt: new Date() };
  await posts().updateOne({ _id: toId(postId) }, { $push: { comments: comment } });
  return comment;
}

export const deleteComment = (postId, commentId) =>
  posts().updateOne({ _id: toId(postId) }, { $pull: { comments: { _id: toId(commentId) } } });

export const deleteCommentsByUser = (userId) =>
  posts().updateMany({}, { $pull: { comments: { userId: toId(userId) } } });
