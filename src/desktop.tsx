import React from 'react';
import ReactDOM from 'react-dom/client';
import { Desktop } from './components/Desktop';
import './index.css';

// Получаем vmId из URL
const urlParams = new URLSearchParams(window.location.search);
const vmId = window.location.pathname.split('/').pop() || 'unknown';
const vmName = urlParams.get('name') || 'VM';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Desktop vmId={vmId} vmName={vmName} />
  </React.StrictMode>,
);
