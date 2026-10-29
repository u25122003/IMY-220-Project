import { collection, toId } from '../db.js';
import { findSummaries } from './users.js';

const activity = () => collection('activity');

// type is one of: post, album, album_add, comment, friend
export async function logActivity({ userId, type, text, postId = null, albumId = null }) {
  await activity().insertOne({
    userId: toId(userId),
    type,
    text,
    postId: postId ? toId(postId) : null,
    albumId: albumId ? toId(albumId) : null,
    createdAt: new Date()
  });
}

const joinDetails = [
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user',
      pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
    }
  },
  { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'posts',
      localField: 'postId',
      foreignField: '_id',
      as: 'post',
      pipeline: [
        // Count the reports on the post so the feed can hide posts reported more than twice
        { $lookup: { from: 'reports', localField: '_id', foreignField: 'postId', as: 'reports' } },
        {
          $project: {
            image: 1,
            caption: 1,
            hashtags: 1,
            authorId: 1,
            reportCount: { $size: '$reports' },
            // The feed only shows the latest 2 comments plus the total, the rest are on the post page
            commentCount: { $size: { $ifNull: ['$comments', []] } },
            comments: { $slice: [{ $ifNull: ['$comments', []] }, -2] }
          }
        }
      ]
    }
  },
  { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'albums',
      localField: 'albumId',
      foreignField: '_id',
      as: 'album',
      pipeline: [{ $project: { name: 1, description: 1, hashtags: 1, posts: 1 } }]
    }
  },
  { $unwind: { path: '$album', preserveNullAndEmptyArrays: true } }
];

// Adds the name and avatar of whoever wrote each feed comment
async function addCommenters(items) {
  const ids = items.flatMap(item => item.post?.comments?.map(c => c.userId) || []);
  const people = await findSummaries(ids);
  for (const item of items) {
    for (const comment of item.post?.comments || []) {
      comment.user = people.find(p => p._id.equals(comment.userId)) || null;
    }
  }
  return items;
}

// Local feed passes the ids of the user and their friends, global passes nothing.
// sort is 'newest' (default) or 'comments' (most commented first, newest breaks ties)
export async function getFeed(userIds = null, sort = 'newest', limit = 50) {
  const match = userIds ? { userId: { $in: userIds.map(toId) } } : {};
  const bySort = sort === 'comments' ? [{ $sort: { 'post.commentCount': -1, createdAt: -1 } }] : [];
  const items = await activity()
    .aggregate([{ $match: match }, { $sort: { createdAt: -1 } }, { $limit: limit }, ...joinDetails, ...bySort])
    .toArray();
  return addCommenters(items);
}

export async function listByUser(userId) {
  const items = await activity()
    .aggregate([{ $match: { userId: toId(userId) } }, { $sort: { createdAt: -1 } }, ...joinDetails])
    .toArray();
  return addCommenters(items);
}

export const updateActivity = (id, text) =>
  activity().updateOne({ _id: toId(id) }, { $set: { text } });

export const deleteActivity = (id) => activity().deleteOne({ _id: toId(id) });

export const deleteForPost = (postId) => activity().deleteMany({ postId: toId(postId) });

export const deleteForAlbum = (albumId) => activity().deleteMany({ albumId: toId(albumId) });

export const deleteForAlbums = (albumIds) => activity().deleteMany({ albumId: { $in: albumIds } });

export const deleteForUser = (userId) => activity().deleteMany({ userId: toId(userId) });

export const deleteForPosts = (postIds) => activity().deleteMany({ postId: { $in: postIds } });
