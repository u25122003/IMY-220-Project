import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../AuthContext';
import Message from './Message';

//login Form shown on splash page

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login(email, password);
      login(data.user);
      navigate('/home');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="label">Email address</span>
        <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input className="input" type="password" placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      <Message>{error}</Message>
      <button className="btn-primary w-full py-3 text-lg" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
    </form>
  );
}
