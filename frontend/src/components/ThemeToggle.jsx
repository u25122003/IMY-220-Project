import { useState } from 'react';
import { saveTheme } from '../theme';

// Button in the header that switches between light and dark mode
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
  const next = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    saveTheme(next);
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      className="btn btn-small border-2 border-beige text-beige hover:bg-beige hover:text-burnt"
    >
      {theme === 'dark' ? 'Light mode' : 'Dark mode'}
    </button>
  );
}
