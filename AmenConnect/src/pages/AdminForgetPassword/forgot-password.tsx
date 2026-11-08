"use client"

import type React from "react"
import { useState } from "react"
import {
  IonContent,
  IonPage,
  IonInput,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonImg,
  IonIcon,
  IonLoading,
} from "@ionic/react"
import { mailOutline, lockClosedOutline } from "ionicons/icons"
import "./forgot-password.css"

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [isSuccess, setIsSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email address")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/admin/forget", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setMessage(data.message)
        setEmail("")
      } else {
        setError(data.message || "An error occurred. Please try again.")
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <IonPage>
      <IonContent className="forgot-password-container">
        <IonCard className="forgot-password-card">
          <IonCardHeader>
            <div className="header-icon">
              <IonIcon icon={lockClosedOutline} />
              <IonImg className="logoF" src="../../public/amen_logo.png" alt="Amen Logo" />
            </div>
            <IonCardTitle className="card-title">Reset Password</IonCardTitle>
          </IonCardHeader>

          <IonCardContent>
            {isSuccess ? (
              <div className="success-message">
                <IonText color="success">{message}</IonText>
                <IonButton
                  expand="block"
                  className="reset-button"
                  onClick={() => {
                    setIsSuccess(false)
                    setMessage("")
                  }}
                >
                  Request Another Reset
                </IonButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <p className="form-description">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <div className="input-container">
                  <IonInput
                    type="email"
                    value={email}
                    placeholder="Email Address"
                    onIonChange={(e) => setEmail(e.detail.value || "")}
                    className="email-input"
                    label="Email"
                    labelPlacement="floating"
                    fill="outline"
                    clearInput={true}
                  >
                    <IonIcon slot="start" icon={mailOutline} />
                  </IonInput>
                </div>

                {error && (
                  <IonText color="danger" className="error-message">
                    {error}
                  </IonText>
                )}

                <IonButton expand="block" type="submit" className="submit-button">
                  Send Reset Link
                </IonButton>
              </form>
            )}
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={isLoading} message="Sending reset link..." />
      </IonContent>
    </IonPage>
  )
}

export default ForgotPassword

