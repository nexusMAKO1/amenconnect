"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { IonContent, IonPage, IonSpinner, IonIcon } from "@ionic/react"
import { checkmarkCircleOutline, alertCircleOutline, refreshOutline } from "ionicons/icons"
import { io } from "socket.io-client"
import "./kiosk-waiting-approval.css"

interface KioskWaitingApprovalProps {
  serialNumber: string
}

const KioskWaitingApproval: React.FC<KioskWaitingApprovalProps> = ({ serialNumber }) => {
  const [status, setStatus] = useState<"waiting" | "approved" | "rejected">("waiting")
  const [message, setMessage] = useState<string>("Votre demande est en cours de traitement...")
  const [elapsedTime, setElapsedTime] = useState<number>(0)

  useEffect(() => {
    // Connect to Socket.IO via configured URL or relative origin (works with reverse proxy and Docker)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const socket = io(socketUrl, { path: "/socket.io" }); 

    // Log connection info
    socket.on("connect", () => {
      console.log("Socket connected with id", socket.id)
    })

    // Register this kiosk with the server
    socket.emit("registerKiosk", { serialNumber })

    // Listen for approval status updates
    socket.on("kioskApprovalStatus", (data) => {
      console.log("Received kioskApprovalStatus:", data)
      if (data.serialNumber === serialNumber) {
        setStatus(data.status)
        setMessage(data.message || "Votre demande a été traitée.")
      }
    })

    // Update elapsed time every minute
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 60000)

    // Clean up on unmount
    return () => {
      socket.off("connect")
      socket.off("kioskApprovalStatus")
      socket.disconnect()
      clearInterval(timer)
    }
  }, [serialNumber])

  const formatElapsedTime = () => {
    if (elapsedTime < 60) {
      return `${elapsedTime} minute${elapsedTime > 1 ? "s" : ""}`
    } else {
      const hours = Math.floor(elapsedTime / 60)
      const minutes = elapsedTime % 60
      return `${hours} heure${hours > 1 ? "s" : ""} ${minutes > 0 ? `et ${minutes} minute${minutes > 1 ? "s" : ""}` : ""}`
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="kiosk-waiting-container">
          <div className="background-white"></div>
          <div className="background-svg">
            <svg viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1080 0C1080 0 800 150 600 450C400 750 300 900 150 1200C0 1500 0 1920 0 1920H1080V0Z"
                fill="#F0F4FF"
              />
            </svg>
          </div>

          <div className="kiosk-waiting-content animate-fade-in">
            <div className="kiosk-logo">
              <img src="/amen_logo.png" alt="Logo" className="logo-img" />
            </div>

            <div className="status-container">
              {status === "waiting" && (
                <>
                  <div className="spinner-container">
                    <IonSpinner name="crescent" className="status-spinner" />
                  </div>
                  <h2 className="status-title">En attente d'approbation</h2>
                  <p className="status-message">{message}</p>
                  <div className="elapsed-time">Temps d'attente: {formatElapsedTime()}</div>
                </>
              )}

              {status === "approved" && (
                <>
                  <div className="status-icon approved">
                    <IonIcon icon={checkmarkCircleOutline} />
                  </div>
                  <h2 className="status-title">Configuration approuvée!</h2>
                  <p className="status-message">{message}</p>
                  <button className="refresh-button" onClick={handleRefresh}>
                    <IonIcon icon={refreshOutline} />
                    Redémarrer l'application
                  </button>
                </>
              )}

              {status === "rejected" && (
                <>
                  <div className="status-icon rejected">
                    <IonIcon icon={alertCircleOutline} />
                  </div>
                  <h2 className="status-title">Configuration rejetée</h2>
                  <p className="status-message">{message}</p>
                  <button className="refresh-button" onClick={handleRefresh}>
                    <IonIcon icon={refreshOutline} />
                    Réessayer
                  </button>
                </>
              )}
            </div>

            <div className="kiosk-info">
              <div className="info-item">
                <span className="info-label">Numéro de série:</span>
                <span className="info-value">{serialNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default KioskWaitingApproval
