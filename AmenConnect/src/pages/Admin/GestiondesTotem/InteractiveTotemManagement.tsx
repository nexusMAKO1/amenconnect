"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonPage,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonModal,
  IonTextarea,
  IonAlert,
  IonButton,
} from "@ionic/react"
import {
  refreshOutline,
  powerOutline,
  bugOutline,
  thermometerOutline,
  cloudUploadOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
} from "ionicons/icons"
import "./InteractiveTotemManagement.css"
import SidebarAdmin from "../../../components/SidebarAdmin"
import { useAdminAuth } from "../../../AdminAuthContext"
import AdminPageHeader from "../adminpageheader"
import KioskApprovalTab from "./kiosk-approval-tab"
import axios from "axios"

interface Totem {
  id: string // e.g., "TM1"
  status: "online" | "offline"
  version: string
  temperature: number
  serial: string // the kiosk's SN field (e.g., "9S716R612613ZM3001160")
  apiUrl: string // the kiosk's API URL (e.g., "http://127.0.0.1:5000")
  location?: string // the kiosk's location
  agency?: string // the kiosk's agency name
}

const InteractiveTotemManagement: React.FC = () => {
  const { authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<"status" | "maintenance" | "incidents" | "register" | "approval">("status")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTotem, setSelectedTotem] = useState<string | null>(null)

  // State for kiosks (totems)
  const [totems, setTotems] = useState<Totem[]>([])

  // Remote maintenance state
  const [selectedMaintenanceTotem, setSelectedMaintenanceTotem] = useState<string | null>(null)
  const [selectedMaintenanceAction, setSelectedMaintenanceAction] = useState<string | null>(null)
  const [maintenanceProgress, setMaintenanceProgress] = useState<number>(0)

  // New state for diagnostic result and modal
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [isDiagnosticModalOpen, setIsDiagnosticModalOpen] = useState<boolean>(false)

  // Alert state for notifications
  const [alertMessage, setAlertMessage] = useState<string>("")
  const [showAlert, setShowAlert] = useState<boolean>(false)

  // Fetch kiosks from the API when the component mounts
  useEffect(() => {
    const fetchKiosks = async () => {
      try {
        const response = await axios.get("/api/kiosk")
        // Filter out kiosks that are not enabled
        const enabledKiosks = response.data.filter((kiosk: any) => kiosk.enabled)
        // Map API response to match our Totem interface.
        const mappedKiosks = enabledKiosks.map((kiosk: any) => ({
          id: kiosk.tote,
          status: kiosk.status,
          version: kiosk.version,
          temperature: kiosk.temperature,
          serial: kiosk.SN,
          apiUrl: kiosk.apiUrl,
          location: kiosk.location,
          agency: kiosk.agencyName,
        }))
        setTotems(mappedKiosks)
      } catch (error) {
        console.error("Error fetching kiosks:", error)
        setAlertMessage("Erreur lors de la récupération des kiosks")
        setShowAlert(true)
      }
    }

    fetchKiosks()
  }, [])

  if (authLoading) {
    return <div className="admin-loading">Loading...</div>
  }

  // Handler for refreshing temperature for a specific totem
  const handleRefresh = async (totemId: string) => {
    const totem = totems.find((t) => t.id === totemId)
    if (!totem) return

    try {
      const serialResponse = await axios.get(`${totem.apiUrl}/serial`, { timeout: 3000 })
      let newStatus: "online" | "offline" = "offline"
      if (serialResponse.status === 200 && serialResponse.data.serial_number) {
        newStatus = "online"
      }

      let newTemperature = 0
      if (newStatus === "online") {
        const tempResponse = await axios.get(`${totem.apiUrl}/temperature`, { timeout: 3000 })
        if (tempResponse.status === 200 && typeof tempResponse.data.temperature !== "undefined") {
          newTemperature = tempResponse.data.temperature
        }
      }

      setTotems((prevTotems) =>
        prevTotems.map((t) => (t.id === totemId ? { ...t, status: newStatus, temperature: newTemperature } : t)),
      )
    } catch (error) {
      console.error("Error refreshing totem info:", error)
      setAlertMessage(`Error refreshing Totem ${totemId}.`)
      setShowAlert(true)
    }
  }

  // New shutdown handler calling the kiosk's Python API using its serial number
  const handleShutdown = async (totem: Totem) => {
    try {
      const response = await axios.post("/api/kiosk/shutdown", {
        totemId: totem.id,
      })

      setTotems((prevTotems) =>
        prevTotems.map((t) => (t.id === totem.id ? { ...t, status: "offline", temperature: 0 } : t)),
      )
      setAlertMessage(response.data.message || `Shutdown command sent to Totem ${totem.id}`)
      setShowAlert(true)
    } catch (error) {
      console.error("Error shutting down totem:", error)
      setAlertMessage(`Error shutting down Totem ${totem.id}`)
      setShowAlert(true)
    }
  }

  // Handler for executing remote maintenance action including diagnostics
  const handleExecuteMaintenance = async () => {
    if (!selectedMaintenanceTotem || !selectedMaintenanceAction) {
      setAlertMessage("Please select both a Totem and an Action.")
      setShowAlert(true)
      return
    }

    // Find the selected totem from the state
    const totem = totems.find((t) => t.id === selectedMaintenanceTotem)
    if (!totem) {
      setAlertMessage("Selected Totem not found.")
      setShowAlert(true)
      return
    }

    // If the action is "diagnose", call the new diagnostic endpoint
    if (selectedMaintenanceAction === "diagnose") {
      try {
        const response = await axios.post("/api/kiosk/diagnostic", {
          serialNumber: totem.serial,
        })
        setDiagnosticResult(response.data)
        setIsDiagnosticModalOpen(true)
      } catch (error: any) {
        console.error("Error running diagnostics:", error)
        setAlertMessage(`Error running diagnostics on Totem ${totem.id}`)
        setShowAlert(true)
      }
      return
    }

    // Other maintenance actions (update, restart)
    try {
      await axios.post("http://localhost:3000/api/kiosk/maintenance", {
        totemId: selectedMaintenanceTotem,
        action: selectedMaintenanceAction,
      })
      if (selectedMaintenanceAction === "update") {
        setMaintenanceProgress(0)
        const interval = setInterval(() => {
          setMaintenanceProgress((prev) => {
            if (prev >= 1) {
              clearInterval(interval)
              setAlertMessage(
                `Maintenance action "${selectedMaintenanceAction}" completed for Totem ${selectedMaintenanceTotem}`,
              )
              setShowAlert(true)
              return 1
            }
            return prev + 0.1
          })
        }, 500)
      } else {
        setAlertMessage(
          `Maintenance action "${selectedMaintenanceAction}" executed for Totem ${selectedMaintenanceTotem}`,
        )
        setShowAlert(true)
      }
    } catch (error) {
      console.error("Error executing maintenance action:", error)
      setAlertMessage(`Error executing maintenance action on Totem ${selectedMaintenanceTotem}`)
      setShowAlert(true)
    }
  }

  // Render the list of kiosks in the "État des Appareils" tab
  const renderDeviceStatus = () => (
    <div className="admin-table-container">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Totem ID</th>
            <th>Status</th>
            <th>Numéro de serie</th>
            <th>Location</th>
            <th>Agence</th>
            <th>Version</th>
            <th>Temperature</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {totems.map((totem) => (
            <tr key={totem.id}>
              <td>{totem.id}</td>
              <td>
                <span className={`admin-status-badge ${totem.status === "online" ? "online" : "offline"}`}>
                  {totem.status}
                </span>
              </td>
              <td>{totem.serial}</td>
              <td>{totem.location || "N/A"}</td>
              <td>{totem.agency || "N/A"}</td>
              <td>{totem.version}</td>
              <td>
                <div className="admin-temp-display">
                  <IonIcon icon={thermometerOutline} />
                  <span>{totem.status === "online" ? `${totem.temperature}°C` : "N/A"}</span>
                </div>
              </td>
              <td>
                <div className="admin-action-buttons">
                  <button
                    className="admin-icon-button"
                    disabled={totem.status === "offline"}
                    title="Refresh"
                    onClick={() => handleRefresh(totem.id)}
                  >
                    <IonIcon icon={refreshOutline} />
                  </button>
                  <button
                    className="admin-icon-button"
                    disabled={totem.status === "offline"}
                    title="Power"
                    onClick={() => handleShutdown(totem)}
                  >
                    <IonIcon icon={powerOutline} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  // Render Remote Maintenance Tab
  const renderRemoteMaintenance = () => (
    <div className="admin-maintenance-container">
      <div className="admin-form-group">
        <label className="admin-form-label">Select Totem</label>
        <div className="admin-select-wrapper">
          <IonSelect
            placeholder="Choose a totem"
            className="admin-select"
            onIonChange={(e) => setSelectedMaintenanceTotem(e.detail.value)}
          >
            {totems.map((totem) => (
              <IonSelectOption key={totem.id} value={totem.id}>
                {totem.id}
              </IonSelectOption>
            ))}
          </IonSelect>
        </div>
      </div>

      <div className="admin-form-group">
        <label className="admin-form-label">Action</label>
        <div className="admin-select-wrapper">
          <IonSelect
            placeholder="Choose an action"
            className="admin-select"
            onIonChange={(e) => setSelectedMaintenanceAction(e.detail.value)}
          >
            <IonSelectOption value="update">Update Software</IonSelectOption>
            <IonSelectOption value="restart">Restart Totem</IonSelectOption>
            <IonSelectOption value="diagnose">Run Diagnostics</IonSelectOption>
          </IonSelect>
        </div>
      </div>

      <button className="admin-action-button" onClick={handleExecuteMaintenance}>
        <IonIcon icon={cloudUploadOutline} />
        <span>Execute Action</span>
      </button>

      {selectedMaintenanceAction === "update" && (
        <div className="admin-progress-card">
          <h3 className="admin-progress-title">Update Progress</h3>
          <div className="admin-progress-container">
            <IonProgressBar value={maintenanceProgress} className="admin-progress-bar"></IonProgressBar>
            <span className="admin-progress-value">{Math.round(maintenanceProgress * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )

  // Render Incident Log Tab (simplified for brevity)
  const renderIncidentLog = () => (
    <div className="admin-incidents-container">
      {[1, 2, 3].map((_, index) => (
        <div
          key={index}
          className="admin-incident-item"
          onClick={() => {
            setSelectedTotem(`TM00${index + 1}`)
            setIsModalOpen(true)
          }}
        >
          <div className="admin-incident-icon">
            <IonIcon icon={bugOutline} />
          </div>
          <div className="admin-incident-content">
            <h3 className="admin-incident-title">Incident #{1000 + index}</h3>
            <p className="admin-incident-details">
              Totem: TM00{index + 1} | Date: {new Date().toLocaleString()}
            </p>
            <p className="admin-incident-type">Type: {index % 2 === 0 ? "Hardware Failure" : "Software Error"}</p>
          </div>
          <div className={`admin-incident-badge ${index % 2 === 0 ? "warning" : "critical"}`}>
            {index % 2 === 0 ? "Open" : "Critical"}
          </div>
        </div>
      ))}
    </div>
  )

  // Render Approval Tab
  const renderApprovalTab = () => <KioskApprovalTab />

  return (
    <IonPage>
      <div className="admin-dashboard-layout">
        <SidebarAdmin currentPage="Totems" />
        <div className="admin-dashboard-content">
          <AdminPageHeader
            title="Gestion des Totems Interactifs"
            subtitle="Surveillez et gérez vos totems à distance"
          />
          <div className="admin-content-card">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "status" ? "active" : ""}`}
                onClick={() => setActiveTab("status")}
              >
                État des Appareils
              </button>
              <button
                className={`admin-tab ${activeTab === "maintenance" ? "active" : ""}`}
                onClick={() => setActiveTab("maintenance")}
              >
                Maintenance à Distance
              </button>
              <button
                className={`admin-tab ${activeTab === "incidents" ? "active" : ""}`}
                onClick={() => setActiveTab("incidents")}
              >
                Journal d'Incidents
              </button>
              <button
                className={`admin-tab ${activeTab === "approval" ? "active" : ""}`}
                onClick={() => setActiveTab("approval")}
              >
                <IonIcon icon={checkmarkCircleOutline} className="tab-icon" />
                Approbations
              </button>
            </div>
            <div className="admin-tab-content">
              {activeTab === "status" && renderDeviceStatus()}
              {activeTab === "maintenance" && renderRemoteMaintenance()}
              {activeTab === "incidents" && renderIncidentLog()}
              {activeTab === "approval" && renderApprovalTab()}
            </div>
          </div>
        </div>
      </div>

      {/* Incident Modal */}
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} className="admin-modal">
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Détails de l'Incident - {selectedTotem}</h2>
          <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>
            <IonIcon icon={closeCircleOutline} />
          </button>
        </div>
        <div className="admin-modal-content">
          <div className="admin-form-group">
            <label className="admin-form-label">Description de l'Incident</label>
            <IonTextarea rows={10} placeholder="Entrez les détails de l'incident ici..." className="admin-textarea" />
          </div>
          <button className="admin-action-button">Enregistrer le Rapport d'Incident</button>
        </div>
      </IonModal>

      {/* Diagnostic Modal */}
      <IonModal
        isOpen={isDiagnosticModalOpen}
        onDidDismiss={() => setIsDiagnosticModalOpen(false)}
        className="admin-modal"
      >
        <div className="admin-modal-header">
          <h2 className="admin-modal-title">Résultat du Diagnostic</h2>
          <button className="admin-modal-close" onClick={() => setIsDiagnosticModalOpen(false)}>
            <IonIcon icon={closeCircleOutline} />
          </button>
        </div>
        <div className="admin-modal-content">
          <pre>{diagnosticResult ? JSON.stringify(diagnosticResult, null, 2) : "No diagnostic data."}</pre>
          <IonButton expand="block" onClick={() => setIsDiagnosticModalOpen(false)}>
            Fermer
          </IonButton>
        </div>
      </IonModal>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header={"Notification"}
        message={alertMessage}
        buttons={["OK"]}
      />
    </IonPage>
  )
}

export default InteractiveTotemManagement
