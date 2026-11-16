import React from 'react';
import ReactDOM from 'react-dom/client';
import { HotdogDetector } from './components/HotdogDetector';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <main className="min-h-screen flex items-center justify-center p-6">
      <HotdogDetector />
    </main>
  </React.StrictMode>
);
