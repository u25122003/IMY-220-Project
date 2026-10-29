import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../AuthContext';
import Message from './Message';

export default function SignUpForm() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');

    setLoading(true);
    setError('');
    try {
      const { confirmPassword, ...details } = form;
      const data = await authApi.signup(details);
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
        <span className="label">Name and surname</span>
        <input className="input" name="name" placeholder="e.g. Alissa Grobler" value={form.name} onChange={handleChange} required />
      </label>
      <label className="block">
        <span className="label">Username (optional)</span>
        <input
          className="input"
          name="username"
          placeholder="e.g. alissa_g"
          value={form.username}
          onChange={handleChange}
          pattern="[A-Za-z0-9_.]{3,30}"
          title="3-30 letters, numbers, dots or underscores"
        />
      </label>
      <label className="block">
        <span className="label">Email address</span>
        <input className="input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
      </label>
      <label className="block">
        <span className="label">Password</span>
        <input className="input" type="password" name="password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} minLength={6} required />
      </label>
      <label className="block">
        <span className="label">Confirm password</span>
        <input className="input" type="password" name="confirmPassword" placeholder="Type it again" value={form.confirmPassword} onChange={handleChange} required />
      </label>
      <Message>{error}</Message>
      <button className="btn-primary w-full py-3 text-lg" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
    </form>
  );
}
