import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import LoginForm from '../components/LoginForm';
import SignUpForm from '../components/SignUpForm';

export default function SplashPage() {
  const { user } = useAuth();
  const [mode, setMode] = useState('login');

  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 bg-linear-135 from-burnt to-burnt-dark px-4 py-12 text-center lg:flex-row lg:gap-20">
      <header className="max-w-md text-beige">
        <img src="/assets/logo.svg" alt="" className="mx-auto mb-4 h-24 w-24 drop-shadow-[3px_6px_0_rgba(0,0,0,0.25)]" />
        <h1 className="font-marker text-6xl font-normal text-beige drop-shadow-[2px_4px_6px_rgba(0,0,0,0.25)] sm:text-7xl">Pick n Post</h1>
        <p className="mt-4 text-xl">Share your moments, build your digital albums and keep up with your friends.</p>
      </header>

      <main className="w-full max-w-md rounded-3xl bg-beige p-8 text-left text-ink shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
        <div className="mb-6 flex rounded-full bg-sand p-1">
          {['login', 'signup'].map(option => (
            <button
              key={option}
              onClick={() => setMode(option)}
              className={`flex-1 rounded-full py-2 font-bold transition-colors ${mode === option ? 'bg-burnt text-beige' : 'text-ink hover:text-burnt'}`}
            >
              {option === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
        <h2 className="mb-1 text-2xl">{mode === 'login' ? 'Welcome back' : 'Create an account'}</h2>
        <p className="mb-6 text-muted">{mode === 'login' ? 'Log in to see what your friends are posting.' : 'It only takes a minute.'}</p>
        {mode === 'login' ? <LoginForm /> : <SignUpForm />}
      </main>
    </div>
  );
}
