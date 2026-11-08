"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import {
  IonContent,
  IonPage,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  useIonToast,
} from "@ionic/react"
import {
  statsChartOutline,
  chevronDownCircleOutline,
  trendingUpOutline,
  trendingDownOutline,
  walletOutline,
} from "ionicons/icons"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { motion } from "framer-motion"
import { useAuth } from "../../../AuthContext"
import "./CompteMobile.css"
import NavMobile from "../../../components/NavMobile"

// Define the Transaction interface used for historique data
interface Transaction {
  _id: string
  date: string
  amount: number
  description: string
  type: "credit" | "debit"
}

const CompteMobile: React.FC = () => {
  const [presentToast] = useIonToast()
  const [today, setToday] = useState<string>("")
  const [selectedSegment, setSelectedSegment] = useState<string>("operations")
  const [typeCreditValue, setTypeCreditValue] = useState<string>("")
  const [montantValue, setMontantValue] = useState<number>()
  const [RevenuMensuel, setRevenuMensuel] = useState<number>(0)
  const [dureeValue, setDureeValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userCredits, setUserCredits] = useState<any[]>([])
  const [loadingCredits, setLoadingCredits] = useState(true)

  // Get profile data from context
  const { profile, authLoading, refreshProfile } = useAuth()

  useEffect(() => {
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    setToday(formattedDate)
  }, [])

  // Aggregate historique (operations) from profile.comptes
  const operations = useMemo(() => {
    if (!profile) return []
    let allOperations: Transaction[] = [] // Explicitly typed as Transaction[]
    profile.comptes.forEach((compte) => {
      if (compte.historique && Array.isArray(compte.historique)) {
        allOperations = allOperations.concat(compte.historique)
      }
    })
    return allOperations
  }, [profile])

  // Build chart data from operations
  const chartData = useMemo(() => {
    const grouped = operations.reduce(
      (acc, op) => {
        const month = new Date(op.date).toLocaleString("default", { month: "short" })
        if (!acc[month]) {
          acc[month] = { month: month, income: 0, expenses: 0 }
        }
        if (op.type === "credit") {
          acc[month].income += op.amount
        } else if (op.type === "debit") {
          acc[month].expenses += op.amount
        }
        return acc
      },
      {} as { [key: string]: { month: string; income: number; expenses: number } },
    )
    return Object.values(grouped)
  }, [operations])

  // Handle segment (tab) change
  const handleSegmentChange = (e: CustomEvent) => {
    setSelectedSegment(e.detail.value)
  }

  // Fetch user credits
  const fetchUserCredits = async () => {
    if (!profile?.user?._id) return
    setLoadingCredits(true)
    try {
      const response = await fetch(`/api/credit?userId=${profile.user._id}`)
      if (!response.ok) throw new Error("Failed to fetch credits")
      const data = await response.json()
      setUserCredits(data)
    } catch (error) {
      console.error("Error fetching credits:", error)
      presentToast({
        message: "Erreur lors du chargement des crédits.",
        duration: 3000,
        position: "top",
        color: "danger",
      })
    } finally {
      setLoadingCredits(false)
    }
  }

  useEffect(() => {
    if (profile?.user?._id) {
      fetchUserCredits()
    }
  }, [profile?.user?._id])

  // Handle credit submission
  const handleSubmitCredit = async () => {
    if (!typeCreditValue || !montantValue || !dureeValue || !RevenuMensuel) {
      presentToast({
        message: "Tous les champs sont obligatoires pour la demande de crédit.",
        duration: 3000,
        position: "top",
        color: "warning",
      })
      return
    }
    setIsSubmitting(true)
    try {
      const resp = await fetch("/api/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: typeCreditValue,
          montant: montantValue,
          duree: dureeValue,
          user: { id: profile?.user._id },
          compteId: profile?.comptes[0]?._id,
          RevenuMensuel: RevenuMensuel,
        }),
      })

      if (!resp.ok) throw new Error("Erreur serveur")
      await fetchUserCredits()

      presentToast({
        message: "Votre demande de crédit a été enregistrée avec succès.",
        duration: 3500,
        position: "top",
        color: "success",
      })

      setTypeCreditValue("")
      setMontantValue(0)
      setDureeValue("")
      setRevenuMensuel(0)

      // Switch to credits tab to show the new application
      setSelectedSegment("credits")
    } catch (err) {
      console.error(err)
      presentToast({
        message: "Impossible d'enregistrer la demande de crédit.",
        duration: 3000,
        position: "top",
        color: "danger",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
    }).format(amount)
  }

  // Render credit status with appropriate styling
  const renderCreditStatus = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvé"
      case "rejected":
        return "Refusé"
      case "pending":
        return "En attente"
      default:
        return "En attente"
    }
  }

  if (authLoading) {
    return (
      <IonPage>
        <IonContent fullscreen className="ion-padding">
          <p>Chargement des données...</p>
        </IonContent>
      </IonPage>
    )
  }

  // Use the first account from profile data (or fallback)
  const account = profile?.comptes && profile.comptes.length > 0 ? profile.comptes[0] : null

  return (
    <IonPage>
      <IonContent fullscreen>
        {/* Pull-to-refresh */}
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (event) => {
            try {
              await refreshProfile()
              if (selectedSegment === "credits") {
                await fetchUserCredits()
              }
            } catch (error) {
              console.error("Refresh failed:", error)
            } finally {
              event.detail.complete()
            }
          }}
        >
          <IonRefresherContent
            pullingIcon={chevronDownCircleOutline}
            pullingText="Tirer pour rafraîchir"
            refreshingSpinner="circles"
          ></IonRefresherContent>
        </IonRefresher>

        <div className="scrollable-content ion-padding-horizontal">
          <motion.h1
            className="page-title"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Mes comptes
          </motion.h1>

          {/* Account Card */}
          <motion.div
            className="account-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="account-header">
              <span>{account?.type || "Compte Epargne"}</span>
              <IonIcon icon={statsChartOutline} className="stats-icon" />
            </div>
            <div className="account-details">
              <div>
                <h2 className="balance">{account ? `${account.solde} TND` : "450.0 TND"}</h2>
                <p className="account-number">{account ? account.numéroCompte : "12345678987"}</p>
              </div>
              <span className="expiry-date">{today}</span>
            </div>
          </motion.div>

          {/* Chart Section for Operations */}
          {selectedSegment === "operations" && (
            <motion.div
              className="mobile-chart-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {chartData.length === 0 ? (
                <p>Aucune donnée pour le graphique</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF5722" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stackId="1"
                      stroke="#FF5722"
                      fillOpacity={1}
                      fill="url(#colorExpenses)"
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stackId="1"
                      stroke="#4CAF50"
                      fillOpacity={1}
                      fill="url(#colorIncome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          )}

          {/* Segment Buttons */}
          <IonSegment mode="ios" value={selectedSegment} onIonChange={handleSegmentChange} className="custom-segment">
            <IonSegmentButton value="operations">
              <IonLabel>Opérations</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="infos">
              <IonLabel>Infos</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="credits">
              <IonLabel>Crédits</IonLabel>
            </IonSegmentButton>

          </IonSegment>
          <IonSearchbar placeholder="Rechercher" className="custom-searchbar" mode="ios"></IonSearchbar>

          {/* Operations List Section */}
          {selectedSegment === "operations" && (
            <motion.div
              className="operations-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h3>Opérations</h3>
              <p className="last-update">Dernière mise à jour: {today}</p>
              {operations.length > 0 ? (
                operations.map((op) => (
                  <div key={op._id} className="operation-item">
                    <div className="operation-icon">
                      <IonIcon icon={op.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                    </div>
                    <div className="operation-details">
                      <span className="operation-description">{op.description}</span>
                      <span className="operation-date">
                        {new Date(op.date).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="operation-amount">
                      <span className={`amount ${op.type === "credit" ? "credit" : "debit"}`}>
                        {op.type === "credit" ? "+" : "-"} {op.amount} TND
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucune opération disponible</p>
              )}
            </motion.div>
          )}

          {/* Account Information Section */}
          {selectedSegment === "infos" && account && (
            <motion.div
              className="account-info-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2>Informations du compte</h2>
              <div className="info-item">
                <span className="info-label">Type de compte:</span>
                <span className="info-value">{account.type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Numéro de compte:</span>
                <span className="info-value">{account.numéroCompte}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Solde:</span>
                <span className="info-value">{account.solde} TND</span>
              </div>
              <div className="info-item">
                <span className="info-label">IBAN:</span>
                <span className="info-value">{account.IBAN}</span>
              </div>
              <div className="info-item">
                <span className="info-label">RIB:</span>
                <span className="info-value">{account.RIB}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date de création:</span>
                <span className="info-value">{new Date(account.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
            </motion.div>
          )}

          {/* Credits Section */}
          {selectedSegment === "credits" && (
            <motion.div
              className="credits-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="credits-container">
                <h3>Mes demandes de crédit</h3>
                <p className="last-update">Dernière mise à jour: {today}</p>

                {loadingCredits ? (
                  <p>Chargement des crédits...</p>
                ) : userCredits.length > 0 ? (
                  userCredits.map((credit) => (
                    <div key={credit._id} className="credit-application-item">
                      <div className="credit-application-icon">
                        <IonIcon icon={walletOutline} />
                      </div>
                      <div className="credit-application-details">
                        <div className="credit-application-title">{credit.type}</div>
                        <div className="credit-application-meta">
                          <span>Demande du {formatDate(credit.createdAt)}</span>
                          <span>{formatCurrency(credit.montant)}</span>
                        </div>
                        <div className="credit-application-info">
                          <span>Durée: {credit.duree} mois</span>
                        </div>

                        {/* Payment Progress Bar for Approved Credits */}
                        {credit.status === "approved" && (
                          <div className="payment-progress-container">
                            <div className="payment-progress-header">
                              <span>Progression</span>
                              <span>{Math.round((credit.montantPaye / credit.montant) * 100)}%</span>
                            </div>
                            <div className="payment-progress-bar">
                              <div
                                className="payment-progress-fill"
                                style={{ width: `${(credit.montantPaye / credit.montant) * 100}%` }}
                              ></div>
                            </div>
                            <div className="payment-progress-details">
                              <span>Payé: {formatCurrency(credit.montantPaye || 0)}</span>
                              <span>Restant: {formatCurrency(credit.montant - (credit.montantPaye || 0))}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={`credit-application-status status-${credit.status}`}>
                        {renderCreditStatus(credit.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Aucune demande de crédit en cours</p>
                )}

                <h3 className="section-title">Nouvelle demande</h3>
                <div className="credit-form-container">
                  <div className="form-group">
                    <IonSelect
                      interface="popover"
                      placeholder="Type de crédit"
                      value={typeCreditValue}
                      onIonChange={(e) => setTypeCreditValue(e.detail.value)}
                      className="credit-select"
                    >
                      <IonSelectOption value="Auto">Crédit Auto</IonSelectOption>
                      <IonSelectOption value="Immobilier">Crédit Immobilier</IonSelectOption>
                      <IonSelectOption value="Études">Crédit Études</IonSelectOption>
                      <IonSelectOption value="Liquidité">Crédit Liquidité</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="form-group">
                    <IonInput
                      type="number"
                      placeholder="Montant en TND"
                      min="1000"
                      value={montantValue}
                      onIonChange={(e) => setMontantValue(Number(e.detail.value!))}
                      className="credit-input"
                    />
                  </div>

                  <div className="form-group">
                    <IonSelect
                      interface="popover"
                      placeholder="Durée"
                      value={dureeValue}
                      onIonChange={(e) => setDureeValue(String(e.detail.value))}
                      className="credit-select"
                    >
                      <IonSelectOption value="12">12 mois</IonSelectOption>
                      <IonSelectOption value="24">24 mois</IonSelectOption>
                      <IonSelectOption value="36">36 mois</IonSelectOption>
                      <IonSelectOption value="48">48 mois</IonSelectOption>
                      <IonSelectOption value="60">60 mois</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="form-group">
                    <IonInput
                      type="number"
                      placeholder="Revenus mensuels en TND"
                      value={RevenuMensuel}
                      onIonChange={(e) => setRevenuMensuel(Number(e.detail.value!))}
                      className="credit-input"
                    />
                  </div>

                  <div className="form-group">
                    <IonTextarea placeholder="Objet de votre demande" rows={3} className="credit-textarea" />
                  </div>

                  <IonButton
                    expand="block"
                    onClick={handleSubmitCredit}
                    disabled={isSubmitting}
                    className="submit-credit-button"
                  >
                    {isSubmitting ? "Traitement..." : "Soumettre ma demande"}
                  </IonButton>
                </div>

                <h3 className="section-title">Simulateur de crédit</h3>
                <div className="simulator-container">
                  <div className="form-group">
                    <IonInput type="number" placeholder="Montant en TND" value="" className="simulator-input" />
                  </div>

                  <div className="form-group">
                    <IonInput
                      type="number"
                      placeholder="Taux d'intérêt annuel (%)"
                      value=""
                      className="simulator-input"
                    />
                  </div>

                  <div className="form-group">
                    <IonInput type="number" placeholder="Durée (en mois)" value="" className="simulator-input" />
                  </div>

                  <IonButton expand="block" className="calculate-button">
                    Calculer
                  </IonButton>

                  <div className="simulator-results">
                    <div className="result-item">
                      <div className="result-label">Mensualité estimée</div>
                      <div className="result-value">{formatCurrency(310.76)}</div>
                    </div>

                    <div className="result-item">
                      <div className="result-label">Coût total du crédit</div>
                      <div className="result-value">{formatCurrency(11187.36)}</div>
                    </div>

                    <div className="result-item">
                      <div className="result-label">Montant total à rembourser</div>
                      <div className="result-value">{formatCurrency(11187.36)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </IonContent>
      <NavMobile currentPage="compte" />
    </IonPage>
  )
}

export default CompteMobile
