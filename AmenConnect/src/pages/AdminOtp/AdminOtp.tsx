// AdminOtp.tsx
"use client"

import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  IonContent,
  IonPage,
  IonButton,
  IonText,
  IonLabel,
  IonImg,
  IonIcon,
  IonInput,
} from "@ionic/react";
import { useHistory } from "react-router-dom";
import { lockClosed } from "ionicons/icons";
import axios from "axios";
import { useAdminAuth } from "../../AdminAuthContext";
import "./../AdminLogin/AdminLogin.css";

// Memoized OTP Input Component
const MemoizedOtpInput = memo(
  ({
    otp,
    onOtpChange,
  }: {
    otp: string;
    onOtpChange: (value: string) => void;
  }) => {
    return (
      <IonInput
        type="text"
        inputMode="numeric"
        maxlength={6}
        value={otp}
        onIonChange={(e) => onOtpChange(e.detail.value || "")}
        className="admin-input"
        placeholder="000000"
        required
      />
    );
  }
);

export default function AdminOtp() {
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(120); // 2 minutes countdown
  const history = useHistory();
  const timerRef = useRef<NodeJS.Timeout>();
  const { pendingAdmin, refreshAdminProfile } = useAdminAuth();

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    timerRef.current = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

// Verify OTP by calling backend endpoint
const handleVerifyOtp = async (e: React.FormEvent) => {
  e.preventDefault();
  if (isLoading) return;

  if (otp.length !== 6) {
    setErrorMessage("Veuillez entrer un code à 6 chiffres");
    return;
  }

  if (!pendingAdmin || !pendingAdmin.email) {
    setErrorMessage("Aucune adresse email trouvée. Veuillez réessayer.");
    return;
  }

  setIsLoading(true);

  try {
    await axios.post(
      "/api/admin/verify-otp",
      { email: pendingAdmin.email, otp },
      { withCredentials: true }
    );
    // Refresh the admin profile using fetchAdminProfile
    await refreshAdminProfile();

    // Then redirect to the dashboard
    history.push("/admin/dashboard");
  } catch (error: any) {
    setErrorMessage(
      error.response?.data?.message || "Code de vérification incorrect. Veuillez réessayer."
    );
  } finally {
    setIsLoading(false);
  }
};


  // Resend OTP by calling backend endpoint
  const handleResendOtp = async () => {
    if (!pendingAdmin || !pendingAdmin.email) {
      setErrorMessage("Aucune adresse email trouvée. Veuillez réessayer.");
      return;
    }
    setIsLoading(true);

    try {
      await axios.post(
        "/api/admin/resend-otp",
        { email: pendingAdmin.email },
        { withCredentials: true }
      );
      // Reset timer and clear error messages after successful resend
      setTimeLeft(120);
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Erreur lors de l'envoi du code. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  // useCallback to ensure a stable reference for the onChange handler
  const handleOtpChange = useCallback((value: string) => {
    // Allow only numeric characters and limit to 6 digits
    const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(numericValue);
  }, []);

  return (
    <IonPage>
      <IonContent className="admin-login-container" fullscreen>
        <div className="admin-layout">
          <div className="admin-sidebar">
            <div className="admin-logo-container">
              <IonImg src="../amen_logo.png" alt="Logo" className="admin-logo" />
            </div>
            <div className="admin-sidebar-content">
              <h2 className="admin-sidebar-title">Vérification</h2>
              <p className="admin-sidebar-text">Sécurité renforcée pour l'accès à l'administration</p>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-container">
              <h1 className="admin-title">Authentification à deux facteurs</h1>
              <p className="admin-subtitle">
                Veuillez saisir le code de vérification envoyé à votre appareil
              </p>

              <form onSubmit={handleVerifyOtp} className="admin-login-form">
                <div className="admin-input-group">
                  <IonLabel className="admin-input-label">Code de vérification</IonLabel>
                  <div className="admin-input-wrapper">
                    <IonIcon icon={lockClosed} className="admin-input-icon" />
                    {/* Use the memoized OTP input */}
                    <MemoizedOtpInput otp={otp} onOtpChange={handleOtpChange} />
                  </div>
                </div>

                {errorMessage && (
                  <IonText color="danger" className="admin-error-message">
                    {errorMessage}
                  </IonText>
                )}

                <div className="admin-otp-timer">
                  <IonText color={timeLeft <= 30 ? "danger" : "medium"}>
                    {timeLeft > 0
                      ? `Expire dans: ${formatTime(timeLeft)}`
                      : "Code expiré. Veuillez demander un nouveau code."}
                  </IonText>
                </div>

                <div className="admin-actions">
                  <IonButton
                    expand="block"
                    type="submit"
                    className="admin-login-button"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? "Vérification..." : "Vérifier"}
                  </IonButton>

                  <IonButton
                    expand="block"
                    fill="outline"
                    className="admin-resend-button"
                    disabled={isLoading || timeLeft > 0}
                    onClick={handleResendOtp}
                  >
                    Renvoyer le code
                  </IonButton>
                </div>

                <div className="admin-back-link">
                  <a onClick={() => history.push("/admin/login")} style={{ cursor: "pointer" }}>
                    Retour à la page de connexion
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
