"use client"

import type React from "react"

import { useState, useEffect, useContext } from "react"
import { IonPage, IonIcon, useIonToast, useIonAlert } from "@ionic/react"
import {
  colorPaletteOutline,
  saveOutline,
  refreshOutline,
  contrastOutline,
  addOutline,
  closeOutline,
  createOutline,
  trashOutline,
} from "ionicons/icons"
import { ThemeContext, type Theme } from "../../../../../ThemeContext"
import SidebarAdmin from "../../../components/SidebarAdmin"
import AdminPageHeader from "../adminpageheader"
import LogoUploader from "./logo-uploader"
import "./themes.css"
import "./logo-uploader.css"

// Define the interface for a theme preset
interface ThemePreset {
  id: string
  name: string
  theme: Theme
  isDefault?: boolean
  logo?: string | null
}

const ThemesPage = () => {
  const { theme, setTheme } = useContext(ThemeContext)
  const [presentToast] = useIonToast()
  const [presentAlert] = useIonAlert()
  const [localTheme, setLocalTheme] = useState<Theme>(theme)
  const [previewMode, setPreviewMode] = useState<"light" | "dark">("light")
  const [saveStatus, setSaveStatus] = useState<string>("")
  const [showAddPreset, setShowAddPreset] = useState<boolean>(false)
  const [newPresetName, setNewPresetName] = useState<string>("")
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [editingPresetName, setEditingPresetName] = useState<string>("")
  const [currentLogo, setCurrentLogo] = useState<string | null>(null)

  useEffect(() => {
    const loadCustomPresets = async () => {
      try {
        const response = await fetch("/api/presets")
        if (response.ok) {
          const customPresets = await response.json()
          setThemePresets([
            ...defaultPresets,
            ...customPresets.map((preset) => ({
              id: preset._id,
              name: preset.name,
              theme: preset.theme,
              isDefault: false,
              logo: preset.logo || null,
            })),
          ])
        }
      } catch (error) {
        console.error("Error loading custom theme presets:", error)
      }
    }

    loadCustomPresets()

    // Load current logo
    const loadCurrentLogo = async () => {
      try {
        const response = await fetch("/api/logo")
        if (response.ok) {
          const data = await response.json()
          setCurrentLogo(data.logoUrl)
        }
      } catch (error) {
        console.error("Error loading logo:", error)
      }
    }

    loadCurrentLogo()
  }, [])

  // Default theme presets
  const defaultPresets: ThemePreset[] = [
    {
      id: "default",
      name: "Par Défaut",
      isDefault: true,
      theme: {
        kioskPrimary: "#3880ff",
        kioskPrimaryDark: "#3171e0",
        kioskPrimaryLight: "#4c8dff",
        kioskPrimaryText: "#ffffff",
        kioskSecondary: "#2fdf75",
        kioskSecondaryDark: "#29c467",
        kioskSecondaryLight: "#44e283",
        kioskAccent: "#ffd534",
        kioskAccentDark: "#e6b800",
        kioskAccentLight: "#ffde59",
        kioskBackground: "#f8fafc",
        kioskSurface: "#ffffff",
        kioskBorder: "#e2e8f0",
        kioskTextMuted: "#64748b",
      },
    },
    {
      id: "dark",
      name: "Sombre",
      isDefault: true,
      theme: {
        kioskPrimary: "#1a237e",
        kioskPrimaryDark: "#0d1257",
        kioskPrimaryLight: "#2a34ae",
        kioskPrimaryText: "#ffffff",
        kioskSecondary: "#2ebd4e",
        kioskSecondaryDark: "#259a3e",
        kioskSecondaryLight: "#4cd76a",
        kioskAccent: "#ffd633",
        kioskAccentDark: "#e6b800",
        kioskAccentLight: "#ffe066",
        kioskBackground: "#121212",
        kioskSurface: "#1e1e1e",
        kioskBorder: "#333333",
        kioskTextMuted: "#a0a0a0",
      },
    },
    {
      id: "vibrant",
      name: "Vibrant",
      isDefault: true,
      theme: {
        kioskPrimary: "#6200ea",
        kioskPrimaryDark: "#4b00b3",
        kioskPrimaryLight: "#7c43ea",
        kioskPrimaryText: "#ffffff",
        kioskSecondary: "#00c853",
        kioskSecondaryDark: "#009624",
        kioskSecondaryLight: "#5efc82",
        kioskAccent: "#ff6d00",
        kioskAccentDark: "#c43c00",
        kioskAccentLight: "#ff9e40",
        kioskBackground: "#f5f5f5",
        kioskSurface: "#ffffff",
        kioskBorder: "#e0e0e0",
        kioskTextMuted: "#757575",
      },
    },
    {
      id: "pastel",
      name: "Pastel",
      isDefault: true,
      theme: {
        kioskPrimary: "#90caf9",
        kioskPrimaryDark: "#5d99c6",
        kioskPrimaryLight: "#c3fdff",
        kioskPrimaryText: "#000000",
        kioskSecondary: "#a5d6a7",
        kioskSecondaryDark: "#75a478",
        kioskSecondaryLight: "#d7ffd9",
        kioskAccent: "#ffcc80",
        kioskAccentDark: "#ca9b52",
        kioskAccentLight: "#ffffb0",
        kioskBackground: "#f8f9fa",
        kioskSurface: "#ffffff",
        kioskBorder: "#e1e2e3",
        kioskTextMuted: "#9e9e9e",
      },
    },
  ]

  // State for all theme presets (default + custom)
  const [themePresets, setThemePresets] = useState<ThemePreset[]>(defaultPresets)

  // Load custom presets from database on component mount
  useEffect(() => {
    const loadCustomPresets = async () => {
      try {
        const response = await fetch("/api/theme/presets")
        if (response.ok) {
          const customPresets = await response.json()
          // Combine default presets with custom presets
          setThemePresets([
            ...defaultPresets,
            ...customPresets.map((preset: any) => ({
              id: preset._id,
              name: preset.name,
              theme: preset.theme,
              isDefault: false,
              logo: preset.logo || null,
            })),
          ])
        }
      } catch (error) {
        console.error("Error loading custom theme presets:", error)
      }
    }

    loadCustomPresets()
  }, [])

  // Update local state when a color value is changed
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLocalTheme({ ...localTheme, [name]: value })
  }

  // Handle logo change
  const handleLogoChange = async (logoUrl: string | null) => {
    setCurrentLogo(logoUrl)

    // In a real app, you would save the logo URL to your database
    try {
      await fetch("/api/logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl }),
      })
    } catch (error) {
      console.error("Error saving logo:", error)
    }
  }

  // Apply theme changes to preview
  useEffect(() => {
    const previewElement = document.getElementById("theme-preview")
    if (previewElement) {
      Object.entries(localTheme).forEach(([key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`
        previewElement.style.setProperty(cssVar, value)
      })
    }
  }, [localTheme, previewMode])

  // Save theme to database
  const saveTheme = async () => {
    setSaveStatus("saving")

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
}`

    try {
      const response = await fetch("/api/theme/update-variables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ css: cssContent }),
      })

      if (response.ok) {
        setSaveStatus("success")
        setTheme(localTheme)
        setTimeout(() => setSaveStatus(""), 3000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus(""), 3000)
      }
    } catch (error) {
      console.error("Error updating theme settings:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus(""), 3000)
    }
  }

  // Reset to default theme
  const resetTheme = () => {
    const defaultTheme = defaultPresets[0].theme
    setLocalTheme(defaultTheme)
  }

  // Toggle preview mode between light and dark


  // Save current theme as a new preset
  const saveAsNewPreset = async () => {
    if (!newPresetName.trim()) {
      presentToast({
        message: "Veuillez entrer un nom pour le thème.",
        duration: 2500,
        position: "top",
        color: "warning",
      })
      return
    }

    try {
      const response = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPresetName,
          theme: localTheme,
          logo: currentLogo,
        }),
      })

      if (response.ok) {
        const newPreset = await response.json()
        setThemePresets([
          ...themePresets,
          {
            id: newPreset._id,
            name: newPresetName,
            theme: localTheme,
            isDefault: false,
            logo: currentLogo,
          },
        ])
        setNewPresetName("")
        setShowAddPreset(false)
        presentToast({
          message: "Thème personnalisé enregistré avec succès.",
          duration: 2500,
          position: "top",
          color: "success",
        })
      } else {
        presentToast({
          message: "Erreur lors de l'enregistrement du thème personnalisé.",
          duration: 3000,
          position: "top",
          color: "danger",
        })
      }
    } catch (error) {
      console.error("Error saving custom theme preset:", error)
      presentToast({
        message: "Erreur lors de l'enregistrement du thème personnalisé.",
        duration: 3000,
        position: "top",
        color: "danger",
      })
    }
  }

  // Update preset name
  const updatePresetName = async () => {
    if (!editingPresetId || !editingPresetName.trim()) return

    try {
      const response = await fetch(`/api/presets/${editingPresetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingPresetName }),
      })

      if (response.ok) {
        setThemePresets(
          themePresets.map((preset) =>
            preset.id === editingPresetId ? { ...preset, name: editingPresetName } : preset,
          ),
        )
        setEditingPresetId(null)
        setEditingPresetName("")
        presentToast({
          message: "Nom du thème mis à jour avec succès.",
          duration: 2500,
          position: "top",
          color: "success",
        })
      } else {
        presentToast({
          message: "Erreur lors de la mise à jour du nom du thème.",
          duration: 3000,
          position: "top",
          color: "danger",
        })
      }
    } catch (error) {
      console.error("Error updating preset name:", error)
      presentToast({
        message: "Erreur lors de la mise à jour du nom du thème.",
        duration: 3000,
        position: "top",
        color: "danger",
      })
    }
  }

  // Delete a custom preset
  const deletePreset = (presetId: string) => {
    presentAlert({
      header: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer ce thème personnalisé ?",
      buttons: [
        {
          text: "Annuler",
          role: "cancel",
        },
        {
          text: "Supprimer",
          role: "destructive",
          handler: async () => {
            try {
              const response = await fetch(`/api/presets/${presetId}`, {
                method: "DELETE",
              })

              if (response.ok) {
                setThemePresets(themePresets.filter((preset) => preset.id !== presetId))
                presentToast({
                  message: "Thème supprimé avec succès.",
                  duration: 2500,
                  position: "top",
                  color: "success",
                })
              } else {
                presentToast({
                  message: "Erreur lors de la suppression du thème.",
                  duration: 3000,
                  position: "top",
                  color: "danger",
                })
              }
            } catch (error) {
              console.error("Error deleting theme preset:", error)
              presentToast({
                message: "Erreur lors de la suppression du thème.",
                duration: 3000,
                position: "top",
                color: "danger",
              })
            }
          },
        },
      ],
    })
  }

  // Apply a preset theme
  const applyPreset = (preset: ThemePreset) => {
    setLocalTheme(preset.theme)
    if (preset.logo !== undefined) {
      setCurrentLogo(preset.logo)
    }
  }

  // Group theme colors by category for better organization
  const themeGroups = [
    {
      title: "Couleurs Primaires",
      colors: [
        { key: "kioskPrimary", label: "Primaire" },
        { key: "kioskPrimaryDark", label: "Primaire Foncé" },
        { key: "kioskPrimaryLight", label: "Primaire Clair" },
        { key: "kioskPrimaryText", label: "Texte sur Primaire" },
      ],
    },
    {
      title: "Couleurs Secondaires",
      colors: [
        { key: "kioskSecondary", label: "Secondaire" },
        { key: "kioskSecondaryDark", label: "Secondaire Foncé" },
        { key: "kioskSecondaryLight", label: "Secondaire Clair" },
      ],
    },
    {
      title: "Couleurs d'Accent",
      colors: [
        { key: "kioskAccent", label: "Accent" },
        { key: "kioskAccentDark", label: "Accent Foncé" },
        { key: "kioskAccentLight", label: "Accent Clair" },
      ],
    },
    {
      title: "Couleurs de Base",
      colors: [
        { key: "kioskBackground", label: "Arrière-plan" },
        { key: "kioskSurface", label: "Surface" },
        { key: "kioskBorder", label: "Bordure" },
        { key: "kioskTextMuted", label: "Texte Atténué" },
      ],
    },
  ]

  return (
    <IonPage>
      <div className="admin-dashboard-layout">
        <SidebarAdmin currentPage="Thèmes" />

        <div className="admin-dashboard-content">
          <AdminPageHeader
            title="Personnalisation des Thèmes"
            subtitle="Personnalisez l'apparence de votre application"
          />

          <div className="admin-theme-actions">
            <button
              className={`admin-theme-action-button save ${saveStatus}`}
              onClick={saveTheme}
              disabled={saveStatus === "saving"}
            >
              <IonIcon icon={saveOutline} />
              {saveStatus === "saving"
                ? "Enregistrement..."
                : saveStatus === "success"
                  ? "Enregistré!"
                  : saveStatus === "error"
                    ? "Erreur!"
                    : "Enregistrer le Thème"}
            </button>

            <button className="admin-theme-action-button reset" onClick={resetTheme}>
              <IonIcon icon={refreshOutline} />
              Réinitialiser
            </button>


          </div>

          {/* Logo Uploader Component */}
          <LogoUploader currentLogo={currentLogo || undefined} onLogoChange={handleLogoChange} />

          <div className="admin-theme-container">
            <div className="admin-theme-editor">
              {themeGroups.map((group) => (
                <div className="admin-theme-group" key={group.title}>
                  <h3 className="admin-theme-group-title">{group.title}</h3>
                  <div className="admin-theme-color-grid">
                    {group.colors.map((color) => (
                      <div className="admin-theme-color-item" key={color.key}>
                        <label className="admin-theme-color-label">
                          {color.label}
                          <div className="admin-theme-color-input-container">
                            <input
                              type="color"
                              name={color.key}
                              value={localTheme[color.key as keyof Theme]}
                              onChange={handleChange}
                              className="admin-theme-color-picker"
                            />
                            <input
                              type="text"
                              name={color.key}
                              value={localTheme[color.key as keyof Theme]}
                              onChange={handleChange}
                              className="admin-theme-color-text"
                            />
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-theme-preview-container">
              <h3 className="admin-theme-preview-title">Aperçu du Thème</h3>
              <div id="theme-preview" className={`admin-theme-preview ${previewMode === "dark" ? "dark-theme" : ""}`}>
                <div className="preview-header">
                  {currentLogo ? (
                    <div className="preview-logo">
                      <img src={currentLogo || "/placeholder.svg"} alt="Logo" className="preview-logo-image" />
                    </div>
                  ) : (
                    <div className="preview-logo"></div>
                  )}
                  <div className="preview-nav">
                    <div className="preview-nav-item active"></div>
                    <div className="preview-nav-item"></div>
                    <div className="preview-nav-item"></div>
                  </div>
                </div>
                <div className="preview-content">
                  <div className="preview-card primary">
                    <div className="preview-card-icon"></div>
                    <div className="preview-card-content">
                      <div className="preview-card-title"></div>
                      <div className="preview-card-text"></div>
                    </div>
                  </div>
                  <div className="preview-card secondary">
                    <div className="preview-card-icon"></div>
                    <div className="preview-card-content">
                      <div className="preview-card-title"></div>
                      <div className="preview-card-text"></div>
                    </div>
                  </div>
                  <div className="preview-card accent">
                    <div className="preview-card-icon"></div>
                    <div className="preview-card-content">
                      <div className="preview-card-title"></div>
                      <div className="preview-card-text"></div>
                    </div>
                  </div>
                </div>
                <div className="preview-footer">
                  <div className="preview-button primary"></div>
                  <div className="preview-button secondary"></div>
                  <div className="preview-button accent"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-theme-presets">
            <div className="admin-theme-presets-header">
              <h3 className="admin-theme-presets-title">
                <IonIcon icon={colorPaletteOutline} />
                Thèmes Prédéfinis
              </h3>
              <button className="admin-theme-add-preset-button" onClick={() => setShowAddPreset(!showAddPreset)}>
                <IonIcon icon={showAddPreset ? closeOutline : addOutline} />
                {showAddPreset ? "Annuler" : "Ajouter un Thème"}
              </button>
            </div>

            {showAddPreset && (
              <div className="admin-theme-add-preset-form">
                <input
                  type="text"
                  placeholder="Nom du thème"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="admin-theme-preset-name-input"
                />
                <button className="admin-theme-save-preset-button" onClick={saveAsNewPreset}>
                  <IonIcon icon={saveOutline} />
                  Enregistrer le Thème Actuel
                </button>
              </div>
            )}

            <div className="admin-theme-presets-grid">
              {themePresets.map((preset) => (
                <div className="admin-theme-preset-card" key={preset.id}>
                  <div
                    className="admin-theme-preset-preview"
                    onClick={() => applyPreset(preset)}
                    style={{
                      cursor: "pointer",
                    }}
                  >
                    {preset.logo ? (
                      <div className="preset-logo">
                        <img src={preset.logo || "/placeholder.svg"} alt="Logo" className="preset-logo-image" />
                      </div>
                    ) : null}
                    <div className="preset-color primary" style={{ backgroundColor: preset.theme.kioskPrimary }}></div>
                    <div
                      className="preset-color secondary"
                      style={{ backgroundColor: preset.theme.kioskSecondary }}
                    ></div>
                    <div className="preset-color accent" style={{ backgroundColor: preset.theme.kioskAccent }}></div>
                  </div>

                  {editingPresetId === preset.id ? (
                    <div className="admin-theme-preset-edit">
                      <input
                        type="text"
                        value={editingPresetName}
                        onChange={(e) => setEditingPresetName(e.target.value)}
                        className="admin-theme-preset-edit-input"
                        autoFocus
                      />
                      <div className="admin-theme-preset-edit-actions">
                        <button className="admin-theme-preset-edit-save" onClick={updatePresetName}>
                          <IonIcon icon={saveOutline} />
                        </button>
                        <button
                          className="admin-theme-preset-edit-cancel"
                          onClick={() => {
                            setEditingPresetId(null)
                            setEditingPresetName("")
                          }}
                        >
                          <IonIcon icon={closeOutline} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-theme-preset-info">
                      <div className="admin-theme-preset-title">{preset.name}</div>
                      {!preset.isDefault && (
                        <div className="admin-theme-preset-actions">
                          <button
                            className="admin-theme-preset-action edit"
                            onClick={() => {
                              setEditingPresetId(preset.id)
                              setEditingPresetName(preset.name)
                            }}
                            title="Renommer"
                          >
                            <IonIcon icon={createOutline} />
                          </button>
                          <button
                            className="admin-theme-preset-action delete"
                            onClick={() => deletePreset(preset.id)}
                            title="Supprimer"
                          >
                            <IonIcon icon={trashOutline} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </IonPage>
  )
}

export default ThemesPage

