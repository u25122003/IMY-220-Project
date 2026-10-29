import { collection, toId } from '../db.js';

const reports = () => collection('reports');
const reasons = () => collection('reportReasons');

// ---REPORT REASONS (admins can add new ones)

export const listReasons = () => reasons().find().sort({ reason: 1 }).toArray();

export async function addReason(reason) {
  const doc = { reason, createdAt: new Date() };
  const result = await reasons().insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export const deleteReason = (id) => reasons().deleteOne({ _id: toId(id) });

export const findReason = (id) => reasons().findOne({ _id: toId(id) });

// ---REPORTS

export async function createReport({ postId, reporterId, reason }) {
  const report = { postId: toId(postId), reporterId: toId(reporterId), reason, createdAt: new Date() };
  const result = await reports().insertOne(report);
  return { ...report, _id: result.insertedId };
}

export const hasReported = (postId, reporterId) =>
  reports().findOne({ postId: toId(postId), reporterId: toId(reporterId) });

export function listReports() {
  return reports()
    .aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'posts',
          localField: 'postId',
          foreignField: '_id',
          as: 'post',
          pipeline: [{ $project: { image: 1, caption: 1, authorId: 1 } }]
        }
      },
      { $unwind: { path: '$post', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'reporterId',
          foreignField: '_id',
          as: 'reporter',
          pipeline: [{ $project: { name: 1, username: 1 } }]
        }
      },
      { $unwind: { path: '$reporter', preserveNullAndEmptyArrays: true } }
    ])
    .toArray();
}

export const deleteReport = (id) => reports().deleteOne({ _id: toId(id) });

export const deleteForPosts = (postIds) => reports().deleteMany({ postId: { $in: postIds.map(toId) } });

export const deleteByReporter = (userId) => reports().deleteMany({ reporterId: toId(userId) });
