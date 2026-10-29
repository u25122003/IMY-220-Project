import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { applyTheme, getSavedTheme } from './theme';
import './index.css';

// Set light / dark mode before the first render so the page doesn't flash the wrong colours
applyTheme(getSavedTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
