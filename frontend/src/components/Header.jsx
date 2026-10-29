import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const navClass = ({ isActive }) =>
  `border-b-[3px] pb-1 font-bold uppercase tracking-wide transition-colors ${
    isActive ? 'border-beige' : 'border-transparent hover:border-beige/60'
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-burnt text-beige shadow-[0_4px_12px_rgba(192,78,1,0.3)]">
      <div className="flex w-full flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link to="/home" className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="" className="h-12 w-12 drop-shadow-[2px_4px_0_rgba(0,0,0,0.2)]" />
          <span className="font-marker text-3xl tracking-wide sm:text-4xl">Pick n Post</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-5 text-sm sm:gap-7">
          <NavLink to="/home" className={navClass}>Home</NavLink>
          <NavLink to="/search" className={navClass}>Search</NavLink>
          <NavLink to={`/profile/${user._id}`} className={navClass}>Profile</NavLink>
          {user.isAdmin && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/create-post" className="btn btn-small bg-beige text-burnt hover:bg-polaroid">+ Post</Link>
          <Link to="/create-album" className="btn btn-small bg-beige text-burnt hover:bg-polaroid">+ Album</Link>
          <ThemeToggle />
          <NotificationBell />
          <button onClick={handleLogout} className="btn btn-small border-2 border-beige text-beige hover:bg-beige hover:text-burnt">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
