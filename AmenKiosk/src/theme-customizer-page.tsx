// theme-customizer-page.tsx
import React, { useContext, useState } from 'react';
import { useIonToast } from '@ionic/react';
import { ThemeContext, Theme } from '../../ThemeContext';

const ThemeCustomizerPage: React.FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [presentToast] = useIonToast();
  const [localTheme, setLocalTheme] = useState<Theme>(theme);

  // Update local state when a color value is changed.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalTheme({ ...localTheme, [name]: value });
  };
  
  // Update the CSS variables on the root element.
  const updateRootVariables = () => {
    const root = document.documentElement;
    root.style.setProperty("--kiosk-primary", localTheme.kioskPrimary);
    root.style.setProperty("--kiosk-primary-dark", localTheme.kioskPrimaryDark);
    root.style.setProperty("--kiosk-primary-light", localTheme.kioskPrimaryLight);
    root.style.setProperty("--kiosk-primary-text", localTheme.kioskPrimaryText);
    root.style.setProperty("--kiosk-secondary", localTheme.kioskSecondary);
    root.style.setProperty("--kiosk-secondary-dark", localTheme.kioskSecondaryDark);
    root.style.setProperty("--kiosk-secondary-light", localTheme.kioskSecondaryLight);
    root.style.setProperty("--kiosk-accent", localTheme.kioskAccent);
    root.style.setProperty("--kiosk-accent-dark", localTheme.kioskAccentDark);
    root.style.setProperty("--kiosk-accent-light", localTheme.kioskAccentLight);
    root.style.setProperty("--kiosk-background", localTheme.kioskBackground);
    root.style.setProperty("--kiosk-surface", localTheme.kioskSurface);
    root.style.setProperty("--kiosk-border", localTheme.kioskBorder);
    root.style.setProperty("--kiosk-text-muted", localTheme.kioskTextMuted);
  };

  // Apply theme: update context and the root CSS variables.


  // Export the current theme by sending the CSS content to the backend (to be stored in MongoDB).
  const exportCSS = async () => {
    const cssContent = `
:root {
  --kiosk-primary: ${localTheme.kioskPrimary};
  --kiosk-primary-dark: ${localTheme.kioskPrimaryDark};
  --kiosk-primary-light: ${localTheme.kioskPrimaryLight};
  --kiosk-primary-text: ${localTheme.kioskPrimaryText};
  --kiosk-secondary: ${localTheme.kioskSecondary};
  --kiosk-secondary-dark: ${localTheme.kioskSecondaryDark};
  --kiosk-secondary-light: ${localTheme.kioskSecondaryLight};
  --kiosk-accent: ${localTheme.kioskAccent};
  --kiosk-accent-dark: ${localTheme.kioskAccentDark};
  --kiosk-accent-light: ${localTheme.kioskAccentLight};
  --kiosk-background: ${localTheme.kioskBackground};
  --kiosk-surface: ${localTheme.kioskSurface};
  --kiosk-border: ${localTheme.kioskBorder};
  --kiosk-text-muted: ${localTheme.kioskTextMuted};
  /* Additional variables (status, shadows, transitions, border radii, etc.) */
  --kiosk-success: #2fdf75;
  --kiosk-warning: #ffd534;
  --kiosk-danger: #ff4961;
  --kiosk-shadow-sm: 0 2px 8px rgba(18, 22, 96, 0.1);
  --kiosk-shadow-md: 0 4px 12px rgba(18, 22, 96, 0.15);
  --kiosk-shadow-lg: 0 8px 24px rgba(18, 22, 96, 0.2);
  --kiosk-transition-fast: 0.2s ease;
  --kiosk-transition-normal: 0.3s ease;
  --kiosk-transition-slow: 0.5s ease;
  --kiosk-radius-sm: 0.5rem;
  --kiosk-radius-md: 1rem;
  --kiosk-radius-lg: 1.5rem;
  --kiosk-radius-xl: 2rem;
  --kiosk-radius-full: 9999px;
  --viewport-height: 100vh;
  --viewport-width: 100vw;
  /* Ionic color overrides and font settings omitted for brevity */
}

/* Dark mode variables */
.dark-theme {
  --kiosk-primary: #1a237e;
  --kiosk-primary-dark: #0d1257;
  --kiosk-primary-light: #2a34ae;

  --kiosk-secondary: #2ebd4e;
  --kiosk-secondary-dark: #259a3e;
  --kiosk-secondary-light: #4cd76a;

  --kiosk-accent: #ffd633;
  --kiosk-accent-dark: #e6b800;
  --kiosk-accent-light: #ffe066;

  --kiosk-background: #121212;
  --kiosk-surface: #1e1e1e;
  --kiosk-border: #333333;
  --kiosk-text-muted: rgba(255, 255, 255, 0.7);
  --kiosk-primary-text: #ffffff;

  --kiosk-shadow-md: 0 4px 15px rgba(0, 0, 0, 0.2);
  --kiosk-shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);

  --ion-background-color: var(--kiosk-background);
  --ion-text-color: var(--kiosk-primary-text);

  /* Dark mode Ionic color overrides */
  --ion-color-primary: var(--kiosk-secondary);
  --ion-color-primary-shade: var(--kiosk-secondary-dark);
  --ion-color-primary-tint: var(--kiosk-secondary-light);

  --ion-color-secondary: var(--kiosk-accent);
  --ion-color-secondary-shade: var(--kiosk-accent-dark);
  --ion-color-secondary-tint: var(--kiosk-accent-light);

  /* Color steps for dark mode */
  --ion-color-step-50: #1e1e1e;
  --ion-color-step-100: #2a2a2a;
  --ion-color-step-150: #363636;
  --ion-color-step-200: #414141;
  --ion-color-step-250: #4d4d4d;
  --ion-color-step-300: #595959;
  --ion-color-step-350: #656565;
  --ion-color-step-400: #717171;
  --ion-color-step-450: #7d7d7d;
  --ion-color-step-500: #898989;
  --ion-color-step-550: #949494;
  --ion-color-step-600: #a0a0a0;
  --ion-color-step-650: #acacac;
  --ion-color-step-700: #b8b8b8;
  --ion-color-step-750: #c4c4c4;
  --ion-color-step-800: #d0d0d0;
  --ion-color-step-850: #dbdbdb;
  --ion-color-step-900: #e7e7e7;
  --ion-color-step-950: #f3f3f3;
}
`;  
    try {
      const response = await fetch('/api/theme/update-variables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ css: cssContent })
      });
      
      // Try parsing the response, but handle if the body is empty.
      let responseData = {};
      try {
        responseData = await response.json();
      } catch (e) {
        // If parsing fails, the response body might be empty.
        console.warn("Empty response body", e);
      }
      
      if (response.ok) {
        presentToast({
          message: 'Paramètres du thème enregistrés avec succès.',
          duration: 2500,
          position: 'top',
          color: 'success',
        });
      } else {
        presentToast({
          message: 'Échec de mise à jour des paramètres du thème.',
          duration: 3000,
          position: 'top',
          color: 'danger',
        });
      }
    } catch (error) {
      console.error("Error updating theme settings:", error);
      presentToast({
        message: 'Erreur réseau lors de la mise à jour du thème.',
        duration: 3000,
        position: 'top',
        color: 'danger',
      });
    }
  };


  return (
    <div style={{ padding: "1rem" }}>
      <h1>Theme Customizer</h1>
      {Object.entries(localTheme).map(([key, value]) => (
        <div key={key} style={{ marginBottom: "1rem" }}>
          <label style={{ textTransform: "capitalize" }}>
            {key.replace("kiosk", "Kiosk ")}:
            <input
              type="color"
              name={key}
              value={value}
              onChange={handleChange}
              style={{ marginLeft: "1rem" }}
            />
          </label>
        </div>
      ))}
      <button onClick={exportCSS}>Export CSS</button>
    </div>
  );
};

export default ThemeCustomizerPage;
