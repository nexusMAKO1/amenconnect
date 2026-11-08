"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { IonIcon } from "@ionic/react"
import { documentOutline, addCircleOutline, trashOutline, cloudUploadOutline } from "ionicons/icons"
import { useAuth } from "../../../AuthContext"
// Import the custom hooks
import useVirementGroupe from "../../../hooks/useVirementGroupe"
import { useBeneficiaries } from "../../../hooks/useBeneficiaries"

interface Compte {
  _id: string
  numéroCompte: string
  solde: number
  type: string
}

interface VirementGroupe {
  beneficiaireId: string // Now holds the beneficiary RIB
  montant: string
  motif: string
}

const VirementsGroupes: React.FC = () => {
  const { profile } = useAuth()

  const [comptes, setComptes] = useState<Compte[]>([])
  const [compteSource, setCompteSource] = useState("")
  const [mode, setMode] = useState<"csv" | "manuel">("manuel")
  const [virements, setVirements] = useState<VirementGroupe[]>([
    { beneficiaireId: "", montant: "", motif: "" },
  ])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<any[]>([])
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use our custom hooks for group virements and beneficiaries
  const {
    loading,
    error: hookError,
    response,
    makeVirementGroupe,
  } = useVirementGroupe()
  const { beneficiaires, loading: beneficiariesLoading, error: beneficiariesError } = useBeneficiaries()

  useEffect(() => {
    // Fetch accounts from profile
    if (profile && profile.comptes) {
      setComptes(profile.comptes)
      if (profile.comptes.length > 0) {
        setCompteSource(profile.comptes[0]._id)
      }
    }
  }, [profile])

  // When beneficiaries are loaded, pre-populate the first virement row with the beneficiary's RIB
  useEffect(() => {
    if (beneficiaires.length > 0 && virements[0].beneficiaireId === "") {
      setVirements([{ beneficiaireId: beneficiaires[0].RIB, montant: "", motif: "" }])
    }
  }, [beneficiaires])

  const handleAddVirement = () => {
    setVirements([
      ...virements,
      { beneficiaireId: beneficiaires[0]?.RIB || "", montant: "", motif: "" },
    ])
  }

  const handleRemoveVirement = (index: number) => {
    const newVirements = [...virements]
    newVirements.splice(index, 1)
    setVirements(newVirements)
  }

  const handleVirementChange = (
    index: number,
    field: keyof VirementGroupe,
    value: string
  ) => {
    const newVirements = [...virements]
    newVirements[index][field] = value
    setVirements(newVirements)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    // Parse CSV file
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      const parsedData = rows
        .slice(1)
        .filter((row) => row.trim())
        .map((row) => {
          const values = row.split(",")
          const rowData: any = {}
          headers.forEach((header, index) => {
            rowData[header.trim()] = values[index]?.trim() || ""
          })
          return rowData
        })

      setCsvPreview(parsedData)
    }

    reader.readAsText(file)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount)
  }

  const selectedCompte = comptes.find((compte) => compte._id === compteSource)

  // Calculate total amount from either manual entries or CSV preview
  const totalAmount =
    mode === "manuel"
      ? virements.reduce((sum, v) => sum + (Number.parseFloat(v.montant) || 0), 0)
      : csvPreview.reduce((sum, row) => sum + (Number.parseFloat(row.amount) || 0), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    setSuccess(false)

    // Basic validations
    if (!compteSource) {
      setError("Veuillez sélectionner un compte source")
      return
    }

    if (selectedCompte && totalAmount > selectedCompte.solde) {
      setError(`Solde insuffisant pour ce virement groupé (${formatCurrency(totalAmount)} requis, ${formatCurrency(selectedCompte.solde)} disponible)`)
      return
    }

    if (mode === "manuel") {
      // Validate manual entries
      const invalidEntries = virements.some(
        (v) => !v.beneficiaireId || !v.montant || Number.parseFloat(v.montant) <= 0
      )
      if (invalidEntries) {
        setError("Veuillez remplir correctement tous les champs pour chaque virement")
        return
      }
    } else {
      // Validate CSV
      if (!csvFile || csvPreview.length === 0) {
        setError("Veuillez importer un fichier CSV valide")
        return
      }
    }

    // Construct the payload for the API
    if (mode === "manuel") {
      const data = {
        fromAccount: compteSource,
        virements: virements.map((v) => ({
          beneficiary: v.beneficiaireId, // sending the RIB
          amount: Number.parseFloat(v.montant),
          motif: v.motif,
        })),
      }

      await makeVirementGroupe(data)
    } else {
      const data = {
        fromAccount: compteSource,
        virements: csvPreview.map((row) => ({
          beneficiary: row.accountNumber,
          amount: Number.parseFloat(row.amount),
          motif: row.reason || "",
        })),
      }

      await makeVirementGroupe(data)
    }

    // Check response from the hook
    if (response?.success) {
      // Reset form based on mode
      if (mode === "csv") {
        setCsvFile(null)
        setCsvPreview([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        setVirements([{ beneficiaireId: beneficiaires[0]?.RIB || "", montant: "", motif: "" }])
      }
      setSuccess(true)
    }
  }

  return (
    <div className="virements-groupes">
      <div className="virement-card">
        <h3 className="virement-card__title">
          <IonIcon icon={documentOutline} />
          Virements groupés
        </h3>

        {success && (
          <div className="virement-success">
            <div className="virement-success__icon">
              <IonIcon icon={documentOutline} />
            </div>
            <h4 className="virement-success__title">Virements groupés effectués avec succès</h4>
            <p className="virement-success__message">
              Vos virements ont été traités avec succès. Un email de confirmation vous a été envoyé.
            </p>
            <button className="virement-form__button" onClick={() => setSuccess(false)}>
              Effectuer d'autres virements
            </button>
          </div>
        )}

        {!success && (
          <form className="virement-form" onSubmit={handleSubmit}>
            {error && <div className="virement-form__error">{error}</div>}
            {hookError && <div className="virement-form__error">{hookError}</div>}

            <div className="virement-form__group">
              <label className="virement-form__label" htmlFor="compteSource">
                Compte source
              </label>
              <select
                id="compteSource"
                className="virement-form__select"
                value={compteSource}
                onChange={(e) => setCompteSource(e.target.value)}
                required
              >
                {comptes.map((compte) => (
                  <option key={compte._id} value={compte._id}>
                    {compte.type} - {compte.numéroCompte} ({formatCurrency(compte.solde)})
                  </option>
                ))}
              </select>
            </div>

            <div className="virement-form__tabs">
              <button
                type="button"
                className={`virement-form__tab ${mode === "manuel" ? "active" : ""}`}
                onClick={() => setMode("manuel")}
              >
                Saisie manuelle
              </button>
              <button
                type="button"
                className={`virement-form__tab ${mode === "csv" ? "active" : ""}`}
                onClick={() => setMode("csv")}
              >
                Import CSV
              </button>
            </div>

            {mode === "manuel" && (
              <div className="virement-form__manuel">
                {virements.map((virement, index) => (
                  <div key={index} className="virement-form__row">
                    <div className="virement-form__group">
                      <label className="virement-form__label">Bénéficiaire</label>
                      <select
                        className="virement-form__select"
                        value={virement.beneficiaireId}
                        onChange={(e) => handleVirementChange(index, "beneficiaireId", e.target.value)}
                        required
                      >
                        {beneficiaires.map((ben) => (
                          <option key={ben._id} value={ben.RIB}>
                            {ben.prenom} {ben.nom} - {ben.RIB}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="virement-form__group">
                      <label className="virement-form__label">Montant (TND)</label>
                      <input
                        type="number"
                        className="virement-form__input"
                        value={virement.montant}
                        onChange={(e) => handleVirementChange(index, "montant", e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="virement-form__group">
                      <label className="virement-form__label">Motif</label>
                      <input
                        type="text"
                        className="virement-form__input"
                        value={virement.motif}
                        onChange={(e) => handleVirementChange(index, "motif", e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="virement-form__button virement-form__button--icon"
                      onClick={() => handleRemoveVirement(index)}
                      disabled={virements.length === 1}
                    >
                      <IonIcon icon={trashOutline} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  className="virement-form__button virement-form__button--secondary"
                  onClick={handleAddVirement}
                >
                  <IonIcon icon={addCircleOutline} />
                  Ajouter un bénéficiaire
                </button>
              </div>
            )}

            {mode === "csv" && (
              <div className="virement-form__csv">
                <div className="virement-form__group">
                  <label className="virement-form__label">Importer un fichier CSV</label>
                  <div className="virement-form__file-upload">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      ref={fileInputRef}
                      className="virement-form__file-input"
                    />
                    <div className="virement-form__file-button">
                      <IonIcon icon={cloudUploadOutline} />
                      <span>{csvFile ? csvFile.name : "Choisir un fichier"}</span>
                    </div>
                  </div>
                  <div className="virement-form__file-info">
                    Format du fichier CSV: name,accountNumber,amount,reason
                  </div>
                </div>

                {csvPreview.length > 0 && (
                  <div className="virement-form__csv-preview">
                    <h4>Aperçu des données</h4>
                    <table className="virement-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Numéro de compte</th>
                          <th>Montant</th>
                          <th>Motif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, index) => (
                          <tr key={index}>
                            <td>{row.name}</td>
                            <td>{row.accountNumber}</td>
                            <td>{formatCurrency(Number.parseFloat(row.amount) || 0)}</td>
                            <td>{row.reason || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            <div className="virement-form__summary">
              <div className="virement-form__summary-item">
                <span>Nombre de virements:</span>
                <span>{mode === "manuel" ? virements.length : csvPreview.length}</span>
              </div>
              <div className="virement-form__summary-item">
                <span>Montant total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div className="virement-form__summary-item">
                <span>Compte source:</span>
                <span>
                  {selectedCompte?.type} - {selectedCompte?.numéroCompte}
                </span>
              </div>
              <div className="virement-form__summary-item">
                <span>Solde disponible:</span>
                <span>{formatCurrency(selectedCompte?.solde || 0)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="virement-form__button"
              disabled={loading || (mode === "manuel" ? virements.length === 0 : csvPreview.length === 0)}
            >
              {loading ? "Traitement en cours..." : "Effectuer les virements"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default VirementsGroupes
