import { Router } from 'express';
import * as Activity from '../api/activity.js';
import * as Reports from '../api/reports.js';
import * as Users from '../api/users.js';
import * as Posts from '../api/posts.js';
import * as Albums from '../api/albums.js';
import { handle, requireAuth, requireAdmin, fail } from '../middleware.js';
 
const router = Router();

router.use(requireAuth);

// feed
// local = the user and their friends, global= everyone
// sort => newest or comments
router.get('/feed', handle(async (req, res) => {
  const scope = req.query.scope === 'global' ? 'global' : 'local';
  const sort = req.query.sort === 'comments' ? 'comments' : 'newest';
  const ids = scope === 'local' ? [req.user._id, ...(req.user.friends || [])] : null;
  res.json({ success: true, scope, sort, activity: await Activity.getFeed(ids, sort) });
}));

// activity (admins can edit and delete any activity)

router.put('/activity/:id', requireAdmin, handle(async (req, res) => {
  const text = req.body.text?.trim();
  if (!text) return fail(res, 400, 'Activity text cannot be empty');
  await Activity.updateActivity(req.params.id, text);
  res.json({ success: true });
}));

router.delete('/activity/:id', requireAdmin, handle(async (req, res) => {
  await Activity.deleteActivity(req.params.id);
  res.json({ success: true });
}));

//report reasons

router.get('/report-reasons', handle(async (req, res) => {
  res.json({ success: true, reasons: await Reports.listReasons() });
}));

router.post('/report-reasons', requireAdmin, handle(async (req, res) => {
  const reason = req.body.reason?.trim();
  if (!reason) return fail(res, 400, 'Reason cannot be empty');
  const existing = await Reports.listReasons();
  if (existing.some(r => r.reason.toLowerCase() === reason.toLowerCase())) return fail(res, 400, 'That reason already exists');
  res.status(201).json({ success: true, reason: await Reports.addReason(reason) });
}));

router.delete('/report-reasons/:id', requireAdmin, handle(async (req, res) => {
  await Reports.deleteReason(req.params.id);
  res.json({ success: true });
}));

// reports

router.get('/reports', requireAdmin, handle(async (req, res) => {
  res.json({ success: true, reports: await Reports.listReports() });
}));

router.delete('/reports/:id', requireAdmin, handle(async (req, res) => {
  await Reports.deleteReport(req.params.id);
  res.json({ success: true });
}));

// --search user by anything

router.get('/search', handle(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ success: true, users: [], posts: [], albums: [] });
  const [users, posts, albums] = await Promise.all([Users.search(q, req.user), Posts.search(q), Albums.search(q)]);
  res.json({ success: true, users, posts, albums });
}));

export default router;
