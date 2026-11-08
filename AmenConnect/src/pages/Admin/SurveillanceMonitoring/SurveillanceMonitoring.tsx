"use client"

import type React from "react"
import { useState, useEffect, useRef, useMemo } from "react"
import {
  IonPage,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonRange,
  IonToggle,
  IonNote,
  IonSearchbar,
  IonChip,
  IonLabel,
  IonButton,
  IonSpinner,
} from "@ionic/react"
import {
  mapOutline,
  listOutline,
  notificationsOutline,
  searchOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
  warningOutline,
  locateOutline,
  refreshOutline,
  filterOutline,
  closeCircleOutline,
} from "ionicons/icons"
import "./SurveillanceMonitoring.css"
import "./leaflet-overrides.css"
import SidebarAdmin from "../../../components/SidebarAdmin"
import { useAdminAuth } from "../../../AdminAuthContext"
import AdminPageHeader from "../adminpageheader"
// Import Leaflet CSS and JS
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.markercluster/dist/leaflet.markercluster.js"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import InteractiveTotemManagement from "../GestiondesTotem/InteractiveTotemManagement"
// Define totem interface
interface Totem {
  id: string
  name: string
  lat: number
  lng: number
  status: "active" | "inactive" | "maintenance"
  lastTransaction?: string
  transactionCount: number
  lastMaintenance?: string
  address: string
  model: string
}

// Custom marker icons
const createTotemIcon = (status: string) => {
  return L.divIcon({
    className: `totem-marker totem-marker-${status}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `<div class="totem-marker-inner"></div>`,
  })
}

const SurveillanceMonitoring: React.FC = () => {
  const { authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<"monitoring" | "logs" | "alerts">("monitoring")
  const [startDate, setStartDate] = useState<string | null | undefined>(null)
  const [endDate, setEndDate] = useState<string | null | undefined>(null)
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersLayerRef = useRef<L.MarkerClusterGroup | null>(null)
  const [totems, setTotems] = useState<Totem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedTotem, setSelectedTotem] = useState<Totem | null>(null)
  const [statusFilter, setStatusFilter] = useState<("active" | "inactive" | "maintenance")[]>([
    "active",
    "inactive",
    "maintenance",
  ])
  const [selectedManagementTotem, setSelectedManagementTotem] = useState<string | null>(null);

  const [mapReady, setMapReady] = useState<boolean>(false)

  // Fetch totem data
// Fetch totem data
const fetchTotems = async () => {
  setLoading(true)
  try {
    const response = await fetch("/api/kiosk")
    if (!response.ok) throw new Error("Failed to fetch kiosks")
    const kiosks = await response.json()

    // Transform backend data to Totem interface
    const transformedTotems: Totem[] = kiosks.map((kiosk: any) => ({
      id: kiosk.tote || "N/A",
      name: kiosk.agencyName || "Unnamed Kiosk",
      lat: kiosk.latitude,
      lng: kiosk.longitude,
      status: kiosk.status === "online" 
        ? "active" 
        : kiosk.status === "offline" 
          ? "inactive" 
          : "maintenance",
      address: kiosk.location || "Unknown address",
      model: "Kiosk v" + kiosk.version,
      transactionCount: 0, // Replace with real data if available
      lastMaintenance: kiosk.last_heartbeat 
        ? new Date(kiosk.last_heartbeat * 1000).toISOString()
        : undefined,
    }))

    setTotems(transformedTotems)
  } catch (error) {
    console.error("Error fetching totem data:", error)
  } finally {
    setLoading(false)
  }
}

  // Filter totems based on search query and status filter
  const filteredTotems = useMemo(() => {
    return totems.filter((totem) => {
      const matchesSearch =
        searchQuery === "" ||
        totem.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        totem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        totem.address.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter.includes(totem.status)

      return matchesSearch && matchesStatus
    })
  }, [totems, searchQuery, statusFilter])

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Initialize map when component mounts
  useEffect(() => {
    fetchTotems()
  }, [])

  // Initialize and update map
  useEffect(() => {
    if (activeTab === "monitoring" && mapContainerRef.current && !mapRef.current) {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: [36.8065, 10.1815],
        zoom: 13,
        layers: [
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }),
        ],
      })

      // Add scale control
      L.control.scale().addTo(map)

      // Create marker cluster group
      const markersLayer = L.markerClusterGroup({
        disableClusteringAtZoom: 16,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        maxClusterRadius: 50,
      })

      markersLayerRef.current = markersLayer
      map.addLayer(markersLayer)

      mapRef.current = map
      setMapReady(true)

      // Resize map when container becomes visible
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
    }

    // Cleanup function
    return () => {
      if (mapRef.current && activeTab !== "monitoring") {
        mapRef.current.remove()
        mapRef.current = null
        markersLayerRef.current = null
        setMapReady(false)
      }
    }
  }, [activeTab])

  // Update markers when filtered totems change
  useEffect(() => {
    if (mapReady && mapRef.current && markersLayerRef.current) {
      // Clear existing markers
      markersLayerRef.current.clearLayers()

      // Add markers for filtered totems
      filteredTotems.forEach((totem) => {
        const icon = createTotemIcon(totem.status)
        const marker = L.marker([totem.lat, totem.lng], { icon }).addTo(markersLayerRef.current!)

        // Create popup content
        const popupContent = `
          <div class="totem-popup">
            <h3>${totem.name}</h3>
            <div class="totem-popup-id">ID: ${totem.id}</div>
            <div class="totem-popup-status">
              <span class="status-indicator status-${totem.status}"></span>
              Status: ${totem.status.charAt(0).toUpperCase() + totem.status.slice(1)}
            </div>
            <div class="totem-popup-address">${totem.address}</div>
            <button class="totem-popup-details-btn" data-totem-id="${totem.id}">Voir détails</button>
          </div>
        `

        const popup = L.popup().setContent(popupContent)
        marker.bindPopup(popup)

        // Handle popup open event to attach click handler to the details button
        marker.on("popupopen", () => {
          setTimeout(() => {
            const detailsBtn = document.querySelector(`.totem-popup-details-btn[data-totem-id="${totem.id}"]`);
            if (detailsBtn) {
              detailsBtn.addEventListener("click", () => {
                setSelectedManagementTotem(totem.id);
                setActiveTab("monitoring");
              });
            }
          }, 0);
        });
      })

      // If there are filtered totems and no totem is selected, fit bounds
      if (filteredTotems.length > 0 && !selectedTotem) {
        const bounds = L.latLngBounds(filteredTotems.map((totem) => [totem.lat, totem.lng]))
        mapRef.current.fitBounds(bounds, { padding: [50, 50] })
      }

      // If a totem is selected, center on it
      if (selectedTotem) {
        mapRef.current.setView([selectedTotem.lat, selectedTotem.lng], 16)

        // Find and open the popup for the selected totem
        markersLayerRef.current.getLayers().forEach((layer: any) => {
          const markerLatLng = layer.getLatLng()
          if (markerLatLng.lat === selectedTotem.lat && markerLatLng.lng === selectedTotem.lng) {
            layer.openPopup()
          }
        })
      }
    }
  }, [filteredTotems, mapReady, selectedTotem])

  // Handle tab changes
  useEffect(() => {
    // Resize map when switching to monitoring tab
    if (activeTab === "monitoring" && mapRef.current) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize()
        }
      }, 100)
    }
  }, [activeTab])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Toggle status filter
  const toggleStatusFilter = (status: "active" | "inactive" | "maintenance") => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status)
      } else {
        return [...prev, status]
      }
    })
  }
  const renderManagement = () => (
    <div className="admin-management-container">
      {selectedManagementTotem ? (
        <InteractiveTotemManagement 
          
        />
      ) : (
        <div className="no-totem-selected">
        </div>
      )}
    </div>
  );
  // Reset filters
  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter(["active", "inactive", "maintenance"])
    setSelectedTotem(null)
  }

  // Center map on user location
  const centerOnUserLocation = () => {
    if (mapRef.current) {
      mapRef.current.locate({ setView: true, maxZoom: 16 })
    }
  }

  // Refresh totem data
  const refreshData = () => {
    fetchTotems()
  }

  if (authLoading) {
    return <div className="admin-loading">Loading...</div>
  }

  const renderMonitoring = () => (
    <div className="admin-monitoring-container">
      <div className="admin-map-controls">
        <div className="admin-map-search">
          <IonSearchbar
            value={searchQuery}
            onIonChange={(e) => setSearchQuery(e.detail.value || "")}
            placeholder="Rechercher un totem..."
            className="admin-searchbar"
          />
        </div>

        <div className="admin-map-filters">
          <div className="admin-filter-chips">
            <IonChip
              color={statusFilter.includes("active") ? "success" : "medium"}
              outline={!statusFilter.includes("active")}
              onClick={() => toggleStatusFilter("active")}
            >
              <div className="status-dot status-active"></div>
              <IonLabel>Actifs</IonLabel>
            </IonChip>

            <IonChip
              color={statusFilter.includes("inactive") ? "danger" : "medium"}
              outline={!statusFilter.includes("inactive")}
              onClick={() => toggleStatusFilter("inactive")}
            >
              <div className="status-dot status-inactive"></div>
              <IonLabel>Inactifs</IonLabel>
            </IonChip>

            <IonChip
              color={statusFilter.includes("maintenance") ? "warning" : "medium"}
              outline={!statusFilter.includes("maintenance")}
              onClick={() => toggleStatusFilter("maintenance")}
            >
              <div className="status-dot status-maintenance"></div>
              <IonLabel>En maintenance</IonLabel>
            </IonChip>
          </div>

          <div className="admin-map-actions">
            <IonButton fill="clear" onClick={resetFilters}>
              <IonIcon slot="icon-only" icon={filterOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={centerOnUserLocation}>
              <IonIcon slot="icon-only" icon={locateOutline} />
            </IonButton>
            <IonButton fill="clear" onClick={refreshData}>
              <IonIcon slot="icon-only" icon={refreshOutline} />
            </IonButton>
          </div>
        </div>
      </div>

      <div className="admin-map-container" ref={mapContainerRef}>
        {loading && (
          <div className="admin-map-loading">
            <IonSpinner name="crescent" />
            <span>Chargement de la carte...</span>
          </div>
        )}
      </div>

      {selectedTotem && (
        <div className="admin-totem-details">
          <div className="admin-totem-details-header">
            <h3>{selectedTotem.name}</h3>
            <IonButton fill="clear" onClick={() => setSelectedTotem(null)}>
              <IonIcon slot="icon-only" icon={closeCircleOutline} />
            </IonButton>
          </div>

          <div className="admin-totem-details-content">
            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">ID:</span>
              <span className="admin-totem-details-value">{selectedTotem.id}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Status:</span>
              <span className={`admin-totem-details-value status-text-${selectedTotem.status}`}>
                {selectedTotem.status === "active"
                  ? "Actif"
                  : selectedTotem.status === "inactive"
                    ? "Inactif"
                    : "En maintenance"}
              </span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Adresse:</span>
              <span className="admin-totem-details-value">{selectedTotem.address}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Modèle:</span>
              <span className="admin-totem-details-value">{selectedTotem.model}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Dernière transaction:</span>
              <span className="admin-totem-details-value">{formatDate(selectedTotem.lastTransaction)}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Nombre de transactions:</span>
              <span className="admin-totem-details-value">{selectedTotem.transactionCount.toLocaleString()}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Dernière maintenance:</span>
              <span className="admin-totem-details-value">{formatDate(selectedTotem.lastMaintenance)}</span>
            </div>

            <div className="admin-totem-details-row">
              <span className="admin-totem-details-label">Coordonnées:</span>
              <span className="admin-totem-details-value">
                {selectedTotem.lat.toFixed(6)}, {selectedTotem.lng.toFixed(6)}
              </span>
            </div>
          </div>

          <div className="admin-totem-details-actions">
            <IonButton expand="block" color="primary">
              Voir l'historique des transactions
            </IonButton>
            <IonButton expand="block" color={selectedTotem.status === "maintenance" ? "success" : "warning"}>
              {selectedTotem.status === "maintenance" ? "Terminer la maintenance" : "Planifier une maintenance"}
            </IonButton>
          </div>
        </div>
      )}

<div className="admin-section-title">
  <h3>État des Totems</h3>
</div>

<div className="admin-transactions-list">
  {totems.map((totem, index) => (
    <div key={totem.id} className="admin-transaction-item">
      <div className="admin-transaction-avatar">
        <img 
          src={`https://picsum.photos/seed/${totem.address}/100/100`} 
          alt="Location" 
          className="location-thumbnail"
        />
      </div>
      <div className="admin-transaction-content">
        <div className="admin-transaction-title">{totem.name}</div>
        <div className="admin-transaction-details">
          <div>ID: {totem.id}</div>
          <div>Localisation: {totem.address}</div>
        </div>
      </div>
      <div className={`admin-transaction-status ${totem.status}`}>
        {totem.status === "active" && "Actif"}
        {totem.status === "inactive" && "Inactif"}
        {totem.status === "maintenance" && "En maintenance"}
      </div>
    </div>
  ))}
</div>
    </div>
  )

  const renderLogs = () => (
    <div className="admin-logs-container">
      <div className="admin-filters">
        <div className="admin-filter-grid">
          <div className="admin-form-group">
            <label className="admin-form-label">Date de début</label>
            <div className="admin-input-wrapper">
              <IonDatetime
                presentation="date"
                value={startDate}
                onIonChange={(e) => setStartDate(e.detail.value?.toString())}
                className="admin-datetime"
              ></IonDatetime>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Date de fin</label>
            <div className="admin-input-wrapper">
              <IonDatetime
                presentation="date"
                value={endDate}
                onIonChange={(e) => setEndDate(e.detail.value?.toString())}
                className="admin-datetime"
              ></IonDatetime>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Utilisateur</label>
            <div className="admin-input-wrapper">
              <IonInput placeholder="Nom d'utilisateur" className="admin-input"></IonInput>
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Type d'événement</label>
            <div className="admin-select-wrapper">
              <IonSelect interface="popover" className="admin-select">
                <IonSelectOption value="all">Tous</IonSelectOption>
                <IonSelectOption value="login">Connexion</IonSelectOption>
                <IonSelectOption value="transaction">Transaction</IonSelectOption>
                <IonSelectOption value="error">Erreur</IonSelectOption>
              </IonSelect>
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="admin-button primary">
            <IonIcon icon={searchOutline} />
            <span>Rechercher</span>
          </button>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Statut</th>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="admin-log-status">
                    <IonIcon
                      icon={index % 2 === 0 ? checkmarkCircleOutline : alertCircleOutline}
                      color={index % 2 === 0 ? "success" : "warning"}
                      className="admin-log-icon"
                    />
                  </div>
                </td>
                <td>Action Critique #{index + 1}</td>
                <td>John Doe</td>
                <td>
                  <span className={`admin-status-badge ${index % 2 === 0 ? "actif" : "inactif"}`}>
                    {index % 2 === 0 ? "Connexion" : "Erreur"}
                  </span>
                </td>
                <td>01/06/2023 14:30</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderAlerts = () => (
    <div className="admin-form-container">
      <div className="admin-alerts-list">
        <div className="admin-alert-group">
          <div className="admin-security-item">
            <div className="admin-security-label">
              <IonIcon icon={warningOutline} className="admin-alert-icon warning" />
              <span>Tentatives de connexion élevées</span>
            </div>
            <IonToggle className="admin-toggle" />
          </div>

          <div className="admin-form-group range-group">
            <label className="admin-form-label">Seuil de tentatives (par heure)</label>
            <div className="admin-range-wrapper">
              <IonRange min={1} max={100} pin className="admin-range">
                <IonNote slot="start">1</IonNote>
                <IonNote slot="end">100</IonNote>
              </IonRange>
            </div>
          </div>
        </div>

        <div className="admin-alert-group">
          <div className="admin-security-item">
            <div className="admin-security-label">
              <IonIcon icon={warningOutline} className="admin-alert-icon warning" />
              <span>Transactions suspectes</span>
            </div>
            <IonToggle className="admin-toggle" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Montant suspect (€)</label>
            <div className="admin-input-wrapper">
              <IonInput type="number" placeholder="1000" className="admin-input"></IonInput>
            </div>
          </div>
        </div>

        <div className="admin-alert-group">
          <div className="admin-security-item">
            <div className="admin-security-label">
              <IonIcon icon={warningOutline} className="admin-alert-icon warning" />
              <span>Alerte de maintenance totem</span>
            </div>
            <IonToggle className="admin-toggle" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Durée hors-ligne avant alerte (minutes)</label>
            <div className="admin-input-wrapper">
              <IonInput type="number" placeholder="30" className="admin-input"></IonInput>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-form-actions">
        <button type="button" className="admin-button primary">
          <span>Enregistrer les paramètres</span>
        </button>
      </div>
    </div>
  )

  return (
    <IonPage>
      <div className="admin-dashboard-layout">
        {/* Sidebar Component */}
        <SidebarAdmin currentPage="Surveillance" />

        {/* Main Content */}
        <div className="admin-dashboard-content">
          {/* Header */}
          <AdminPageHeader
            title="Surveillance et Monitoring"
            subtitle="Suivez les activités et configurez les alertes du système"
          />

          {/* Main Card */}
          <div className="admin-content-card">
            {/* Tabs */}
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "monitoring" ? "active" : ""}`}
                onClick={() => setActiveTab("monitoring")}
              >
                <IonIcon icon={mapOutline} />
                <span>Monitoring</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "logs" ? "active" : ""}`}
                onClick={() => setActiveTab("logs")}
              >
                <IonIcon icon={listOutline} />
                <span>Journaux</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "alerts" ? "active" : ""}`}
                onClick={() => setActiveTab("alerts")}
              >
                <IonIcon icon={notificationsOutline} />
                <span>Alertes</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="admin-tab-content">
  {activeTab === "monitoring" && renderMonitoring()}
  {activeTab === "logs" && renderLogs()}
  {activeTab === "alerts" && renderAlerts()}
  {activeTab === "monitoring" && renderManagement()}
</div>
          </div>
        </div>
      </div>
    </IonPage>
  )
}

export default SurveillanceMonitoring
