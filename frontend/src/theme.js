// Light / dark mode. The choice is saved in localStorage so it is remembered next time.
// If nothing is saved yet, we follow the device's own light / dark setting.
const THEME_KEY = 'theme';

export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Storage can be blocked (e.g. private browsing), fall through to the device setting
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Adding the "dark" class to <html> switches the colour variables in index.css
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function saveTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Not saved, but the theme still changes for this visit
  }
}
