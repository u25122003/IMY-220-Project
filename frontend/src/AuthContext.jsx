import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getStoredUser, storeUser } from './api';

const AuthContext = createContext(null);

//makes the logged in user available to every component in the app through react context

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const saveUser = (next) => {
    storeUser(next);
    setUser(next);
  };

  // Refresh the stored copy so friends / admin status are up to date
  useEffect(() => {
    if (!getStoredUser()) return;
    authApi.me().then(data => saveUser(data.user)).catch(() => saveUser(null));
  }, []);

  // api.js uses this when the backend no longer recognises the account
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      saveUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login: saveUser, updateUser: saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
