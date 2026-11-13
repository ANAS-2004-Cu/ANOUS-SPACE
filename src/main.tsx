import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/primitives.css';
import './styles/hub.css';
import './styles/scratchpad.css';
import './styles/temp-mail.css';
import './styles/games.css';
import './styles/gameya.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
