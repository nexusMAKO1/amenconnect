"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { IonIcon, useIonToast } from "@ionic/react"
import {
  walletOutline,
  personOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  timeOutline,
  arrowForwardOutline,
} from "ionicons/icons"
import { useAuth } from "../../../AuthContext"
import useVirement from "../../../hooks/useVirement"
import { useBeneficiaries } from "../../../hooks/useBeneficiaries"

interface Compte {
  _id: string
  numéroCompte: string
  solde: number
  type: string
}

const VirementSimple: React.FC = () => {
  const [presentToast] = useIonToast()
  const { profile } = useAuth()
  const [comptes, setComptes] = useState<Compte[]>([])
  const { beneficiaires, loading: beneficiariesLoading, error: beneficiariesError } = useBeneficiaries()
  const [compteSource, setCompteSource] = useState("")
  const [beneficiaireRIB, setBeneficiaireRIB] = useState("")
  const [montant, setMontant] = useState("")
  const [motif, setMotif] = useState("")
  const [success, setSuccess] = useState(false)
  const [animationState, setAnimationState] = useState<"idle" | "loading" | "success">("idle")

  // Import our custom hook which handles virements
  const { loading, error, response, makeVirement } = useVirement()

  useEffect(() => {
    if (profile && profile.comptes) {
      setComptes(profile.comptes)
      if (profile.comptes.length > 0) {
        setCompteSource(profile.comptes[0]._id)
      }
    }
  }, [profile])

  useEffect(() => {
    if (beneficiaires.length > 0) {
      // Set initial beneficiary by RIB
      setBeneficiaireRIB(beneficiaires[0].RIB)
    }
  }, [beneficiaires])

  // Effect to handle loading and success states
  useEffect(() => {
    if (loading) {
      setAnimationState("loading")
    } else if (response?.success) {
      setAnimationState("success")
  
      // Keep the success state visible for 3 seconds instead of 1 second
      const timer = setTimeout(() => {
        setSuccess(true)
      }, 3000)
  
      return () => clearTimeout(timer)
    }
  }, [loading, response])
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validations
    if (!compteSource || !beneficiaireRIB || !montant) {
      presentToast({
        message: "Veuillez remplir tous les champs obligatoires.",
        duration: 3000,
        position: "top",
        color: "warning",
      })
      return
    }
    const numMontant = Number.parseFloat(montant)
    if (isNaN(numMontant) || numMontant <= 0) {
      presentToast({
        message: "Le montant du virement doit être supérieur à 0 TND.",
        duration: 3000,
        position: "top",
        color: "warning",
      })
      return
    }

    const selectedSource = comptes.find((c) => c.numéroCompte === compteSource)
    if (selectedSource && numMontant > selectedSource.solde) {
      presentToast({
        message: `Solde insuffisant pour effectuer ce virement. Solde disponible : ${selectedSource.solde} TND`,
        duration: 3500,
        position: "top",
        color: "danger",
      })
      return
    }

    // Create the virement payload using beneficiary's RIB for toAccount
    const virementData = {
      fromAccount: compteSource,
      toAccount: beneficiaireRIB,
      amount: Number.parseFloat(montant),
      description: motif,
    }

    // Call the hook to make the virement
    await makeVirement(virementData)

    // Force update animation state if response is successful
    // This ensures we transition to success state even if the useEffect doesn't catch it
    if (!loading && response?.success) {
      setAnimationState("success")
    }
  }

  const resetForm = () => {
    setMontant("")
    setMotif("")
    setSuccess(false)
    setAnimationState("idle")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount)
  }

  const selectedCompte = comptes.find((compte) => compte._id === compteSource)
  const selectedBeneficiaire = beneficiaires.find((ben) => ben.RIB === beneficiaireRIB)

  return (
    <div className="virement-simple">
      <div className="virement-grid virement-grid--2cols">
        <div className="virement-card">
          <h3 className="virement-card__title">
            <IonIcon icon={walletOutline} />
            Effectuer un virement
          </h3>

          {success ? (
            <motion.div
              className="virement-success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
            >
              <div className="virement-success__icon">
                <IonIcon icon={checkmarkCircleOutline} />
              </div>
              <h4 className="virement-success__title">Virement effectué avec succès</h4>
              <p className="virement-success__message">
                Votre virement a été traité avec succès. Un email de confirmation vous a été envoyé.
              </p>
              <button className="virement-form__button" onClick={resetForm}>
                Effectuer un autre virement
              </button>
            </motion.div>
          ) : (
            <form className="virement-form" onSubmit={handleSubmit}>
              {error && <div className="virement-form__error">{error}</div>}

              <AnimatePresence mode="wait">
                {animationState === "loading" || animationState === "success" ? (
                  <motion.div
                    key="processing"
                    className="virement-processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="virement-processing__container">
                      <motion.div
                        className="virement-processing__animation"
                        initial={{ scale: 1 }}
                        animate={{
                          scale: animationState === "success" ? [1, 1.1, 1] : 1,
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: 0,
                        }}
                      >
                        {animationState === "loading" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          >
                            <IonIcon icon={timeOutline} className="virement-processing__icon" />
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          >
                            <IonIcon
                              icon={checkmarkCircleOutline}
                              className="virement-processing__icon virement-processing__icon--success"
                            />
                          </motion.div>
                        )}
                      </motion.div>

                      <motion.div
                        className="virement-processing__details"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <h4 className="virement-processing__title">
                          {animationState === "loading" ? "Traitement en cours..." : "Virement réussi!"}
                        </h4>
                        <p className="virement-processing__description">
                          {animationState === "loading"
                            ? "Veuillez patienter pendant que nous traitons votre virement."
                            : "Votre virement a été traité avec succès."}
                        </p>

                        {animationState === "loading" && (
                          <motion.div
                            className="virement-processing__progress"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                          />
                        )}

                        {selectedCompte && selectedBeneficiaire && (
                          <motion.div
                            className="virement-processing__transfer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <div className="virement-processing__account">
                              <span className="virement-processing__account-name">{selectedCompte.type}</span>
                              <span className="virement-processing__account-number">{selectedCompte.numéroCompte}</span>
                            </div>

                            <motion.div
                              className="virement-processing__arrow"
                              animate={{
                                x: [0, 10, 0],
                                opacity: animationState === "loading" ? [0.5, 1, 0.5] : 1,
                              }}
                              transition={{
                                duration: 1.5,
                                repeat: animationState === "loading" ? Number.POSITIVE_INFINITY : 0,
                                repeatType: "reverse",
                              }}
                            >
                              <IonIcon icon={arrowForwardOutline} />
                            </motion.div>

                            <div className="virement-processing__account">
                              <span className="virement-processing__account-name">
                                {selectedBeneficiaire.prenom} {selectedBeneficiaire.nom}
                              </span>
                              <span className="virement-processing__account-number">{selectedBeneficiaire.RIB}</span>
                            </div>
                          </motion.div>
                        )}

                        <motion.div
                          className="virement-processing__amount"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.6 }}
                        >
                          {formatCurrency(Number(montant))}
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
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

                    <div className="virement-form__group">
                      <label className="virement-form__label" htmlFor="beneficiaire">
                        Bénéficiaire
                      </label>
                      <select
                        id="beneficiaire"
                        className="virement-form__select"
                        value={beneficiaireRIB}
                        onChange={(e) => setBeneficiaireRIB(e.target.value)}
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
                      <label className="virement-form__label" htmlFor="montant">
                        Montant (TND)
                      </label>
                      <input
                        id="montant"
                        type="number"
                        className="virement-form__input"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="virement-form__group">
                      <label className="virement-form__label" htmlFor="motif">
                        Motif du virement
                      </label>
                      <textarea
                        id="motif"
                        className="virement-form__textarea"
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <button type="submit" className="virement-form__button" disabled={loading}>
                      Effectuer le virement
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          )}
        </div>

        <div className="virement-card">
          <h3 className="virement-card__title">
            <IonIcon icon={documentTextOutline} />
            Récapitulatif
          </h3>

          <div className="virement-recap">
            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={walletOutline} />
                Compte source
              </h4>
              {selectedCompte ? (
                <div className="virement-recap__content">
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Type:</span>
                    <span className="virement-recap__value">{selectedCompte.type}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Numéro:</span>
                    <span className="virement-recap__value">{selectedCompte.numéroCompte}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Solde disponible:</span>
                    <span className="virement-recap__value">{formatCurrency(selectedCompte.solde)}</span>
                  </div>
                </div>
              ) : (
                <p className="virement-recap__empty">Aucun compte sélectionné</p>
              )}
            </div>

            <div className="virement-recap__group">
              <h4 className="virement-recap__title">
                <IonIcon icon={personOutline} />
                Bénéficiaire
              </h4>
              {selectedBeneficiaire ? (
                <div className="virement-recap__content">
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Nom:</span>
                    <span className="virement-recap__value">
                      {selectedBeneficiaire.prenom} {selectedBeneficiaire.nom}
                    </span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Compte:</span>
                    <span className="virement-recap__value">{selectedBeneficiaire.RIB}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">Banque:</span>
                    <span className="virement-recap__value">{selectedBeneficiaire.banque}</span>
                  </div>
                  <div className="virement-recap__item">
                    <span className="virement-recap__label">RIB:</span>
                    <span className="virement-recap__value">{selectedBeneficiaire.RIB}</span>
                  </div>
                </div>
              ) : (
                <p className="virement-recap__empty">Aucun bénéficiaire sélectionné</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VirementSimple

