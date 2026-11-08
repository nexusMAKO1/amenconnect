import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const Main: React.FC = () => {
  useEffect(() => {
    const setTransparentStatusBar = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: 'transparent' });
        }
      } catch (error) {
        console.error('Error setting status bar:', error);
      }
    };

    setTransparentStatusBar();
  }, []);

  return <App />;
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
