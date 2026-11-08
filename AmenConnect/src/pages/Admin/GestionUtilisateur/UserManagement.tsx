"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  IonPage,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  useIonToast,
} from "@ionic/react"
import {
  peopleOutline,
  personAddOutline,
  keyOutline,
  createOutline,
  trashOutline,
  searchOutline,
  filterOutline,
  refreshOutline,
  eyeOutline,
  eyeOffOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  calendarOutline,
  callOutline,
  mailOutline,
  homeOutline,
  personOutline,
} from "ionicons/icons"
import axios from "axios"
import "./UserManagement.css"
import SidebarAdmin from "../../../components/SidebarAdmin"
import { useAdminAuth } from "../../../AdminAuthContext"
import AdminPageHeader from "../adminpageheader"

// Import the DocumentPreview component at the top of the file
import DocumentPreview from "./document-preview";

interface AccountRequest {
  _id: string
  nom?: string
  prenom?: string
  email?: string
  numeroGSM?: string
  adresseDomicile?: string
  dateNaissance?: string
  activite?: string
  montantRevenusMensuels?: number
  situationFamille?: string
  pieceIdentite?: string
  numeroCIN?: string
  justificatifDomicile?: string
  justificatifRevenu?: string
  status?: string
  createdAt?: string
  notes?: string
  // Add these new properties
  cinRecto?: string
  cinVerso?: string
  specimenSignature?: string
  ficheProfilClient?: string
  selfiAvecCIN?: string
}

const UserManagement: React.FC = () => {
  const { authLoading } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<"list" | "create" | "reset" | "requests">("list")
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // State for the admins list fetched from API
  const [admins, setAdmins] = useState<any[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)

  // State for account creation requests
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [requestStatusFilter, setRequestStatusFilter] = useState("all")
  const [requestSearchQuery, setRequestSearchQuery] = useState("")
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  // Form state for creating/editing an admin
  interface AdminFormData {
    name: string;
    cin: string;
    email: string;
    password?: string; // mark as optional
    role: string;
    department: string;
    permissions: string[];
  }
  const [formData, setFormData] = useState({
    name: "",
    cin: "",
    email: "",
    password: "",
    role: "admin",
    department: "General",
    permissions: [] as string[],
  })
  const [showPassword, setShowPassword] = useState(false)

  // New state for password reset (forgot password)
  const [resetEmail, setResetEmail] = useState<string>("")
  const [resetErrorMessage, setResetErrorMessage] = useState<string>("")
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string>("")
  const [resetIsLoading, setResetIsLoading] = useState<boolean>(false)

  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch admins from API on component mount
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const response = await fetch("/api/admin/list") // New API endpoint
        const data = await response.json()
        setAdmins(data.admins || [])
      } catch (error) {
        console.error("Error fetching admins:", error)
      } finally {
        setLoadingAdmins(false)
      }
    }
    fetchAdmins()
  }, [])

  // Fetch account creation requests
  useEffect(() => {
    const fetchAccountRequests = async () => {
      if (activeTab === "requests") {
        setLoadingRequests(true)
        try {
          const response = await fetch("/api/account-creation")
          const data = await response.json()
          setAccountRequests(data.demandes || [])
        } catch (error) {
          console.error("Error fetching account requests:", error)
        } finally {
          setLoadingRequests(false)
        }
      }
    }
    fetchAccountRequests()
  }, [activeTab])

  // Generate random password
  const generatePassword = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let password = ""
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, password })
  }

  // Toggle password visibility
  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowPassword(!showPassword)
  }

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  let payload = { ...formData };
  
  // Remove password from payload if it's empty
  if (!payload.password.trim()) {
    delete (payload as { password?: string }).password;
  }
  
  

  if (isEditing && selectedAdmin) {
    try {
      const response = await fetch(`/api/admin/${selectedAdmin._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Admin updated successfully!");
        setActiveTab("list");
        const refreshed = await fetch("/api/admin/list");
        const refreshedData = await refreshed.json();
        setAdmins(refreshedData.admins || []);
        setIsEditing(false);
        setSelectedAdmin(null);
        setFormData({
          name: "",
          cin: "",
          email: "",
          password: "",
          role: "admin",
          department: "General",
          permissions: [],
        });
      } else {
        alert("Error: " + data.message);
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("An error occurred while updating the admin.");
    }
  } else {
      // Existing registration logic (creating a new admin)
      try {
        const response = await fetch("/api/admin/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
        const data = await response.json();
        if (response.ok) {
          alert("Admin created successfully!");
          setActiveTab("list");
          const refreshed = await fetch("/api/admin/list");
          const refreshedData = await refreshed.json();
          setAdmins(refreshedData.admins || []);
        } else {
          alert("Error: " + data.message);
        }
      } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred while creating the admin.");
      }
    }
  };
  

  const handleDelete = async (adminId: string) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      try {
        const response = await fetch(`/api/admin/list/${adminId}`, {
          method: "DELETE",
          credentials: "include", // Include cookies for auth
        })
        const data = await response.json()
        if (response.ok) {
          alert("Admin deleted successfully")
          // Remove the deleted admin from your state
          setAdmins((prev) => prev.filter((admin) => admin._id !== adminId))
        } else {
          alert("Error: " + data.message)
        }
      } catch (error) {
        console.error("Error deleting admin:", error)
        alert("An error occurred while deleting the admin.")
      }
    }
  }

  const handleCinChange = (e: CustomEvent) => {
    const value = e.detail.value || ""
    const numbersOnly = value.replace(/\D/g, "")
    setFormData({ ...formData, cin: numbersOnly })
  }

  const handleCinKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Backspace" ||
      e.key === "Delete" ||
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Enter" ||
      (e.ctrlKey && (e.key === "a" || e.key === "c" || e.key === "v" || e.key === "x")) ||
      e.key === "Home" ||
      e.key === "End" ||
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      /^[0-9]$/.test(e.key)
    ) {
      if (/^[0-9]$/.test(e.key) && formData.cin.length >= 8) {
        e.preventDefault()
      } else {
        return
      }
    } else {
      e.preventDefault()
    }
  }

  // Function to validate email using a simple regex
  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  // Handler for password reset based on email
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetErrorMessage("")
    setResetSuccessMessage("")
    setResetIsLoading(true)

    if (!resetEmail.trim() || !validateEmail(resetEmail)) {
      setResetErrorMessage("Veuillez saisir une adresse email valide.")
      setResetIsLoading(false)
      return
    }

    try {
      const response = await axios.post("/api/password/forgot-password", { email: resetEmail })
      setResetSuccessMessage(response.data.message || "Un e-mail de réinitialisation a été envoyé à cette adresse.")
    } catch (error: any) {
      setResetErrorMessage(error.response?.data?.message || "Erreur inattendue lors de la réinitialisation.")
    } finally {
      setResetIsLoading(false)
    }
  }

  // Handle account request approval
// Function to handle account request approval
const handleApproveRequest = async (requestId: string) => {
  if (window.confirm("Êtes-vous sûr de vouloir approuver cette demande?")) {
    try {
      const response = await fetch(`/api/account-creation/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        alert("Demande approuvée avec succès");
        // Update the status in the local state
        setAccountRequests((prev) =>
          prev.map((req) => (req._id === requestId ? { ...req, status: "approved" } : req)),
        );
      } else {
        const data = await response.json();
        alert("Erreur: " + (data.message || "Une erreur est survenue"));
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("Une erreur est survenue lors de l'approbation de la demande");
    }
  }
};


      

  // Handle account request rejection
  const handleRejectRequest = async (requestId: string) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
      try {
        const response = await fetch(`/api/account-creation/${requestId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          alert("Demande rejetée avec succès");
          // Update the status in the local state
          setAccountRequests((prev) =>
            prev.map((req) => (req._id === requestId ? { ...req, status:
              "rejected" } : req)),
          );
          } else {
            const data = await response.json();
            alert("Erreur: " + (data.message || "Une erreur est survenue"));
          }
        } catch (error) {
          console.error("Error rejecting request:", error);
          alert("Une erreur est survenue lors du rejet de la demande");
        }
    }
  }

  const handleViewRequestDetails = (request: AccountRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  if (authLoading) {
    return <div className="admin-loading">Loading...</div>
  }

  // Apply filters on the fetched admins list
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch =
      searchQuery === "" ||
      admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || admin.role.toLowerCase() === roleFilter.toLowerCase()
    const matchesStatus =
      statusFilter === "all" || (admin.status && admin.status.toLowerCase() === statusFilter.toLowerCase())
    return matchesSearch && matchesRole && matchesStatus
  })

  // Apply filters on account requests
  const filteredRequests = accountRequests.filter((request) => {
    const fullName = `${request.prenom || ""} ${request.nom || ""}`.toLowerCase()
    const matchesSearch =
      requestSearchQuery === "" ||
      fullName.includes(requestSearchQuery.toLowerCase()) ||
      (request.email && request.email.toLowerCase().includes(requestSearchQuery.toLowerCase()))
    const matchesStatus =
      requestStatusFilter === "all" ||
      (request.status && request.status.toLowerCase() === requestStatusFilter.toLowerCase())
    return matchesSearch && matchesStatus
  })

  const renderUserList = () => (
    <div className="admin-user-list">
      <div className="admin-filters">
        <div className="admin-search-container">
          <IonIcon icon={searchOutline} className="admin-search-icon" />
          <IonSearchbar
            className="admin-searchbar"
            placeholder="Rechercher un Admin"
            value={searchQuery}
            onIonChange={(e) => setSearchQuery(e.detail.value || "")}
          ></IonSearchbar>
        </div>

        <div className="admin-filter-chips">
          <div className="admin-filter-chip">
            <div className="admin-filter-label">
              <IonIcon icon={filterOutline} />
              <span>Rôle:</span>
            </div>
            <IonSelect
              interface="popover"
              className="admin-select-filter"
              value={roleFilter}
              onIonChange={(e) => setRoleFilter(e.detail.value)}
            >
              <IonSelectOption value="all">Tous</IonSelectOption>
              <IonSelectOption value="client">Client</IonSelectOption>
              <IonSelectOption value="employé">Employé</IonSelectOption>
              <IonSelectOption value="admin">Admin</IonSelectOption>
            </IonSelect>
          </div>

          <div className="admin-filter-chip">
            <div className="admin-filter-label">
              <IonIcon icon={filterOutline} />
              <span>Statut:</span>
            </div>
            <IonSelect
              interface="popover"
              className="admin-select-filter"
              value={statusFilter}
              onIonChange={(e) => setStatusFilter(e.detail.value)}
            >
              <IonSelectOption value="all">Tous</IonSelectOption>
              <IonSelectOption value="actif">Actif</IonSelectOption>
              <IonSelectOption value="inactif">Inactif</IonSelectOption>
            </IonSelect>
          </div>
        </div>
      </div>

      {loadingAdmins ? (
        <div className="admin-loading">Chargement des admins...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <tr key={admin._id}>
                    <td>{admin.name}</td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`admin-role-badge ${admin.role.toLowerCase()}`}>{admin.role}</span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${admin.status?.toLowerCase() || "actif"}`}>
                        {admin.status || "Actif"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                      <button
  className="admin-icon-button edit"
  onClick={() => {
    setIsEditing(true);
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name,
      cin: admin.cin,
      email: admin.email,
      // For security, you might leave the password field blank or handle it separately.
      password: "",
      role: admin.role,
      department: admin.department,
      permissions: admin.permissions || [],
    });
    setActiveTab("create"); // You can continue to use the same form tab for editing
  }}
  title="Modifier"
>
  <IonIcon icon={createOutline} />
</button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="admin-no-results">
                    Aucun administrateur trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderUserForm = () => (
    <div className="admin-form-container">
      <form className="admin-user-form" onSubmit={handleSubmit}>
        {/* ... your existing form fields remain unchanged ... */}
        <div className="admin-form-group">
          <label className="admin-form-label">Nom</label>
          <div className="admin-input-wrapper">
            <IonInput
              type="text"
              required
              className="admin-input"
              placeholder="Nom complet"
              value={formData.name}
              onIonChange={(e) => setFormData({ ...formData, name: e.detail.value || "" })}
            ></IonInput>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">CIN</label>
          <div className="admin-input-wrapper">
            <IonInput
              type="tel"
              required
              className="admin-input"
              placeholder="12345678"
              maxlength={8}
              value={formData.cin}
              onIonChange={handleCinChange}
              onKeyDown={handleCinKeyDown}
              pattern="[0-9]*"
              inputmode="numeric"
            ></IonInput>
            <small className="admin-input-hint">Le CIN doit contenir exactement 8 chiffres</small>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Email</label>
          <div className="admin-input-wrapper">
            <IonInput
              type="email"
              required
              className="admin-input"
              placeholder="admin@example.com"
              value={formData.email}
              onIonChange={(e) => setFormData({ ...formData, email: e.detail.value || "" })}
            ></IonInput>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Mot de passe</label>
          <div className="admin-input-wrapper password-input-wrapper">
            <IonInput
              type={showPassword ? "text" : "password"}
              required
              className="admin-input password-input"
              value={formData.password}
            ></IonInput>
            <div className="password-actions">
              <button
                type="button"
                className="password-action-button generate"
                onClick={generatePassword}
                title="Générer un mot de passe"
              >
                <IonIcon icon={refreshOutline} />
              </button>
              <button
                type="button"
                className="password-action-button toggle"
                onClick={togglePasswordVisibility}
                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                <IonIcon icon={showPassword ? eyeOffOutline : eyeOutline} />
              </button>
            </div>
          </div>
          <small className="admin-input-hint">Cliquez sur l'icône pour générer un mot de passe aléatoire</small>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Rôle</label>
          <div className="admin-select-wrapper">
            <IonSelect
              interface="popover"
              className="admin-select"
              value={formData.role}
              onIonChange={(e) => setFormData({ ...formData, role: e.detail.value })}
            >
              <IonSelectOption value="admin">Admin</IonSelectOption>
              <IonSelectOption value="superadmin">Super Admin</IonSelectOption>
              <IonSelectOption value="manager">Manager</IonSelectOption>
            </IonSelect>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Département</label>
          <div className="admin-input-wrapper">
            <IonInput
              type="text"
              className="admin-input"
              placeholder="General"
              value={formData.department}
              onIonChange={(e) => setFormData({ ...formData, department: e.detail.value || "General" })}
            ></IonInput>
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">Permissions</label>
          <div className="admin-permissions-container">
            <div className="admin-permission-checkbox">
              <input
                type="checkbox"
                id="perm-users"
                checked={formData.permissions.includes("users")}
                onChange={(e) => {
                  const newPermissions = e.target.checked
                    ? [...formData.permissions, "users"]
                    : formData.permissions.filter((p) => p !== "users")
                  setFormData({ ...formData, permissions: newPermissions })
                }}
              />
              <label htmlFor="perm-users">Gestion des Administrateurs</label>
            </div>
            <div className="admin-permission-checkbox">
              <input
                type="checkbox"
                id="perm-content"
                checked={formData.permissions.includes("content")}
                onChange={(e) => {
                  const newPermissions = e.target.checked
                    ? [...formData.permissions, "content"]
                    : formData.permissions.filter((p) => p !== "content")
                  setFormData({ ...formData, permissions: newPermissions })
                }}
              />
              <label htmlFor="perm-content">Gestion du contenu</label>
            </div>
            <div className="admin-permission-checkbox">
              <input
                type="checkbox"
                id="perm-settings"
                checked={formData.permissions.includes("settings")}
                onChange={(e) => {
                  const newPermissions = e.target.checked
                    ? [...formData.permissions, "settings"]
                    : formData.permissions.filter((p) => p !== "settings")
                  setFormData({ ...formData, permissions: newPermissions })
                }}
              />
              <label htmlFor="perm-settings">Paramètres système</label>
            </div>
            <div className="admin-permission-checkbox">
              <input
                type="checkbox"
                id="perm-reports"
                checked={formData.permissions.includes("reports")}
                onChange={(e) => {
                  const newPermissions = e.target.checked
                    ? [...formData.permissions, "reports"]
                    : formData.permissions.filter((p) => p !== "reports")
                  setFormData({ ...formData, permissions: newPermissions })
                }}
              />
              <label htmlFor="perm-reports">Rapports et statistiques</label>
            </div>
          </div>
        </div>
        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={() => setActiveTab("list")}>
            Annuler
          </button>
          <button type="submit" className="admin-button primary">
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )

  const renderPasswordReset = () => (
    <div className="admin-form-container">
      <form className="admin-reset-form" onSubmit={handleResetPassword}>
        <div className="admin-form-group">
          <label className="admin-form-label">Email</label>
          <div className="admin-input-wrapper">
            <IonInput
              type="email"
              required
              className="admin-input"
              placeholder="user@example.com"
              value={resetEmail}
              onIonChange={(e) => setResetEmail(e.detail.value!)}
            ></IonInput>
          </div>
        </div>

        {resetErrorMessage && <div className="admin-error-message">{resetErrorMessage}</div>}

        {resetSuccessMessage && <div className="admin-success-message">{resetSuccessMessage}</div>}

        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={() => setActiveTab("list")}>
            Annuler
          </button>
          <button type="submit" className="admin-button primary" disabled={resetIsLoading}>
            {resetIsLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </button>
        </div>
      </form>
    </div>
  )

  const renderAccountRequests = () => (
    <div className="admin-user-list">
      <div className="admin-filters">
        <div className="admin-search-container">
          <IonIcon icon={searchOutline} className="admin-search-icon" />
          <IonSearchbar
            className="admin-searchbar"
            placeholder="Rechercher une demande"
            value={requestSearchQuery}
            onIonChange={(e) => setRequestSearchQuery(e.detail.value || "")}
          ></IonSearchbar>
        </div>

        <div className="admin-filter-chips">
          <div className="admin-filter-chip">
            <div className="admin-filter-label">
              <IonIcon icon={filterOutline} />
              <span>Statut:</span>
            </div>
            <IonSelect
              interface="popover"
              className="admin-select-filter"
              value={requestStatusFilter}
              onIonChange={(e) => setRequestStatusFilter(e.detail.value)}
            >
              <IonSelectOption value="all">Tous</IonSelectOption>
              <IonSelectOption value="pending">En attente</IonSelectOption>
              <IonSelectOption value="approved">Approuvé</IonSelectOption>
              <IonSelectOption value="rejected">Rejeté</IonSelectOption>
            </IonSelect>
          </div>
        </div>
      </div>

      {loadingRequests ? (
        <div className="admin-loading">Chargement des demandes...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Date de demande</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request._id}>
                    <td>{`${request.prenom || ""} ${request.nom || ""}`}</td>
                    <td>{request.email || "N/A"}</td>
                    <td>{request.numeroGSM || "N/A"}</td>
                    <td>{request.createdAt ? new Date(request.createdAt).toLocaleDateString("fr-FR") : "N/A"}</td>
                    <td>
                      <span className={`admin-status-badge ${request.status || "pending"}`}>
                        {request.status === "approved"
                          ? "Approuvé"
                          : request.status === "rejected"
                            ? "Rejeté"
                            : "En attente"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-action-buttons">
                        {(!request.status || request.status === "pending") && (
                          <>
                            <button
                              className="admin-icon-button approve"
                              onClick={() => handleApproveRequest(request._id)}
                              title="Approuver"
                            >
                              <IonIcon icon={checkmarkCircleOutline} />
                            </button>
                            <button
                              className="admin-icon-button reject"
                              onClick={() => handleRejectRequest(request._id)}
                              title="Rejeter"
                            >
                              <IonIcon icon={closeCircleOutline} />
                            </button>
                          </>
                        )}
                        <button
                          className="admin-icon-button view"
                          title="Voir les détails"
                          onClick={() => handleViewRequestDetails(request)}
                        >
                          <IonIcon icon={documentTextOutline} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="admin-no-results">
                    Aucune demande trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  // Add this function inside the UserManagement component, before the return statement
  const getDocumentsFromRequest = (request: AccountRequest) => {
    return [
      { label: "CIN Recto", data: request.cinRecto || null },
      { label: "CIN Verso", data: request.cinVerso || null },
      { label: "Spécimen de Signature", data: request.specimenSignature || null },
      { label: "Fiche Profil Client", data: request.ficheProfilClient || null },
      { label: "Selfie avec CIN", data: request.selfiAvecCIN || null },
    ];
  };

  const renderRequestDetailsModal = () => {
    if (!selectedRequest) return null

    const formatDate = (dateString?: string) => {
      if (!dateString) return "N/A"
      return new Date(dateString).toLocaleDateString("fr-FR")
    }

    return (
      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Détails de la demande</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="request-details-container">
            <div className="request-header">
              <h2>{`${selectedRequest.prenom || ""} ${selectedRequest.nom || ""}`}</h2>
              <div className="request-status">
                <span className={`admin-status-badge ${selectedRequest.status || "pending"}`}>
                  {selectedRequest.status === "approved"
                    ? "Approuvé"
                    : selectedRequest.status === "rejected"
                      ? "Rejeté"
                      : "En attente"}
                </span>
              </div>
            </div>

            <div className="request-section">
              <h3 className="section-title">Informations personnelles</h3>
              <IonList lines="full">
                <IonItem>
                  <IonIcon icon={personOutline} slot="start" />
                  <IonLabel>Nom complet</IonLabel>
                  <IonText slot="end">{`${selectedRequest.prenom || ""} ${selectedRequest.nom || ""}`}</IonText>
                </IonItem>
                <IonItem>
                  <IonIcon icon={mailOutline} slot="start" />
                  <IonLabel>Email</IonLabel>
                  <IonText slot="end">{selectedRequest.email || "N/A"}</IonText>
                </IonItem>
                <IonItem>
                  <IonIcon icon={callOutline} slot="start" />
                  <IonLabel>Téléphone</IonLabel>
                  <IonText slot="end">{selectedRequest.numeroGSM || "N/A"}</IonText>
                </IonItem>
                <IonItem>
                  <IonIcon icon={homeOutline} slot="start" />
                  <IonLabel>Adresse</IonLabel>
                  <IonText slot="end">{selectedRequest.adresseDomicile || "N/A"}</IonText>
                </IonItem>
                <IonItem>
                  <IonIcon icon={calendarOutline} slot="start" />
                  <IonLabel>Date de naissance</IonLabel>
                  <IonText slot="end">
                    {selectedRequest.dateNaissance ? formatDate(selectedRequest.dateNaissance) : "N/A"}
                  </IonText>
                </IonItem>
              </IonList>
            </div>

            <div className="request-section">
              <h3 className="section-title">Informations professionnelles</h3>
              <IonList lines="full">
                <IonItem>
                  <IonLabel>Profession</IonLabel>
                  <IonText slot="end">{selectedRequest.activite || "N/A"}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Revenu mensuel</IonLabel>
                  <IonText slot="end">
                    {selectedRequest.montantRevenusMensuels
                      ? `${selectedRequest.montantRevenusMensuels.toLocaleString("fr-FR")} DT`
                      : "N/A"}
                  </IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Situation familiale</IonLabel>
                  <IonText slot="end">{selectedRequest.situationFamille || "N/A"}</IonText>
                </IonItem>
              </IonList>
            </div>

            <div className="request-section">
              <h3 className="section-title">Documents</h3>
              <IonList lines="full">
                <IonItem>
                  <IonLabel>Type de pièce d'identité</IonLabel>
                  <IonText slot="end">{selectedRequest.pieceIdentite || "CIN"}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Numéro de pièce d'identité</IonLabel>
                  <IonText slot="end">{selectedRequest.numeroCIN || "N/A"}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Justificatif de domicile</IonLabel>
                  <IonText slot="end">{selectedRequest.justificatifDomicile ? "Fourni" : "Non fourni"}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>Justificatif de revenu</IonLabel>
                  <IonText slot="end">{selectedRequest.justificatifRevenu ? "Fourni" : "Non fourni"}</IonText>
                </IonItem>
              </IonList>
            </div>

            <div className="request-section">
              <h3 className="section-title">Documents fournis</h3>
              {selectedRequest && <DocumentPreview documents={getDocumentsFromRequest(selectedRequest)} />}
            </div>

            {selectedRequest.notes && (
              <div className="request-section">
                <h3 className="section-title">Notes</h3>
                <div className="request-notes">
                  <p>{selectedRequest.notes}</p>
                </div>
              </div>
            )}

            <div className="request-section">
              <h3 className="section-title">Informations de la demande</h3>
              <IonList lines="full">
                <IonItem>
                  <IonLabel>Date de création</IonLabel>
                  <IonText slot="end">{formatDate(selectedRequest.createdAt)}</IonText>
                </IonItem>
                <IonItem>
                  <IonLabel>ID de la demande</IonLabel>
                  <IonText slot="end">{selectedRequest._id}</IonText>
                </IonItem>
              </IonList>
            </div>

            {(!selectedRequest.status || selectedRequest.status === "pending") && (
              <div className="request-actions">
                <IonButton
                  expand="block"
                  color="danger"
                  onClick={() => {
                    handleRejectRequest(selectedRequest._id)
                    setIsModalOpen(false)
                  }}
                >
                  Rejeter la demande
                </IonButton>
                <IonButton
                  expand="block"
                  color="success"
                  onClick={() => {
                    handleApproveRequest(selectedRequest._id)
                    setIsModalOpen(false)
                  }}
                >
                  Approuver la demande
                </IonButton>
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>
    )
  }

  return (
    <IonPage>
      <div className="admin-dashboard-layout">
        <SidebarAdmin currentPage="Utilisateurs" />
        <div className="admin-dashboard-content">
          <AdminPageHeader
            title="Gestion des Admin"
            subtitle="Gérez les comptes Admin et leurs permissions"
          />
          <div className="admin-content-card">
            <div className="admin-tabs">
              <button
                className={`admin-tab ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                <IonIcon icon={peopleOutline} />
                <span>Liste des Administratuers</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "create" ? "active" : ""}`}
                onClick={() => setActiveTab("create")}
              >
                <IonIcon icon={personAddOutline} />
                <span>Créer/Éditer un Admin</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "reset" ? "active" : ""}`}
                onClick={() => setActiveTab("reset")}
              >
                <IonIcon icon={keyOutline} />
                <span>Réinitialiser le mot de passe</span>
              </button>
              <button
                className={`admin-tab ${activeTab === "requests" ? "active" : ""}`}
                onClick={() => setActiveTab("requests")}
              >
                <IonIcon icon={documentTextOutline} />
                <span>Demandes de création</span>
              </button>
            </div>
            <div className="admin-tab-content">
              {activeTab === "list" && renderUserList()}
              {activeTab === "create" && renderUserForm()}
              {activeTab === "reset" && renderPasswordReset()}
              {activeTab === "requests" && renderAccountRequests()}
            </div>
          </div>
        </div>
      </div>
      {renderRequestDetailsModal()}
    </IonPage>
  )
}

export default UserManagement
