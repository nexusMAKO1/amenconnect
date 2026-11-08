"use client"

import type React from "react"

import { IonButton, IonContent, IonPage, IonInput, IonToast, IonIcon } from "@ionic/react"
import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { lockClosed, checkmarkCircle, alertCircle, eyeOutline, eyeOffOutline, arrowBack } from "ionicons/icons"
import "./ResetPassword.css"

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showToast, setShowToast] = useState(false)
  const [token, setToken] = useState("")
  const [email, setEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenParam = params.get("token")
    const emailParam = params.get("email")

    if (tokenParam && emailParam) {
      setToken(tokenParam)
      setEmail(emailParam)
    } else {
      setError("Invalid or missing reset token.")
      setShowToast(true)
    }
  }, [location])

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError("Please enter all fields.")
      setShowToast(true)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      setShowToast(true)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/admin/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, token, newPassword: password }),
      })

      const data = await response.json()
      if (response.ok) {
        setSuccess("Password reset successfully. You can now log in.")
        setPassword("")
        setConfirmPassword("")
      } else {
        setError(data.message || "Password reset failed.")
      }
      setShowToast(true)
    } catch (err) {
      setError("Something went wrong.")
      setShowToast(true)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <IonPage className="fullscreen-page">
      <IonContent className="reset-password-container">
        <div className="background-design">
          <div className="circle circle-1"></div>
          <div className="circle circle-2"></div>
          <div className="circle circle-3"></div>
        </div>

        <div className="content-wrapper">
          <div className="reset-password-card">
            <div className="logo-container">
              <div className="logo-circle">
                <IonIcon icon={lockClosed} className="lock-icon" />
              </div>
            </div>

            <h2>Reset Your Password</h2>
            <p className="subtitle">Enter your new password below to secure your account</p>

            {success && (
              <div className="success-message">
                <IonIcon icon={checkmarkCircle} />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="error-message">
                <IonIcon icon={alertCircle} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div className="input-container">
                <IonInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onIonInput={(e: any) => setPassword(e.target.value)}
                  className="custom-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-container">
                <IonInput
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onIonInput={(e: any) => setConfirmPassword(e.target.value)}
                  className="custom-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <IonIcon icon={showConfirmPassword ? eyeOffOutline : eyeOutline} />
                </button>
              </div>
            </div>

            <IonButton expand="block" onClick={handleSubmit} className="reset-button" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </IonButton>

            <div className="back-to-login">
              <a href="/login">
                <IonIcon icon={arrowBack} />
                <span>Back to Login</span>
              </a>
            </div>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          message={error || success}
          duration={3000}
          onDidDismiss={() => setShowToast(false)}
          position="top"
          color={error ? "danger" : "success"}
          cssClass="custom-toast"
        />
      </IonContent>
    </IonPage>
  )
}

export default ResetPassword

