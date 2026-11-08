"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { IonButton, IonContent, IonPage, IonLoading, IonToast, IonIcon } from "@ionic/react"
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from "html5-qrcode"
import { useHistory } from "react-router-dom"
import { arrowBack, scanOutline } from "ionicons/icons"
import "./qrscanner.css"

const QRScanner: React.FC = () => {
  const history = useHistory()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"info" | "success" | "error">("info")
  const [scanning, setScanning] = useState(true)
  const [scanSuccess, setScanSuccess] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    // If opened directly from an external mobile camera with ?session=... in URL
    const searchParams = new URLSearchParams(window.location.search);
    const sessionParam = searchParams.get("session");
    if (sessionParam) {
      handleScan(window.location.href);
    }
  }, []);

  useEffect(() => {
    if (!scanning) return

    const timer = setTimeout(() => {
      (async () => {
        let videoConstraints: any = { facingMode: { ideal: "environment" } }

        try {
          const devices = await Html5Qrcode.getCameras()
          const back = devices.find(d => /back|rear|environment/i.test(d.label))
          if (back) {
            videoConstraints = { deviceId: { exact: back.id } }
          }
        } catch (e) {
          console.warn("Échec de l'énumération des caméras, utilisation de facingMode idéal :", e)
        }

        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            videoConstraints,
          },
          false
        )

        scannerRef.current.render(
          decodedText => handleScan(decodedText),
          err => console.warn("Erreur du scanner QR :", err)
        )
      })()
    }, 100)

    return () => {
      clearTimeout(timer)
      scannerRef.current?.clear().catch(console.error)
    }
  }, [scanning])

  const handleScan = async (data: string) => {
    if (!data) return

    setScanSuccess(true)
    setScanning(false)
    setLoading(true)

    try {
      const url = new URL(data)
      const sessionId = url.searchParams.get("session")
      if (!sessionId) {
        setMessage("Code QR invalide : ID de session introuvable.")
        setMessageType("error")
        setLoading(false)
        return
      }

      const response = await fetch("/api/qr-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      })
      const result = await response.json()
      setLoading(false)

      if (response.ok) {
        setMessage("Authentification réussie ! Veuillez retourner au terminal.")
        setMessageType("success")
      } else {
        setMessage(result.message || "Échec de l’authentification. Veuillez réessayer.")
        setMessageType("error")
      }
    } catch (err) {
      console.error(err)
      setMessage("Format de code QR invalide. Veuillez scanner un code valide.")
      setMessageType("error")
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setScanSuccess(false)
    setScanning(true)
    setMessage("")
  }

  return (
    <IonPage className="qr-scanner-page">
      <IonContent className="ion-padding qr-scanner-container">
        <div className="qr-scanner-header">
          <h1>Scanner QR</h1>
          <p>Positionnez le code QR dans le cadre pour vous connecter</p>
        </div>

        {scanning && (
          <div className="qr-scanner-viewport">
            <div id="qr-reader"></div>
            <div className="scanner-overlay"></div>
            <div className="scanner-laser"></div>
            <div className="scanner-corners">
              <div className="corner top-left"></div>
              <div className="corner top-right"></div>
              <div className="corner bottom-left"></div>
              <div className="corner bottom-right"></div>
            </div>
          </div>
        )}

        {!scanning && (
          <div className={`status-card ${messageType} ${scanSuccess ? "scan-success" : ""}`}>
            <div className={`status-icon ${messageType}`}>
              {messageType === "success" ? "✓" : messageType === "error" ? "✕" : "i"}
            </div>
            <div className="status-message">{message}</div>
          </div>
        )}

        {loading && (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Authentification en cours…</span>
          </div>
        )}

        <div className="button-container">
          <IonButton className="qr-scanner-button back-button" onClick={() => history.goBack()} fill="outline">
            <IonIcon icon={arrowBack} slot="start" />
            Retour
          </IonButton>

          {!scanning && (
            <IonButton className="qr-scanner-button scan-again-button" onClick={resetScanner}>
              <IonIcon icon={scanOutline} slot="start" />
              Scanner à nouveau
            </IonButton>
          )}
        </div>

        <div className="scanner-instructions">
          <div className="instruction-item">
            <div className="instruction-icon">1</div>
            <div className="instruction-text">Ouvrez le code QR sur votre terminal</div>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">2</div>
            <div className="instruction-text">Positionnez-le dans le cadre</div>
          </div>
          <div className="instruction-item">
            <div className="instruction-icon">3</div>
            <div className="instruction-text">Maintenez stable jusqu’à la fin du scan</div>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Authentification en cours…" cssClass="custom-loading" />

        <IonToast
          isOpen={!!message}
          onDidDismiss={() => setMessage("")}
          message={message}
          duration={3000}
          position="bottom"
          cssClass={`qr-scanner-page-toast ${messageType}-toast`}
        />
      </IonContent>
    </IonPage>
  )
}

export default QRScanner
