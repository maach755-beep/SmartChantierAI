import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import './index.css'; // global Tailwind — typed via src/vite-env.d.ts
import App from './App.tsx';
import { dataStore } from '@/services/dataStore';

dataStore.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
