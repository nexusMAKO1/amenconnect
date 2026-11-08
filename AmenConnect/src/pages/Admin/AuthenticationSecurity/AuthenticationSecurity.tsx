"use client"

import React, { useState, useEffect } from "react"
import { IonPage, IonIcon, IonInput, IonToggle, IonRange } from "@ionic/react"
import {
  lockClosedOutline,
  timerOutline,
  shieldOutline,
  saveOutline,
  logOutOutline,
} from "ionicons/icons"
import "./AuthenticationSecurity.css"
import SidebarAdmin from "../../../components/SidebarAdmin"
import { useAdminAuth } from "../../../AdminAuthContext"
import AdminPageHeader from "../adminpageheader"
import LoadingScreen from "../../../components/loading-screen"
const AuthenticationSecurity: React.FC = () => {
  const { authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<"2fa" | "sessions" | "policies">("2fa")
  const [sessions, setSessions] = useState<any[]>([])
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(15) // default timeout in minutes

  // 2FA state values initialized with defaults; these will be updated from the database
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false)

  // Fetch 2FA configuration when the 2fa tab is active
  useEffect(() => {
    if (activeTab === "2fa") {
       fetch("/api/2fa", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          // Set toggle states based on the database configuration
          setIs2FAEnabled(data.is2FAEnabled)
          setSmsEnabled(data.smsEnabled)
          setEmailEnabled(data.emailEnabled)
          setGoogleAuthEnabled(data.googleAuthEnabled)
        })
        .catch((error) => console.error("Error fetching 2FA settings:", error))
    }
  }, [activeTab])

  // Fetch sessions when the "sessions" tab is active
  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions()
    }
  }, [activeTab])

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      } else {
        console.error("Failed to fetch sessions.")
      }
    } catch (error) {
      console.error("Error fetching sessions:", error)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    if (window.confirm("Are you sure you want to terminate this session?")) {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: "DELETE",
          credentials: "include",
        })
        const data = await response.json()
        if (response.ok) {
          alert(data.message || "Session terminated successfully.")
          // Remove terminated session from state
          setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
        } else {
          alert("Error: " + data.message)
        }
      } catch (error) {
        console.error("Error terminating session:", error)
        alert("An error occurred while terminating the session.")
      }
    }
  }

  const handleTimeoutChange = (value: number) => {
    setInactivityTimeout(value)
    // Optionally, send this value to the server to update the inactivity timeout configuration.
  }

  const handleSave2FASettings = async () => {
    const payload = { is2FAEnabled, smsEnabled, emailEnabled, googleAuthEnabled }
    try {
      const response = await fetch("/api/2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (response.ok) {
        alert(data.message || "Settings saved successfully")
      } else {
        alert("Error: " + data.message)
      }
    } catch (error) {
      console.error("Error saving 2FA settings:", error)
      alert("An error occurred while saving settings.")
    }
  }

  if (authLoading) {
    return <LoadingScreen />
  }

  const render2FAConfig = () => (
    <div className="admin-form-container">
      <div className="admin-security-list">
        <div className="admin-security-item">
          <div className="admin-security-label">Enable 2FA</div>
          <IonToggle
            className="admin-toggle"
            checked={is2FAEnabled}
            onIonChange={(e) => setIs2FAEnabled(e.detail.checked)}
          />
        </div>
        <div className="admin-security-item">
          <div className="admin-security-label">SMS Authentication</div>
          <IonToggle
            className="admin-toggle"
            checked={smsEnabled}
            onIonChange={(e) => setSmsEnabled(e.detail.checked)}
          />
        </div>
        <div className="admin-security-item">
          <div className="admin-security-label">Email Authentication</div>
          <IonToggle
            className="admin-toggle"
            checked={emailEnabled}
            onIonChange={(e) => setEmailEnabled(e.detail.checked)}
          />
        </div>
        <div className="admin-security-item">
          <div className="admin-security-label">Google Authenticator</div>
          <IonToggle
            className="admin-toggle"
            checked={googleAuthEnabled}
            onIonChange={(e) => setGoogleAuthEnabled(e.detail.checked)}
          />
        </div>
      </div>
      <div className="admin-form-actions">
        <button type="button" className="admin-button primary" onClick={handleSave2FASettings}>
          <IonIcon icon={saveOutline} />
          <span>Save 2FA Settings</span>
        </button>
      </div>
    </div>
  )

  const renderSessionManagement = () => (
    <div className="admin-form-container">
      <div className="admin-security-list">
        <div className="admin-security-item range-item">
          <div className="admin-security-label">Inactivity Timeout (minutes)</div>
          <div className="admin-range-wrapper">
            <IonRange
              min={5}
              max={60}
              step={5}
              snaps={true}
              pin={true}
              value={inactivityTimeout}
              onIonChange={(e) => handleTimeoutChange(Number(e.detail.value))}
              className="admin-range"
            />
          </div>
        </div>
      </div>
      <div className="admin-section-title">
        <h3>Active Sessions</h3>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Session</th>
              <th>Device</th>
              <th>IP Address</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0 ? (
              sessions.map((session, index) => (
                <tr key={session.sessionId || index}>
                  <td>{session.sessionId}</td>
                  <td>{session.device || "Unknown"}</td>
                  <td>{session.ipAddress || "N/A"}</td>
                  <td>{new Date(session.lastActive).toLocaleString()}</td>
                  <td>
                    <div className="admin-action-buttons">
                      <button
                        className="admin-icon-button delete"
                        title="Terminate Session"
                        onClick={() => handleTerminateSession(session.sessionId)}
                      >
                        <IonIcon icon={logOutOutline} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No active sessions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderSecurityPolicies = () => (
    <div className="admin-form-container">
      <form className="admin-security-form">
        <div className="admin-form-group">
          <label className="admin-form-label">Minimum Password Length</label>
          <div className="admin-input-wrapper">
            <IonInput type="number" min={8} max={32} value={12} className="admin-input" />
          </div>
        </div>
        <div className="admin-security-list">
          <div className="admin-security-item">
            <div className="admin-security-label">Require Uppercase</div>
            <IonToggle className="admin-toggle" />
          </div>
          <div className="admin-security-item">
            <div className="admin-security-label">Require Numbers</div>
            <IonToggle className="admin-toggle" />
          </div>
          <div className="admin-security-item">
            <div className="admin-security-label">Require Special Characters</div>
            <IonToggle className="admin-toggle" />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Max Failed Attempts</label>
          <div className="admin-input-wrapper">
            <IonInput type="number" min={3} max={10} value={5} className="admin-input" />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Lockout Duration (minutes)</label>
          <div className="admin-input-wrapper">
            <IonInput type="number" min={5} max={60} value={30} className="admin-input" />
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="admin-button primary">
            <IonIcon icon={saveOutline} />
            <span>Save Security Policies</span>
          </button>
        </div>
      </form>
    </div>
  )

  return (
    <IonPage>
      <div className="admin-dashboard-layout">
        <SidebarAdmin currentPage="Sécurité" />
        <div className="admin-dashboard-content">
          <AdminPageHeader
            title="Authentication & Security"
            subtitle="Manage authentication methods and security policies"
          />
          <div className="admin-content-card">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "2fa" ? "active" : ""}`}
                onClick={() => setActiveTab("2fa")}
              >
                <IonIcon icon={lockClosedOutline} />
                <span>2FA Configuration</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "sessions" ? "active" : ""}`}
                onClick={() => setActiveTab("sessions")}
              >
                <IonIcon icon={timerOutline} />
                <span>Session Management</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "policies" ? "active" : ""}`}
                onClick={() => setActiveTab("policies")}
              >
                <IonIcon icon={shieldOutline} />
                <span>Security Policies</span>
              </button>
            </div>
            <div className="admin-tab-content">
              {activeTab === "2fa" && render2FAConfig()}
              {activeTab === "sessions" && renderSessionManagement()}
              {activeTab === "policies" && renderSecurityPolicies()}
            </div>
          </div>
        </div>
      </div>
    </IonPage>
  )
}

export default AuthenticationSecurity
