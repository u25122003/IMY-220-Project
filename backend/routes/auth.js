import { Router } from 'express';
import * as Users from '../api/users.js';
import { handle, requireAuth, reject } from '../middleware.js';

const router = Router();

async function uniqueUsername(base) {
  const clean = String(base).toLowerCase().replace(/[^a-z0-9_.]/g, '') || 'user';
  let candidate = clean;
  let n = 1;
  while (await Users.findByUsername(candidate)) candidate = `${clean}${n++}`;
  return candidate;
}

router.post('/signup', handle(async (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) return reject(res, 'Name, email and password are required');
  if (password.length < 6) return reject(res, 'Password must be at least 6 characters');
  if (await Users.findByEmail(email.trim())) return reject(res, 'An account with that email already exists');

  const user = await Users.createUser({
    name: name.trim(),
    username: await uniqueUsername(username?.trim() || email.split('@')[0]),
    email: email.trim(),
    password
  });
  res.status(201).json({ success: true, user: Users.publicUser(user) });
}));

router.post('/login', handle(async (req, res) => {
  const { email, password } = req.body;
  const user = email ? await Users.findByEmail(email.trim()) : null;
  if (!user || !Users.checkPassword(password || '', user.password)) {
    return reject(res, 'Incorrect email or password');
  }
  res.json({ success: true, user: Users.publicUser(user) });
}));

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: Users.publicUser(req.user) });
});

export default router;
