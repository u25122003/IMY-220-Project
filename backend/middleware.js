import * as Users from './api/users.js';

// Express 4 does not catch errors thrown in async handlers, so wrap every route
export const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Something went wrong on the server' });
  }
};

// The frontend sends the logged-in user's id in this header on every request
export const loadUser = handle(async (req, res, next) => {
  const id = req.get('x-user-id');
  req.user = id ? await Users.findById(id) : null;
  next();
});

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Please log in first' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ success: false, message: 'Admins only' });
  next();
}

// True when the logged-in user owns the document (by id) or is an admin
export const canManage = (user, ownerId) => Boolean(user && (user.isAdmin || user._id.equals(ownerId)));

export const fail = (res, status, message) => res.status(status).json({ success: false, message });

// For expected user mistakes (wrong password, taken email...) reply 200 with success: false,
// so the browser does not log them as failed network requests
export const reject = (res, message) => res.json({ success: false, message });
