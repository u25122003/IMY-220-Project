import { collection, toId, escapeRegex } from '../db.js';

const albums = () => collection('albums');

const withOwner = [
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'owner',
      pipeline: [{ $project: { name: 1, username: 1, avatar: 1 } }]
    }
  },
  { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
  // First post's image is used as the album cover
  {
    $lookup: {
      from: 'posts',
      let: { first: { $arrayElemAt: ['$posts', 0] } },
      pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$first'] } } }, { $project: { image: 1 } }],
      as: 'cover'
    }
  },
  { $addFields: { cover: { $arrayElemAt: ['$cover.image', 0] }, postCount: { $size: '$posts' } } }
];

export function listAlbums(filter = {}) {
  return albums().aggregate([{ $match: filter }, { $sort: { createdAt: -1 } }, ...withOwner]).toArray();
}

export const listByUser = (userId) => listAlbums({ userId: toId(userId) });

export const listContainingPost = (postId) => listAlbums({ posts: toId(postId) });

export function search(text) {
  const regex = new RegExp(escapeRegex(text.replace(/^#/, '')), 'i');
  return listAlbums({ $or: [{ name: regex }, { description: regex }, { hashtags: regex }] });
}

export async function findById(id) {
  const _id = toId(id);
  return _id ? albums().findOne({ _id }) : null;
}

export async function getAlbumDetails(id) {
  const _id = toId(id);
  if (!_id) return null;
  const [album] = await listAlbums({ _id });
  return album || null;
}

export async function createAlbum({ userId, name, description, hashtags, posts = [] }) {
  const album = {
    userId: toId(userId),
    name,
    description,
    hashtags,
    posts: posts.map(toId).filter(Boolean),
    createdAt: new Date()
  };
  const result = await albums().insertOne(album);
  return { ...album, _id: result.insertedId };
}

export async function updateAlbum(id, { name, description, hashtags }) {
  const update = {};
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description;
  if (hashtags !== undefined) update.hashtags = hashtags;
  await albums().updateOne({ _id: toId(id) }, { $set: update });
}

export const addPost = (albumId, postId) =>
  albums().updateOne({ _id: toId(albumId) }, { $addToSet: { posts: toId(postId) } });

export const removePost = (albumId, postId) =>
  albums().updateOne({ _id: toId(albumId) }, { $pull: { posts: toId(postId) } });

// When a post is deleted it has to disappear from every album.
// Any album left empty because of it is deleted too, and their ids are returned
// so the route can also remove those albums from the activity feed.
export async function removePostEverywhere(postId) {
  const _id = toId(postId);
  const containing = await albums().find({ posts: _id }, { projection: { _id: 1 } }).toArray();
  if (!containing.length) return [];

  await albums().updateMany({ posts: _id }, { $pull: { posts: _id } });

  const ids = containing.map(album => album._id);
  const emptied = await albums().find({ _id: { $in: ids }, posts: { $size: 0 } }, { projection: { _id: 1 } }).toArray();
  const emptiedIds = emptied.map(album => album._id);
  if (emptiedIds.length) await albums().deleteMany({ _id: { $in: emptiedIds } });
  return emptiedIds;
}

export const deleteAlbum = (id) => albums().deleteOne({ _id: toId(id) });

export const deleteByUser = (userId) => albums().deleteMany({ userId: toId(userId) });
