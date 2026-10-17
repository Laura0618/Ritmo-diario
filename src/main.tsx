import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { SettingsProvider } from './store/SettingsProvider';
import { SyncProvider } from './store/SyncProvider';
import './index.css';
import { applyTheme, readTheme } from './lib/theme';

registerSW({ immediate: true });
applyTheme(readTheme());

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('No se encontró el elemento #root.');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <SyncProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </SyncProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
