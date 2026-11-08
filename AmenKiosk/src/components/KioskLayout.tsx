"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { IonIcon } from "@ionic/react"
import { timeOutline, logoEuro, settingsOutline } from "ionicons/icons"
import { useOrientation } from "../context/OrientationContext"
import { useTheme } from "../../../ThemeContext"
import { useHistory } from "react-router-dom"

interface KioskLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  showLogo?: boolean
  showAdminButton?: boolean
}

const KioskLayout: React.FC<KioskLayoutProps> = ({ children, pageTitle, showLogo = true, showAdminButton = true }) => {
  const { isLandscape } = useOrientation()
  const { theme } = useTheme()
  const history = useHistory()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [adminClickCount, setAdminClickCount] = useState(0)
  const [adminClickTimer, setAdminClickTimer] = useState<NodeJS.Timeout | null>(null)
  const [showAdminPrompt, setShowAdminPrompt] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [adminError, setAdminError] = useState("")
  const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    return currentTime.toLocaleDateString("fr-FR", options)
  }

  const formatTime = () => {
    return currentTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleLogoClick = () => {
    // Increment click counter
    setAdminClickCount((prev) => prev + 1)

    // Reset timer if exists
    if (adminClickTimer) {
      clearTimeout(adminClickTimer)
    }

    // Set new timer to reset counter after 3 seconds
    const timer = setTimeout(() => {
      setAdminClickCount(0)
    }, 3000)

    setAdminClickTimer(timer)

    // If clicked 5 times in succession, show admin prompt
    if (adminClickCount >= 4) {
      // 5th click
      setShowAdminPrompt(true)
      setAdminClickCount(0)
      if (adminClickTimer) {
        clearTimeout(adminClickTimer)
        setAdminClickTimer(null)
      }
    }
  }

  const handleAdminAccess = async () => {
    if (!adminPassword.trim()) {
      setAdminError("Veuillez saisir le mot de passe administrateur")
      return
    }
    setIsVerifyingAdmin(true)
    setAdminError("")
    try {
      const response = await fetch("/api/kiosk/verify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: adminPassword }),
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setShowAdminPrompt(false)
        setAdminPassword("")
        setAdminError("")
        history.push(data.redirect || "/setup")
      } else {
        setAdminError(data.message || "Mot de passe administrateur incorrect")
      }
    } catch (err) {
      setAdminError("Erreur de connexion au serveur d'authentification")
    } finally {
      setIsVerifyingAdmin(false)
    }
  }

  const handleAdminButtonClick = () => {
    setShowAdminPrompt(true)
  }

  return (
    <div className={`kiosk-container ${isLandscape ? "landscape" : "portrait"}`}>
      <div className="kiosk-background"></div>

      <header className="kiosk-header">
        <div className="kiosk-header-content">
          <div className="kiosk-datetime">
            <div className="kiosk-date">
              <IonIcon icon={timeOutline} />
              <span>{formatDate()}</span>
            </div>
            <div className="kiosk-time">{formatTime()}</div>
          </div>

          {showLogo && (
            <div className="kiosk-logo" onClick={handleLogoClick}>
              <img
                src={theme?.logoUrl || "amen_logo.png"}
                alt="Bank Logo"
                onError={(e) => {
                  // Fallback to default logo if the theme logo fails to load
                  const target = e.target as HTMLImageElement
                  target.onerror = null // Prevent infinite loop
                  target.src = "amen_logo.png"
                }}
              />
            </div>
          )}

          <div className="kiosk-header-extra">
            <div className="kiosk-currency">
              <IonIcon icon={logoEuro} />
              <span>EUR: 3.42 TND</span>
            </div>

            {showAdminButton && (
              <div className="kiosk-admin-button" onClick={handleAdminButtonClick}>
                <IonIcon icon={settingsOutline} />
              </div>
            )}
          </div>
        </div>

        {pageTitle && <h1 className="kiosk-page-title">{pageTitle}</h1>}
      </header>

      <main className="kiosk-main">{children}</main>

      <footer className="kiosk-footer">
        <div className="kiosk-footer-content">
          <p>© {currentTime.getFullYear()} AmenBank. Tous droits réservés.</p>
          <p className="kiosk-slogan">La réussite est à portée de clic</p>
        </div>
      </footer>

      {/* Admin access prompt */}
      {showAdminPrompt && (
        <div className="kiosk-admin-prompt">
          <div className="kiosk-admin-prompt-content">
            <h3>Accès administrateur</h3>
            <p>Veuillez entrer le mot de passe administrateur</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => {
                setAdminPassword(e.target.value)
                if (adminError) setAdminError("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdminAccess()
              }}
              placeholder="Mot de passe"
              disabled={isVerifyingAdmin}
            />
            {adminError && (
              <div style={{ color: "#ff4961", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {adminError}
              </div>
            )}
            <div className="kiosk-admin-prompt-actions">
              <button
                className="kiosk-admin-prompt-cancel"
                onClick={() => {
                  setShowAdminPrompt(false)
                  setAdminPassword("")
                  setAdminError("")
                }}
                disabled={isVerifyingAdmin}
              >
                Annuler
              </button>
              <button
                className="kiosk-admin-prompt-confirm"
                onClick={handleAdminAccess}
                disabled={isVerifyingAdmin}
              >
                {isVerifyingAdmin ? "Vérification..." : "Accéder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KioskLayout

