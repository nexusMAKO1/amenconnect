"use client"
import type React from "react"
import { useMemo, useState, useEffect } from "react"
import {
  IonContent,
  IonPage,
  IonIcon,
  IonRippleEffect,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonTextarea,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  useIonToast,
} from "@ionic/react"
import {
  walletOutline,
  trendingUpOutline,
  trendingDownOutline,
  printOutline,
  analyticsOutline,
  timeOutline,
  cardOutline,
} from "ionicons/icons"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { useHistory } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import NavbarKiosk from "../../components/NavbarKiosk"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import "./CompteKiosk.css"

// Local interface for our operations – note that reference is required
interface Operation {
  _id: string
  date: string
  amount: number
  description: string
  type: "credit" | "debit"
  reference: string
}

// Local interface for the Account displayed in this component
interface Account {
  _id: string
  numéroCompte: string
  solde: number
  type: string
  // historique is an array of operations
  historique: Operation[]
}

/*
Assume that the AuthContext provides accounts of type Compte with the following shape:
interface Compte {
  _id: string;
  numéroCompte: string;
  solde: number;
  type: string;
  historique?: Transaction[]; // where Transaction.reference is string | undefined
}
interface Transaction {
  _id: string;
  date: string;
  amount: number;
  description: string;
  type: "credit" | "debit";
  reference?: string;
}
*/

const CompteKiosk: React.FC = () => {
  const { profile, authLoading } = useAuth()
  const history = useHistory()
  const [presentToast] = useIonToast()
  const [activeTab, setActiveTab] = useState<string>("overview")

  // Credit state variables
  const [typeCreditValue, setTypeCreditValue] = useState<string>("")
  const [montantValue, setMontantValue] = useState<number>()
  const [RevenuMensuel, setRevenuMensuel] = useState<number>(0)
  const [dureeValue, setDureeValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userCredits, setUserCredits] = useState<any[]>([])
  const [creditDetails, setCreditDetails] = useState<any>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [showCreditSection, setShowCreditSection] = useState<boolean>(false)
  const [showSimulatorSection, setShowSimulatorSection] = useState<boolean>(false)
  const [simulatorAmount, setSimulatorAmount] = useState<number>(10000)
  const [simulatorRate, setSimulatorRate] = useState<number>(7.5)
  const [simulatorDuration, setSimulatorDuration] = useState<number>(36)
  const [simulatorResults, setSimulatorResults] = useState<{
    monthly: number
    totalCost: number
    totalAmount: number
  }>({ monthly: 310.76, totalCost: 1187.36, totalAmount: 11187.36 })
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  // Convert profile.comptes (of type Compte[]) into our local Account[] type
  const accounts: Account[] = (profile?.comptes ?? []).map((compte) => ({
    _id: compte._id,
    numéroCompte: compte.numéroCompte,
    solde: compte.solde,
    type: compte.type,
    // Convert historique to ensure each operation has a defined 'reference'
    historique: (compte.historique ?? []).map((tx) => ({
      ...tx,
      reference: tx.reference ?? "",
    })),
  }))

  useEffect(() => {
    if (accounts.length > 0) {
      setSelectedAccount(accounts[0]._id)
    }
  }, [accounts])

  // Derive all operations by merging historique arrays from all accounts and sort them descending by date
  const operations: Operation[] = useMemo(() => {
    const allOps = accounts.reduce(
      (acc: Operation[], account: Account) => [...acc, ...account.historique],
      [] as Operation[],
    )
    return allOps.sort((a: Operation, b: Operation) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
  }, [accounts])

  // Chart data grouped by month-year
  const chartData = useMemo(() => {
    const grouped = operations.reduce(
      (acc, op) => {
        const date = new Date(op.date)
        const month = date.toLocaleString("default", { month: "short" })
        const year = date.getFullYear()
        const key = `${month}-${year}`

        if (!acc[key]) {
          acc[key] = {
            name: `${month} ${year}`,
            revenus: 0,
            depenses: 0,
          }
        }

        if (op.type === "credit") {
          acc[key].revenus += op.amount
        } else {
          acc[key].depenses += op.amount
        }

        return acc
      },
      {} as Record<string, { name: string; revenus: number; depenses: number }>,
    )

    return Object.values(grouped).sort((a, b) => {
      const [aMonth, aYear] = a.name.split(" ")
      const [bMonth, bYear] = b.name.split(" ")
      return new Date(`${aMonth} 1 ${aYear}`).getTime() - new Date(`${bMonth} 1 ${bYear}`).getTime()
    })
  }, [operations])

  const handleAccountClick = (accountId: string) => {
    history.push(`/Compte/${accountId}`)
  }

  const generateBankStatement = async () => {
    // Use the first account as the basis for the statement
    const account = accounts[0] || {
      _id: "N/A",
      numéroCompte: "N/A",
      solde: 0,
      type: "Compte courant",
      historique: [],
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // Header
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("Relevé Bancaire", 105, 20, { align: "center" })

    // Account Information
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.text(`Titulaire: ${profile?.user.prenom} ${profile?.user.nom}`, 20, 40)
    doc.text(`Compte: ${account.numéroCompte}`, 20, 48)
    doc.text(`Solde: ${account.solde.toFixed(2)} TND`, 20, 56)

    // Transactions Table
    autoTable(doc, {
      head: [["Date", "Description", "Type", "Montant", "Référence"]],
      body: operations.map((op) => [
        new Date(op.date).toLocaleDateString(),
        op.description,
        op.type === "credit" ? "Crédit" : "Débit",
        `${op.amount.toFixed(2)} TND`,
        op.reference,
      ]),
      startY: 65,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 12,
      },
      styles: { fontSize: 10 },
    })

    // Footer with page numbers
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(10)
      doc.text(`Page ${i}/${pageCount}`, 190, doc.internal.pageSize.getHeight() - 10, { align: "right" })
    }

    doc.save(`releve_${account.numéroCompte}.pdf`)
  }

  // Credit functionality
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

  const renderCreditStatus = (status: string) => {
    switch (status) {
      case "approved":
        return "Approuvé"
      case "rejected":
        return "Refusé"
      default:
        return "En attente"
    }
  }

  const handleSubmitCredit = async () => {
    if (!typeCreditValue || !montantValue || !dureeValue || !RevenuMensuel) {
      presentToast({
        message: "Tous les champs sont obligatoires.",
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
          compteId: selectedAccount,
          RevenuMensuel: RevenuMensuel,
        }),
      })

      if (!resp.ok) throw new Error("Erreur serveur")
      await fetchUserCredits()

      setTypeCreditValue("")
      setMontantValue(0)
      setDureeValue("")
      setRevenuMensuel(0)
      setShowCreditSection(false)
      presentToast({
        message: "Demande de crédit soumise avec succès.",
        duration: 3000,
        position: "top",
        color: "success",
      })
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

  const calculateLoan = () => {
    // Monthly interest rate
    const monthlyRate = simulatorRate / 100 / 12
    // Calculate monthly payment
    const x = Math.pow(1 + monthlyRate, simulatorDuration)
    const monthly = (simulatorAmount * x * monthlyRate) / (x - 1)
    // Total amount to pay
    const totalAmount = monthly * simulatorDuration
    // Total cost of credit
    const totalCost = totalAmount - simulatorAmount

    setSimulatorResults({
      monthly,
      totalCost,
      totalAmount,
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
  }

  const formatCurrency = (number: number) => {
    return number.toLocaleString("fr-FR", { style: "currency", currency: "TND" })
  }

  if (authLoading) {
    return <div className="compte-kiosk-loading">Chargement...</div>
  }

  return (
    <IonPage>
      <NavbarKiosk currentPage="compte" />
      <IonContent fullscreen>
        <div className="compte-kiosk-container">
          <div className="background-white"></div>
          <svg className="background-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 983 1920" fill="none">
            {/* SVG content goes here */}
          </svg>

          <div className="compte-kiosk-content">
            <div className="compte-kiosk-header">
              <h1 className="compte-kiosk-title">Mes Comptes</h1>
              <p className="compte-kiosk-subtitle">Gérez vos comptes et suivez vos finances</p>
            </div>

            <div className="compte-kiosk-accounts-list">
              {accounts.map((account) => (
                <div
                  key={account._id}
                  className="compte-kiosk-account-card"
                  onClick={() => handleAccountClick(account._id)}
                >
                  <IonRippleEffect />
                  <div className="compte-kiosk-account-icon">
                    <IonIcon icon={account.type === "Compte courant" ? walletOutline : trendingUpOutline} />
                  </div>
                  <div className="compte-kiosk-account-details">
                    <div className="compte-kiosk-account-type">{account.type}</div>
                    <div className="compte-kiosk-account-number">{account.numéroCompte}</div>
                  </div>
                  <div className="compte-kiosk-account-balance">{account.solde.toFixed(2)} TND</div>
                </div>
              ))}
            </div>

            <div className="compte-kiosk-tabs">
              <IonSegment value={activeTab} onIonChange={(e) => setActiveTab(String(e.detail.value))}>
                <IonSegmentButton value="overview">
                  <IonIcon icon={walletOutline} />
                  <IonLabel>Aperçu</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="operations">
                  <IonIcon icon={timeOutline} />
                  <IonLabel>Opérations</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="credit">
                  <IonIcon icon={cardOutline} />
                  <IonLabel>Crédit</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>

            {activeTab === "overview" && (
              <>
                <div className="compte-kiosk-section compte-kiosk-statement-section">
                  <IonButton onClick={generateBankStatement}>
                    <IonIcon icon={printOutline} slot="start" />
                    Générer le relevé
                  </IonButton>
                </div>

                <div className="compte-kiosk-section compte-kiosk-chart-section">
                  <div className="compte-kiosk-section-header">
                    <h2 className="compte-kiosk-section-title">Activité Financière</h2>
                  </div>
                  <div className="compte-kiosk-chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F44336" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="revenus" stroke="#4CAF50" fill="url(#colorRevenus)" />
                        <Area type="monotone" dataKey="depenses" stroke="#F44336" fill="url(#colorDepenses)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {activeTab === "operations" && (
              <div className="compte-kiosk-section compte-kiosk-operations-section">
                <div className="compte-kiosk-section-header">
                  <h2 className="compte-kiosk-section-title">Historique des Opérations</h2>
                  <div className="compte-kiosk-update-date">
                    Dernière mise à jour: {new Date().toLocaleDateString()}
                  </div>
                </div>
                <div className="compte-kiosk-operations-list">
                  {operations.length > 0 ? (
                    operations.map((op) => (
                      <div key={op._id} className="compte-kiosk-operation-item">
                        <IonRippleEffect />
                        <div className="compte-kiosk-operation-icon">
                          <IonIcon icon={op.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                        </div>
                        <div className="compte-kiosk-operation-details">
                          <div className="compte-kiosk-operation-description">{op.description}</div>
                          <div className="compte-kiosk-operation-date">{new Date(op.date).toLocaleDateString()}</div>
                          <div className="compte-kiosk-operation-reference">Référence: {op.reference}</div>
                        </div>
                        <div className={`compte-kiosk-operation-amount ${op.type}`}>
                          {op.type === "credit" ? "+" : "-"} {op.amount.toFixed(2)} TND
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-operations">Aucune opération disponible</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "credit" && (
              <>
                <div className="compte-kiosk-section compte-kiosk-actions-section">
                  <div className="compte-kiosk-section-header">
                    <h2 className="compte-kiosk-section-title">Services de Crédit</h2>
                  </div>
                  <div className="compte-kiosk-actions-grid">
                    <IonButton
                      className="compte-kiosk-action-button"
                      onClick={() => setShowCreditSection(!showCreditSection)}
                    >
                      <div className="compte-kiosk-action-content">
                        <IonIcon icon={walletOutline} />
                        <span>Demande de Crédit</span>
                      </div>
                    </IonButton>
                    <IonButton
                      className="compte-kiosk-action-button"
                      onClick={() => setShowSimulatorSection(!showSimulatorSection)}
                    >
                      <div className="compte-kiosk-action-content">
                        <IonIcon icon={analyticsOutline} />
                        <span>Simulateur</span>
                      </div>
                    </IonButton>
                  </div>
                </div>

                {showCreditSection && (
                  <div className="compte-kiosk-section compte-kiosk-credit-section">
                    <div className="compte-kiosk-section-header">
                      <h2 className="compte-kiosk-section-title">Demande de Crédit</h2>
                    </div>
                    <div className="compte-kiosk-credit-form">
                      <div className="form-group">
                        <label>Type de crédit</label>
                        <IonSelect
                          interface="popover"
                          placeholder="Sélectionner un type"
                          value={typeCreditValue}
                          onIonChange={(e) => setTypeCreditValue(e.detail.value)}
                        >
                          <IonSelectOption value="Auto">Crédit Auto</IonSelectOption>
                          <IonSelectOption value="Immobilier">Crédit Immobilier</IonSelectOption>
                          <IonSelectOption value="Études">Crédit Études</IonSelectOption>
                          <IonSelectOption value="Liquidité">Crédit Liquidité</IonSelectOption>
                        </IonSelect>
                      </div>

                      <div className="form-group">
                        <label>Montant</label>
                        <IonInput
                          type="number"
                          placeholder="Montant en TND"
                          min="1000"
                          value={montantValue}
                          onIonChange={(e) => setMontantValue(Number(e.detail.value!))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Durée</label>
                        <IonSelect
                          interface="popover"
                          placeholder="Sélectionner une durée"
                          value={dureeValue}
                          onIonChange={(e) => setDureeValue(String(e.detail.value))}
                        >
                          <IonSelectOption value="12">12 mois</IonSelectOption>
                          <IonSelectOption value="24">24 mois</IonSelectOption>
                          <IonSelectOption value="36">36 mois</IonSelectOption>
                          <IonSelectOption value="48">48 mois</IonSelectOption>
                          <IonSelectOption value="60">60 mois</IonSelectOption>
                        </IonSelect>
                      </div>

                      <div className="form-group">
                        <label>Revenus mensuels</label>
                        <IonInput
                          type="number"
                          placeholder="Revenus en TND"
                          value={RevenuMensuel}
                          onIonChange={(e) => setRevenuMensuel(Number(e.detail.value!))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Objet du crédit</label>
                        <IonTextarea placeholder="Décrivez l'objet de votre demande de crédit" rows={4} />
                      </div>

                      <div className="form-actions">
                        <IonButton
                          expand="block"
                          className="submit-button"
                          onClick={handleSubmitCredit}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Traitement..." : "Soumettre ma demande"}
                        </IonButton>
                      </div>
                    </div>
                  </div>
                )}

                {showSimulatorSection && (
                  <div className="compte-kiosk-section compte-kiosk-simulator-section">
                    <div className="compte-kiosk-section-header">
                      <h2 className="compte-kiosk-section-title">Simulateur de Crédit</h2>
                    </div>
                    <div className="compte-kiosk-simulator-form">
                      <div className="form-group">
                        <label>Montant du crédit</label>
                        <IonInput
                          type="number"
                          placeholder="Montant en TND"
                          value={simulatorAmount}
                          onIonChange={(e) => setSimulatorAmount(Number(e.detail.value!))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Taux d'intérêt annuel (%)</label>
                        <IonInput
                          type="number"
                          placeholder="Taux en %"
                          value={simulatorRate}
                          onIonChange={(e) => setSimulatorRate(Number(e.detail.value!))}
                        />
                      </div>

                      <div className="form-group">
                        <label>Durée (en mois)</label>
                        <IonInput
                          type="number"
                          placeholder="Durée en mois"
                          value={simulatorDuration}
                          onIonChange={(e) => setSimulatorDuration(Number(e.detail.value!))}
                        />
                      </div>

                      <IonButton expand="block" className="calculate-button" onClick={calculateLoan}>
                        Calculer
                      </IonButton>
                    </div>

                    <div className="compte-kiosk-simulator-results">
                      <div className="result-item">
                        <div className="result-label">Mensualité estimée</div>
                        <div className="result-value">{formatCurrency(simulatorResults.monthly)}</div>
                      </div>

                      <div className="result-item">
                        <div className="result-label">Coût total du crédit</div>
                        <div className="result-value">{formatCurrency(simulatorResults.totalCost)}</div>
                      </div>

                      <div className="result-item">
                        <div className="result-label">Montant total à rembourser</div>
                        <div className="result-value">{formatCurrency(simulatorResults.totalAmount)}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="compte-kiosk-section compte-kiosk-credit-status-section">
                  <div className="compte-kiosk-section-header">
                    <h2 className="compte-kiosk-section-title">Mes demandes de crédit</h2>
                  </div>
                  {loadingCredits ? (
                    <div className="loading-message">Chargement des crédits...</div>
                  ) : userCredits.length > 0 ? (
                    <div className="compte-kiosk-credit-list">
                      {userCredits.map((credit) => (
                        <div key={credit._id} className="compte-kiosk-credit-item">
                          <IonRippleEffect />
                          <div className="compte-kiosk-credit-icon">
                            <IonIcon icon={walletOutline} />
                          </div>
                          <div className="compte-kiosk-credit-details">
                            <div className="compte-kiosk-credit-title">{credit.type}</div>
                            <div className="compte-kiosk-credit-meta">
                              <span className="compte-kiosk-credit-date">
                                Demande du {formatDate(credit.createdAt)}
                              </span>
                              <span className="compte-kiosk-credit-amount">{formatCurrency(credit.montant)}</span>
                              <span className="compte-kiosk-credit-duree">Durée: {credit.duree} mois</span>
                            </div>

                            {/* Payment Progress Bar for Approved Credits */}
                            {credit.status === "approved" && (
                              <div className="payment-progress-container">
                                <div className="payment-progress-header">
                                  <span>Progression des paiements</span>
                                  <span>{Math.round((credit.montantPaye / credit.montant) * 100)}%</span>
                                </div>
                                <div className="payment-progress-bar">
                                  <div
                                    className="payment-progress-fill"
                                    style={{ width: `${(credit.montantPaye / credit.montant) * 100}%` }}
                                  ></div>
                                </div>
                                <div className="payment-progress-details">
                                  <span>Payé: {formatCurrency(credit.montantPaye)}</span>
                                  <span>Restant: {formatCurrency(credit.montant - credit.montantPaye)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`compte-kiosk-credit-status status-${credit.status}`}>
                            {renderCreditStatus(credit.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data-message">Aucune demande de crédit en cours</div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default CompteKiosk
