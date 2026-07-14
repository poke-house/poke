import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import confetti from 'canvas-confetti';

// Bind local canvas-confetti to window for the game success animations
window.confetti = confetti;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);