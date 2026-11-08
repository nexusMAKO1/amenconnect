"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { IonContent, IonPage, IonImg, useIonRouter, IonIcon } from "@ionic/react"
import {
  arrowBack,
  eyeOutline,
  eyeOffOutline,
  phonePortrait,
  mailOutline,
  lockClosedOutline,
} from "ionicons/icons"
import { QRCodeSVG } from "qrcode.react"
import { useLogin } from "../../hooks/useLogin"
import ForgotPasswordKiosk from "./ForgotPassword/ForgotPassword"
import "./login.css"
import Keyboard from "react-simple-keyboard"
import "react-simple-keyboard/build/css/index.css"

const LoginKiosk: React.FC = () => {
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isQrLoading, setIsQrLoading] = useState(true)
  // activeInput holds the name of the input that is currently focused ("email" or "password")
  const [activeInput, setActiveInput] = useState<string | null>(null)

  const ionRouter = useIonRouter()

  // Refs for managing inactivity timer and input elements
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  // Generate a unique session ID for the QR code when the component loads
  const sessionId = useRef(Math.random().toString(36).substring(2, 15))

  // Create a QR session in the database with improved error handling
  useEffect(() => {
    const createSession = async () => {
      try {
        setIsQrLoading(true)
        const response = await fetch("/api/qr-login/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ sessionId: sessionId.current }),
        })
        if (!response.ok) {
          console.error("Failed to create QR session:", await response.text())
        }
      } catch (err) {
        console.error("Error creating QR session:", err)
      } finally {
        setIsQrLoading(false)
      }
    }
    createSession()
  }, [])

  // Reset inactivity timer (session timeout)
  const INACTIVITY_TIMEOUT = 60000 // 60 seconds
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current)
    }
    inactivityTimer.current = setTimeout(() => {
      ionRouter.push("/home")
    }, INACTIVITY_TIMEOUT)
  }, [ionRouter])

  const handleUserInteraction = useCallback(() => {
    resetTimer()
  }, [resetTimer])

  // Use the useLogin hook for email/password login
  const { isLoading, errorMessage, login } = useLogin()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
    } catch (error) {
      console.error("Login failed:", error)
    }
    resetTimer()
  }

  const handleBack = () => {
    if (showForgotPassword) {
      setShowForgotPassword(false)
      setShowLoginForm(true)
    } else if (showLoginForm) {
      setShowLoginForm(false)
    } else {
      ionRouter.push("/home")
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const showIdentifierLogin = () => {
    setShowLoginForm(true)
    setShowForgotPassword(false)
    resetTimer()
  }

  const showForgotPasswordForm = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowForgotPassword(true)
    setShowLoginForm(false)
    resetTimer()
  }

  const handleForgotPasswordSubmit = async (email: string) => {
    try {
      const response = await fetch("/api/password/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Une erreur s'est produite")
      }
      return
    } catch (error: any) {
      throw error
    }
  }

  // Embed the session ID in the QR code URL for the mobile app or camera to scan
  // Dynamically points to the client portal on port 8100 using current hostname or VITE_CLIENT_PORTAL_URL
  const defaultPortalOrigin = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8100`
    : "http://localhost:8100"
  const clientPortalUrl = (import.meta.env.VITE_CLIENT_PORTAL_URL as string) || defaultPortalOrigin
  const qrCodeData = `${clientPortalUrl}/qr-scanner?session=${sessionId.current}`

  // Polling: periodically check if the mobile app has authenticated the session.
  // Run polling only when the QR code is being shown (i.e. when both showForgotPassword and showLoginForm are false)
  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (!showForgotPassword && !showLoginForm) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/qr-login/${sessionId.current}?t=${Date.now()}`, {
            credentials: "include",
            cache: "no-store",
          })
          if (response.ok) {
            const data = await response.json()
            if (data.status === "authenticated") {
              console.log("Session authenticated, redirecting to accueil...")
              clearInterval(intervalId)
             window.location.href = "/accueil"
            }
          }
        } catch (error) {
          console.error("Polling error:", error)
        }
      }, 3000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [showForgotPassword, showLoginForm])

  useEffect(() => {
    document.addEventListener("touchstart", handleUserInteraction)
    document.addEventListener("click", handleUserInteraction)

    if (showLoginForm && emailInputRef.current) {
      emailInputRef.current.focus()
    }

    return () => {
      document.removeEventListener("touchstart", handleUserInteraction)
      document.removeEventListener("click", handleUserInteraction)
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [handleUserInteraction, showLoginForm])

  // Virtual keyboard change handler updates the active input field's value
  const onKeyboardChange = (input: string) => {
    if (activeInput === "email") {
      setEmail(input)
    } else if (activeInput === "password") {
      setPassword(input)
    }
  }

  // Hide the keyboard on Enter
  const onKeyboardKeyPress = (button: string) => {
    if (button === "{enter}") {
      setActiveInput(null)
    }
  }

  // Handlers for input focus to display the virtual keyboard
  const handleInputFocus = (inputName: string) => {
    setActiveInput(inputName)
  }

  // Optionally, you can still use onBlur to hide the keyboard when clicking elsewhere
  const handleInputBlur = () => {
    setTimeout(() => {
      setActiveInput(null)
    }, 200)
  }

  // Determine the current value to pass to the keyboard
  const keyboardValue =
    activeInput === "email"
      ? email
      : activeInput === "password"
      ? password
      : ""

  return (
    <IonPage>
      <IonContent fullscreen>
        <div className="loginkiosk-container">
          <div className="loginkiosk-bg-circle-1"></div>
          <div className="loginkiosk-bg-circle-2"></div>
          <div className="loginkiosk-bg-blob"></div>

          <div className="loginkiosk-content">
            <div className="loginkiosk-back-button" onClick={handleBack}>
              <IonIcon icon={arrowBack} />
              <span>Retour</span>
            </div>
            {!showForgotPassword ? (
              <>
                <div className="loginkiosk-logo">
                  <IonImg src="favicon.png" alt="Amen Bank Logo" className="loginkiosk-img" />
                </div>
                <h1 className="loginkiosk-title">Connexion</h1>
                {!showLoginForm ? (
                  <div className="loginkiosk-qr-section animate-fade-in">
                    <div className="loginkiosk-qr-container">
                      <div className="loginkiosk-qr-instructions">
                        <IonIcon icon={phonePortrait} className="loginkiosk-qr-icon" />
                        <p>Scannez ce code QR avec votre application mobile</p>
                      </div>
                      <div className="loginkiosk-qr-code">
                        {isQrLoading ? (
                          <div className="qr-loading-spinner"></div>
                        ) : (
                          <QRCodeSVG
                            value={qrCodeData}
                            size={280}
                            level="H"
                            includeMargin={true}
                            bgColor="#ffffff"
                            fgColor="#121660"
                          />
                        )}
                      </div>
                      <button onClick={showIdentifierLogin} className="loginkiosk-alt-login">
                        Continuez avec identifiant
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="loginkiosk-form animate-fade-in" onSubmit={handleLogin}>
                    <div className="kiosk-form-group">
                      <label htmlFor="email" className="kiosk-label">
                        Adresse Email
                      </label>
                      <div className="loginkiosk-input-container">
                        <IonIcon icon={mailOutline} className="loginkiosk-input-icon" />
                        <input
                          ref={emailInputRef}
                          type="email"
                          id="email"
                          className="kiosk-input"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => handleInputFocus("email")}
                          onBlur={handleInputBlur}
                          placeholder="Entrez votre adresse email"
                          required
                        />
                      </div>
                    </div>
                    <div className="kiosk-form-group">
                      <label htmlFor="password" className="kiosk-label">
                        Mot de passe
                      </label>
                      <div className="loginkiosk-password-container">
                        <IonIcon icon={lockClosedOutline} className="loginkiosk-input-icon" />
                        <input
                          ref={passwordInputRef}
                          type={showPassword ? "text" : "password"}
                          id="password"
                          className="kiosk-input"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => handleInputFocus("password")}
                          onBlur={handleInputBlur}
                          placeholder="Entrez votre mot de passe"
                          required
                        />
                        <div className="loginkiosk-password-toggle" onClick={togglePasswordVisibility}>
                          <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                        </div>
                      </div>
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button type="submit" className="kiosk-btn" disabled={isLoading}>
                      {isLoading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                    <div className="loginkiosk-forgot-password">
                      <a href="#" onClick={showForgotPasswordForm}>
                        Mot de passe oublié ?
                      </a>
                    </div>
                  </form>
                )}
                <p className="loginkiosk-message">
                  La réussite est à
                  <br />
                  portée de clic.
                </p>
              </>
            ) : (
              <ForgotPasswordKiosk onBack={handleBack} onSubmit={handleForgotPasswordSubmit} />
            )}
          </div>
          {/* Render virtual keyboard if an input is active.
              The onMouseDown prevents keyboard clicks from triggering a blur on the input. */}
          {activeInput && (
            <div
              className="virtual-keyboard-container"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Keyboard
                onChange={onKeyboardChange}
                onKeyPress={onKeyboardKeyPress}
                value={keyboardValue}
              />
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default LoginKiosk
