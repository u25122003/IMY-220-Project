//all communication with the backend goes through here
// The logged-in user is kept in sessionStorage

//session storage user key
const USER_KEY = 'user';

export function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

//saves user if one is passed
export function storeUser(user) {
  if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  else sessionStorage.removeItem(USER_KEY);
}

//base for every API call, reads stored user, buiilds headers x-user-id is set to users id when logged in, backedn uses that header to identify the caller, so its a header-based auth scheme rather than cookies.
async function request(path, { method = 'GET', body } = {}) {
  const user = getStoredUser();
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (user?._id) headers['x-user-id'] = user._id;

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    // The stored account no longer exists (e.g. deleted by an admin)
    if (response.status === 401 && user) {
      storeUser(null);
      window.dispatchEvent(new Event('session-expired'));
    }
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}
//sends a post
const post = (path, body = {}) => request(path, { method: 'POST', body });
//sends a put
const put = (path, body) => request(path, { method: 'PUT', body });
//sends a delete
const del = (path) => request(path, { method: 'DELETE' });

export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  signup: (details) => post('/auth/signup', details),
  logout: () => post('/auth/logout'),
  me: () => request('/auth/me')
};

export const usersApi = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
  myRequests: () => request('/users/me/requests'),
  update: (id, fields) => put(`/users/${id}`, fields),
  remove: (id) => del(`/users/${id}`),
  sendRequest: (id) => post(`/users/${id}/friend-request`),
  cancelRequest: (id) => del(`/users/${id}/friend-request`),
  accept: (id) => post(`/users/${id}/accept`),
  decline: (id) => post(`/users/${id}/decline`),
  unfriend: (id) => del(`/users/${id}/friend`)
};

export const postsApi = {
  list: () => request('/posts'),
  get: (id) => request(`/posts/${id}`),
  create: (fields) => post('/posts', fields),
  update: (id, fields) => put(`/posts/${id}`, fields),
  remove: (id) => del(`/posts/${id}`),
  comment: (id, text) => post(`/posts/${id}/comments`, { text }),
  removeComment: (id, commentId) => del(`/posts/${id}/comments/${commentId}`),
  report: (id, reasonId) => post(`/posts/${id}/report`, { reasonId })
};

export const albumsApi = {
  list: () => request('/albums'),
  get: (id) => request(`/albums/${id}`),
  create: (fields) => post('/albums', fields),
  update: (id, fields) => put(`/albums/${id}`, fields),
  remove: (id) => del(`/albums/${id}`),
  addPost: (id, postId) => post(`/albums/${id}/posts`, { postId }),
  removePost: (id, postId) => del(`/albums/${id}/posts/${postId}`)
};

export const activityApi = {
  feed: (scope, sort = 'newest') => request(`/feed?scope=${scope}&sort=${sort}`),
  update: (id, text) => put(`/activity/${id}`, { text }),
  remove: (id) => del(`/activity/${id}`),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`)
};

export const reportsApi = {
  reasons: () => request('/report-reasons'),
  addReason: (reason) => post('/report-reasons', { reason }),
  removeReason: (id) => del(`/report-reasons/${id}`),
  list: () => request('/reports'),
  dismiss: (id) => del(`/reports/${id}`)
};

// Lets the bell, profile and search pages refresh each other after a friend change
export const FRIENDS_CHANGED = 'friends-changed';
export const notifyFriendsChanged = () => window.dispatchEvent(new Event(FRIENDS_CHANGED));
