"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { IonIcon, IonSearchbar, IonButton, IonInput, useIonAlert } from "@ionic/react"
import { motion, AnimatePresence } from "framer-motion"
import {
  personOutline,
  addOutline,
  createOutline,
  trashOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
} from "ionicons/icons"
import { useBeneficiaries, type Beneficiaire } from "../../../hooks/useBeneficiaries"

interface GestionBeneficiairesMobileProps {
  onAddClick?: () => void
}

const GestionBeneficiairesMobile: React.FC<GestionBeneficiairesMobileProps> = ({ onAddClick }) => {
  const [presentAlert] = useIonAlert()
  const { beneficiaires, loading, error, addBeneficiaire, updateBeneficiaire, deleteBeneficiaire } = useBeneficiaries()

  const [filteredBeneficiaires, setFilteredBeneficiaires] = useState<Beneficiaire[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    RIB: "",
    banque: "",
    email: "",
    telephone: "",
  })
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const bankCodes: { [key: string]: string } = {
    "01": "Banque Centrale de Tunisie (BCT)",
    "02": "Banque de Tunisie (BT)",
    "03": "Société Tunisienne de Banque (STB)",
    "04": "Banque Nationale Agricole (BNA)",
    "05": "Banque de l'Habitat (BH)",
    "07": "Amen Bank",
    "08": "BIAT",
    "10": "Banque Tuniso-Koweitienne (BTK)",
    "11": "Banque de Tunisie et des Emirats (BTE)",
    "12": "Union Internationale de Banques (UIB)",
    "13": "Union Bancaire pour le Commerce et l'Industrie (UBCI)",
    "14": "Arab Tunisian Bank (ATB)",
    "16": "Banque de Financement des Petites et Moyennes Entreprises (BFPME)",
    "17": "Banque Zitouna",
    "18": "Attijari Bank Tunisia",
    "20": "Société Générale Tunisie (SGT)",
    "21": "QNB Tunisia",
    "22": "Al Baraka Bank Tunisia",
    "23": "Banque Tuniso-Libyenne (BTL)",
    "24": "STUSID Bank",
    "25": "Citibank Tunisia",
    "26": "Wifak International Bank",
    "31": "NSIA Bank Tunisia",
    "32": "Al-Yusr Islamic Bank",
  }

  useEffect(() => {
    if (searchTerm) {
      const filtered = beneficiaires.filter(
        (ben) =>
          ben.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ben.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ben.RIB.includes(searchTerm) ||
          ben.banque.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredBeneficiaires(filtered)
    } else {
      setFilteredBeneficiaires(beneficiaires)
    }
  }, [beneficiaires, searchTerm])

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value }
      // When the user types in the RIB field, remove any spaces for validation/extraction
      if (name === "RIB") {
        const valueNoSpaces = value.replace(/\s+/g, "")
        // Extract the bank code from the first 2 digits of the RIB
        if (valueNoSpaces.length >= 2) {
          const bankCode = valueNoSpaces.substring(0, 2)
          const bankName = bankCodes[bankCode] || ""
          newFormData.banque = bankName
        }
      }
      return newFormData
    })
  }

  const handleAddBeneficiaire = () => {
    setEditingId(null)
    setFormData({
      prenom: "",
      nom: "",
      RIB: "",
      banque: "",
      email: "",
      telephone: "",
    })
    setFormError("")
    setFormSuccess("")
    setShowForm(true)
    if (onAddClick) onAddClick()
  }

  const handleEditBeneficiaire = (id: string) => {
    const beneficiaire = beneficiaires.find((ben) => ben._id === id)
    if (beneficiaire) {
      setEditingId(id)
      setFormData({
        prenom: beneficiaire.prenom,
        nom: beneficiaire.nom,
        RIB: beneficiaire.RIB,
        banque: beneficiaire.banque,
        email: beneficiaire.email || "",
        telephone: beneficiaire.telephone || "",
      })
      setFormError("")
      setFormSuccess("")
      setShowForm(true)
    }
  }

  const handleDeleteBeneficiaire = (id: string) => {
    presentAlert({
      header: "Confirmation",
      message: "Êtes-vous sûr de vouloir supprimer ce bénéficiaire ?",
      buttons: [
        { text: "Annuler", role: "cancel" },
        {
          text: "Supprimer",
          role: "destructive",
          handler: async () => {
            try {
              await deleteBeneficiaire(id)
              setFormSuccess("Bénéficiaire supprimé avec succès")
              setTimeout(() => setFormSuccess(""), 3000)
            } catch (error: any) {
              console.error("Error deleting beneficiary:", error)
              setFormError(error.message || "Une erreur est survenue lors de la suppression du bénéficiaire")
            }
          },
        },
      ],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")

    try {
      // Validate that required fields are filled
      if (!formData.prenom || !formData.nom || !formData.RIB || !formData.banque) {
        throw new Error("Veuillez remplir tous les champs obligatoires")
      }

      // Remove spaces from the RIB input
      const ribNoSpaces = formData.RIB.replace(/\s+/g, "")
      // Validate that the RIB is exactly 20 digits
      if (!/^\d{20}$/.test(ribNoSpaces)) {
        throw new Error("Le numéro de compte (RIB) doit contenir exactement 20 chiffres")
      }

      if (editingId) {
        // Update existing beneficiary
        await updateBeneficiaire(editingId, formData)
        setFormSuccess("Bénéficiaire modifié avec succès")
      } else {
        // Add new beneficiary
        await addBeneficiaire(formData)
        setFormSuccess("Bénéficiaire ajouté avec succès")
      }

      // Reset form
      setTimeout(() => {
        setShowForm(false)
        setEditingId(null)
        setFormSuccess("")
      }, 2000)
    } catch (error: any) {
      console.error("Error submitting form:", error)
      setFormError(error.message || "Une erreur est survenue lors de l'enregistrement du bénéficiaire")
    }
  }

  return (
    <div className="gestion-beneficiaires-mobile">
      {formSuccess && (
        <div className="success-message">
          <IonIcon icon={checkmarkCircleOutline} />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="error-message">
          <IonIcon icon={closeCircleOutline} />
          <span>{formError}</span>
        </div>
      )}

      <div className="beneficiaries-header">
        <IonSearchbar
          value={searchTerm}
          onIonChange={(e) => setSearchTerm(e.detail.value || "")}
          placeholder="Rechercher un bénéficiaire"
          className="beneficiary-search"
        />
        <IonButton fill="clear" className="add-button" onClick={handleAddBeneficiaire}>
          <IonIcon icon={addOutline} />
          Ajouter
        </IonButton>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="beneficiary-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="form-header">
              <h3>{editingId ? "Modifier le bénéficiaire" : "Ajouter un bénéficiaire"}</h3>
              <button className="close-button" onClick={() => setShowForm(false)}>
                <IonIcon icon={closeOutline} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <IonInput
                    className="form-input"
                    value={formData.prenom}
                    onIonChange={(e) => handleInputChange("prenom", e.detail.value || "")}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <IonInput
                    className="form-input"
                    value={formData.nom}
                    onIonChange={(e) => handleInputChange("nom", e.detail.value || "")}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">RIB *</label>
                <IonInput
                  className="form-input"
                  value={formData.RIB}
                  placeholder="Ex: 10 006 0351835984788 31"
                  onIonChange={(e) => handleInputChange("RIB", e.detail.value || "")}
                  required
                />
                <div className="form-hint">
                  Format : Code Banque (2), Code Agence (3), Numéro de compte (13), Clé (2)
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Banque *</label>
                <IonInput
                  className="form-input"
                  value={formData.banque}
                  onIonChange={(e) => handleInputChange("banque", e.detail.value || "")}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <IonInput
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onIonChange={(e) => handleInputChange("email", e.detail.value || "")}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <IonInput
                    type="tel"
                    className="form-input"
                    value={formData.telephone}
                    onIonChange={(e) => handleInputChange("telephone", e.detail.value || "")}
                  />
                </div>
              </div>

              <div className="form-actions">
                <IonButton fill="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </IonButton>
                <IonButton type="submit">{editingId ? "Modifier" : "Ajouter"}</IonButton>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="loading-state">Chargement des bénéficiaires...</div>
      ) : error ? (
        <div className="error-state">
          <IonIcon icon={closeCircleOutline} className="error-icon" />
          <p>{error}</p>
        </div>
      ) : filteredBeneficiaires.length === 0 ? (
        <div className="empty-state">
          <IonIcon icon={personOutline} className="empty-icon" />
          <p>Aucun bénéficiaire trouvé</p>
          <IonButton size="small" onClick={handleAddBeneficiaire}>
            Ajouter un bénéficiaire
          </IonButton>
        </div>
      ) : (
        <div className="beneficiaries-list">
          {filteredBeneficiaires.map((ben) => (
            <motion.div
              key={ben._id}
              className="beneficiary-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="beneficiary-icon">
                <IonIcon icon={personOutline} />
              </div>
              <div className="beneficiary-info">
                <span className="beneficiary-name">
                  {ben.prenom} {ben.nom}
                </span>
                <span className="beneficiary-account">{ben.RIB}</span>
                <span className="beneficiary-bank">{ben.banque}</span>
              </div>
              <div className="beneficiary-actions">
                <button className="edit-button" onClick={() => handleEditBeneficiaire(ben._id)}>
                  <IonIcon icon={createOutline} />
                </button>
                <button className="delete-button" onClick={() => handleDeleteBeneficiaire(ben._id)}>
                  <IonIcon icon={trashOutline} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GestionBeneficiairesMobile

