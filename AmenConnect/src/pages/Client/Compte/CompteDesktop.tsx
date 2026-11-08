"use client"
import type React from "react"
import { useState, useEffect } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonAvatar,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  IonTextarea,
  IonRange,
  useIonToast,
} from "@ionic/react"
import {
  walletOutline,
  cardOutline,
  analyticsOutline,
  trendingUpOutline,
  trendingDownOutline,
  downloadOutline,
  filterOutline,
  closeOutline,
  personOutline,
  mailOutline,
  callOutline,
  businessOutline,
  locationOutline,
  documentTextOutline,
  eyeOutline,
  eyeOffOutline,
  refreshOutline,
  checkmarkCircleOutline,
  warningOutline,
} from "ionicons/icons"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import Navbar from "../../../components/Navbar"
import "./CompteDesktop.css"
import { useAuth, type Transaction } from "../../../AuthContext"
import LoadingProgressBar from "../../../components/LoadingProgressBar"

interface BudgetCategory {
  userId: string
  id: string
  name: string
  limit: number
  color: string
  current: number
  _id: string
  __v: number
  createdAt: Date
  updatedAt: Date
}

interface SimulationResults {
  mensualite: number
  coutTotal: number
  montantTotal: number
  tauxEndettement: number
}

const ComptePageDesktop: React.FC = () => {
  const [presentToast] = useIonToast()
  const { profile, authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchText, setSearchText] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("all")
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false)
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // États pour les demandes de crédit
  const [typeCreditValue, setTypeCreditValue] = useState<string>("")
  const [montantValue, setMontantValue] = useState<number>()
  const [RevenuMensuel, setRevenuMensuel] = useState<number>(0)
  const [dureeValue, setDureeValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [userCredits, setUserCredits] = useState<any[]>([])
  const [creditDetails, setCreditDetails] = useState<any>(null)
  const [loadingCredits, setLoadingCredits] = useState(true)
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([])
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false)

  // États pour le simulateur de crédit interactif
  const [simulatorMontant, setSimulatorMontant] = useState<number>(10000)
  const [simulatorTaux, setSimulatorTaux] = useState<number>(7.5)
  const [simulatorDuree, setSimulatorDuree] = useState<number>(36)
  const [simulatorRevenu, setSimulatorRevenu] = useState<number>(2000)
  const [simulatorResults, setSimulatorResults] = useState<SimulationResults>({
    mensualite: 0,
    coutTotal: 0,
    montantTotal: 0,
    tauxEndettement: 0,
  })
  const [showAmortissement, setShowAmortissement] = useState<boolean>(false)

  // Fetch budget categories
  useEffect(() => {
    const fetchBudgetCategories = async () => {
      if (!profile?.user._id) return
      try {
        const response = await fetch(`/api/categories?userId=${profile.user._id}`)
        if (!response.ok) throw new Error("Error fetching budget categories")
        const data = await response.json()
        setBudgetCategories(data.map((cat: any) => ({ ...cat, id: cat._id })))
      } catch (error) {
        console.error(error)
      }
    }
    fetchBudgetCategories()
  }, [profile])

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

  // Calcul automatique du simulateur
  useEffect(() => {
    const results = calculateCredit(simulatorMontant, simulatorTaux, simulatorDuree, simulatorRevenu)
    setSimulatorResults(results)
  }, [simulatorMontant, simulatorTaux, simulatorDuree, simulatorRevenu])

  // Fonction de calcul du crédit
  const calculateCredit = (montant: number, taux: number, duree: number, revenu: number): SimulationResults => {
    if (montant <= 0 || taux <= 0 || duree <= 0) {
      return { mensualite: 0, coutTotal: 0, montantTotal: 0, tauxEndettement: 0 }
    }

    const tauxMensuel = taux / 100 / 12
    const mensualite =
      (montant * tauxMensuel * Math.pow(1 + tauxMensuel, duree)) / (Math.pow(1 + tauxMensuel, duree) - 1)
    const montantTotal = mensualite * duree
    const coutTotal = montantTotal - montant
    const tauxEndettement = revenu > 0 ? (mensualite / revenu) * 100 : 0

    return {
      mensualite: isNaN(mensualite) ? 0 : mensualite,
      coutTotal: isNaN(coutTotal) ? 0 : coutTotal,
      montantTotal: isNaN(montantTotal) ? 0 : montantTotal,
      tauxEndettement: isNaN(tauxEndettement) ? 0 : tauxEndettement,
    }
  }

  // Générer le tableau d'amortissement (12 premiers mois)
  const generateAmortissement = () => {
    const tauxMensuel = simulatorTaux / 100 / 12
    const mensualite = simulatorResults.mensualite
    let capitalRestant = simulatorMontant
    const amortissement = []

    for (let mois = 1; mois <= Math.min(12, simulatorDuree); mois++) {
      const interets = capitalRestant * tauxMensuel
      const capital = mensualite - interets
      capitalRestant -= capital

      amortissement.push({
        mois,
        mensualite,
        capital: capital,
        interets,
        capitalRestant: Math.max(0, capitalRestant),
      })
    }

    return amortissement
  }

  // Générer données pour le graphique de comparaison
  const generateComparisonData = () => {
    const durees = [12, 24, 36, 48, 60]
    return durees.map((duree) => {
      const result = calculateCredit(simulatorMontant, simulatorTaux, duree, simulatorRevenu)
      return {
        duree: `${duree} mois`,
        mensualite: result.mensualite,
        coutTotal: result.coutTotal,
      }
    })
  }

  // Update the credit status display logic
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

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
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

  // Initialize with the first account when profile loads
  useEffect(() => {
    if (profile && profile.comptes && profile.comptes.length > 0) {
      setSelectedAccount(profile.comptes[0]._id)
      setIsLoading(false)
    }
  }, [profile])

  // Update transactions when selected account changes
  useEffect(() => {
    if (profile && selectedAccount) {
      const account = profile.comptes.find((compte) => compte._id === selectedAccount)
      if (account && account.historique) {
        setTransactions(account.historique)
        setFilteredTransactions(account.historique)
      } else {
        setTransactions([])
        setFilteredTransactions([])
      }
    }
  }, [selectedAccount, profile])

  // Filter transactions based on search text, filter type, and date range
  useEffect(() => {
    if (!transactions.length) return

    let filtered = [...transactions]

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (tx) =>
          tx.description.toLowerCase().includes(searchText.toLowerCase()) ||
          (tx.beneficiary && tx.beneficiary.toLowerCase().includes(searchText.toLowerCase())),
      )
    }

    // Filter by transaction type
    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType)
    }

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date()
      let startDate: Date

      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7))
          break
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1))
          break
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1))
          break
        default:
          startDate = new Date(0) // Beginning of time
      }

      filtered = filtered.filter((tx) => new Date(tx.date) >= startDate)
    }

    setFilteredTransactions(filtered)
  }, [searchText, filterType, dateRange, transactions])

  // Get the selected account details
  const getSelectedAccount = () => {
    if (!profile || !selectedAccount) return null
    return profile.comptes.find((compte) => compte._id === selectedAccount)
  }

  // Get the card associated with the selected account
  const getAssociatedCard = () => {
    if (!profile || !selectedAccount) return null
    return profile.cartes.find((carte) => carte.comptesId === selectedAccount)
  }

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
          compteId: selectedAccount,
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

  // Fonction pour utiliser les paramètres du simulateur dans la demande
  const useSimulatorParams = () => {
    setTypeCreditValue("Simulation")
    setMontantValue(simulatorMontant)
    setDureeValue(simulatorDuree.toString())
    setRevenuMensuel(simulatorRevenu)
  }

  // Fonction pour réinitialiser le simulateur
  const resetSimulator = () => {
    setSimulatorMontant(10000)
    setSimulatorTaux(7.5)
    setSimulatorDuree(36)
    setSimulatorRevenu(2000)
  }

  if (authLoading || isLoading) {
    return (
      <IonPage>
        <LoadingProgressBar />
      </IonPage>
    )
  }

  // Calculate income, expenses, and balance for the selected account
  const getAccountStats = () => {
    if (!transactions.length) return { income: 0, expenses: 0, balance: getSelectedAccount()?.solde || 0 }

    const income = transactions.filter((tx) => tx.type === "credit").reduce((sum, tx) => sum + tx.amount, 0)
    const expenses = transactions.filter((tx) => tx.type === "debit").reduce((sum, tx) => sum + tx.amount, 0)

    return {
      income,
      expenses,
      balance: getSelectedAccount()?.solde || 0,
    }
  }

  // Generate chart data for the selected account
  const getChartData = () => {
    if (!transactions.length) return []

    const monthlyData: Record<string, { month: string; income: number; expenses: number }> = {}

    transactions.forEach((tx) => {
      const date = new Date(tx.date)
      const month = date.toLocaleString("default", { month: "short" })

      if (!monthlyData[month]) {
        monthlyData[month] = { month, income: 0, expenses: 0 }
      }

      if (tx.type === "credit") {
        monthlyData[month].income += tx.amount
      } else {
        monthlyData[month].expenses += tx.amount
      }
    })

    return Object.values(monthlyData)
  }

  // Generate category data for pie chart
  const getCategoryData = () => {
    if (!transactions.length) return []

    const categories: Record<string, number> = {
      Alimentation: 0,
      Transport: 0,
      Logement: 0,
      Loisirs: 0,
      Santé: 0,
      Autres: 0,
    }

    // Simulate categories based on transaction descriptions
    transactions.forEach((tx) => {
      if (tx.type === "debit") {
        const desc = tx.description.toLowerCase()
        if (desc.includes("restaurant") || desc.includes("marché") || desc.includes("supermarché")) {
          categories["Alimentation"] += tx.amount
        } else if (desc.includes("transport") || desc.includes("taxi") || desc.includes("essence")) {
          categories["Transport"] += tx.amount
        } else if (desc.includes("loyer") || desc.includes("électricité") || desc.includes("eau")) {
          categories["Logement"] += tx.amount
        } else if (desc.includes("cinéma") || desc.includes("concert") || desc.includes("voyage")) {
          categories["Loisirs"] += tx.amount
        } else if (desc.includes("pharmacie") || desc.includes("médecin") || desc.includes("hôpital")) {
          categories["Santé"] += tx.amount
        } else {
          categories["Autres"] += tx.amount
        }
      }
    })

    return Object.entries(categories).map(([name, value]) => ({ name, value }))
  }

  // Handle account selection
  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId)
  }

  // Toggle balance visibility
  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible)
  }

  // Reset filters
  const resetFilters = () => {
    setSearchText("")
    setFilterType("all")
    setDateRange("all")
    setIsFilterModalOpen(false)
  }

  const categoryData = budgetCategories.map((cat) => ({ name: cat.name, value: cat.current, color: cat.color }))
  const account = getSelectedAccount()
  const card = getAssociatedCard()
  const stats = getAccountStats()
  const chartData = getChartData()
  const amortissementData = generateAmortissement()
  const comparisonData = generateComparisonData()

  return (
    <IonPage>
      <IonHeader>
        <Navbar currentPage="compte" />
      </IonHeader>
      <IonContent className="ion-padding compte-page-custom-content">
        <div className="compte-page-container">
          <div className="compte-page-header">
            <h1 className="page-title">Mon Compte</h1>
            <div className="account-selector">
              <IonSelect
                interface="popover"
                value={selectedAccount}
                onIonChange={(e) => handleAccountChange(e.detail.value)}
                className="account-select"
              >
                {profile?.comptes.map((compte) => (
                  <IonSelectOption key={compte._id} value={compte._id}>
                    {compte.type} - {compte.numéroCompte}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </div>
          </div>

          <div className="compte-page-tabs">
            <IonButton
              fill={activeTab === "overview" ? "solid" : "clear"}
              onClick={() => setActiveTab("overview")}
              className="tab-button"
            >
              Vue d'ensemble
            </IonButton>
            <IonButton
              fill={activeTab === "transactions" ? "solid" : "clear"}
              onClick={() => setActiveTab("transactions")}
              className="tab-button"
            >
              Transactions
            </IonButton>
            <IonButton
              fill={activeTab === "analytics" ? "solid" : "clear"}
              onClick={() => setActiveTab("analytics")}
              className="tab-button"
            >
              Analyses
            </IonButton>
            <IonButton
              fill={activeTab === "details" ? "solid" : "clear"}
              onClick={() => setActiveTab("details")}
              className="tab-button"
            >
              Détails
            </IonButton>
            <IonButton
              fill={activeTab === "credit" ? "solid" : "clear"}
              onClick={() => setActiveTab("credit")}
              className="tab-button"
            >
              Suivi & Demande de crédit
            </IonButton>
          </div>

          {activeTab === "overview" && (
            <div className="compte-page-overview">
              <div className="compte-page-grid">
                <IonCard className="balance-card">
                  <IonCardHeader>Solde Actuel</IonCardHeader>
                  <IonCardContent>
                    <div className="balance-container">
                      <div className="balance-amount">
                        {isBalanceVisible ? formatCurrency(stats.balance) : "••••••••"}
                        <IonButton fill="clear" onClick={toggleBalanceVisibility} className="visibility-toggle">
                          <IonIcon icon={isBalanceVisible ? eyeOffOutline : eyeOutline} />
                        </IonButton>
                      </div>
                      <div className="account-number">{account?.numéroCompte}</div>
                      <div className="account-type">{account?.type}</div>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="stats-card">
                  <IonCardHeader>Aperçu Financier</IonCardHeader>
                  <IonCardContent>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <div className="stat-icon income">
                          <IonIcon icon={trendingUpOutline} />
                        </div>
                        <div className="stat-details">
                          <div className="stat-label">Revenus</div>
                          <div className="stat-value income">{formatCurrency(stats.income)}</div>
                        </div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-icon expense">
                          <IonIcon icon={trendingDownOutline} />
                        </div>
                        <div className="stat-details">
                          <div className="stat-label">Dépenses</div>
                          <div className="stat-value expense">{formatCurrency(stats.expenses)}</div>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="chart-card">
                  <IonCardHeader>Évolution Mensuelle</IonCardHeader>
                  <IonCardContent>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#47ce65" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#47ce65" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff2b2b" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#ff2b2b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                          <XAxis dataKey="month" stroke="rgba(255, 255, 255, 0.5)" />
                          <YAxis stroke="rgba(255, 255, 255, 0.5)" />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(30, 30, 30, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="income"
                            stroke="#47ce65"
                            fillOpacity={1}
                            fill="url(#colorIncome)"
                            name="Revenus"
                          />
                          <Area
                            type="monotone"
                            dataKey="expenses"
                            stroke="#ff2b2b"
                            fillOpacity={1}
                            fill="url(#colorExpenses)"
                            name="Dépenses"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="recent-transactions-card">
                  <IonCardHeader>
                    <div className="card-header-with-action">
                      <span>Transactions Récentes</span>
                      <IonButton fill="clear" size="small" onClick={() => setActiveTab("transactions")}>
                        Voir tout
                      </IonButton>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <div className="recent-transactions-list">
                      {transactions.slice(0, 5).map((tx) => (
                        <div key={tx._id} className="transaction-item">
                          <div className="transaction-icon">
                            <IonIcon icon={tx.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-description">{tx.description}</div>
                            <div className="transaction-date">{formatDate(tx.date)}</div>
                          </div>
                          <div className={`transaction-amount ${tx.type}`}>
                            {tx.type === "credit" ? "+" : "-"} {formatCurrency(tx.amount)}
                          </div>
                        </div>
                      ))}
                      {transactions.length === 0 && <div className="no-data-message">Aucune transaction récente</div>}
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="quick-actions-card">
                  <IonCardHeader>Actions Rapides</IonCardHeader>
                  <IonCardContent>
                    <div className="quick-actions-grid">
                      <IonButton className="action-button">
                        <IonIcon slot="start" icon={walletOutline} />
                        Virement
                      </IonButton>
                      <IonButton className="action-button">
                        <IonIcon slot="start" icon={downloadOutline} />
                        Relevé
                      </IonButton>
                      <IonButton className="action-button">
                        <IonIcon slot="start" icon={cardOutline} />
                        Carte
                      </IonButton>
                      <IonButton className="action-button">
                        <IonIcon slot="start" icon={analyticsOutline} />
                        Budget
                      </IonButton>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="compte-page-transactions">
              <div className="transactions-header">
                <IonSearchbar
                  value={searchText}
                  onIonChange={(e) => setSearchText(e.detail.value!)}
                  placeholder="Rechercher une transaction"
                  className="transaction-search"
                />
                <IonButton onClick={() => setIsFilterModalOpen(true)} className="filter-button">
                  <IonIcon slot="start" icon={filterOutline} />
                  Filtrer
                </IonButton>
              </div>

              <IonCard className="transactions-card">
                <IonCardContent>
                  <div className="transactions-list">
                    {filteredTransactions.length > 0 ? (
                      filteredTransactions.map((tx) => (
                        <div key={tx._id} className="transaction-item">
                          <div className="transaction-icon">
                            <IonIcon icon={tx.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-description">{tx.description}</div>
                            <div className="transaction-meta">
                              <span className="transaction-date">{formatDate(tx.date)}</span>
                              {tx.reference && <span className="transaction-reference">Réf: {tx.reference}</span>}
                              {tx.beneficiary && (
                                <span className="transaction-beneficiary">Bénéficiaire: {tx.beneficiary}</span>
                              )}
                            </div>
                          </div>
                          <div className={`transaction-amount ${tx.type}`}>
                            {tx.type === "credit" ? "+" : "-"} {formatCurrency(tx.amount)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-data-message">
                        {searchText || filterType !== "all" || dateRange !== "all"
                          ? "Aucune transaction ne correspond à vos critères de recherche"
                          : "Aucune transaction disponible"}
                      </div>
                    )}
                  </div>
                </IonCardContent>
              </IonCard>

              <IonModal
                isOpen={isFilterModalOpen}
                onDidDismiss={() => setIsFilterModalOpen(false)}
                className="filter-modal"
              >
                <IonHeader>
                  <IonToolbar>
                    <IonTitle>Filtrer les transactions</IonTitle>
                    <IonButtons slot="end">
                      <IonButton onClick={() => setIsFilterModalOpen(false)}>
                        <IonIcon icon={closeOutline} />
                      </IonButton>
                    </IonButtons>
                  </IonToolbar>
                </IonHeader>
                <IonContent className="filter-modal-content">
                  <div className="filter-section">
                    <h4>Type de transaction</h4>
                    <IonSelect
                      value={filterType}
                      onIonChange={(e) => setFilterType(e.detail.value)}
                      interface="popover"
                      placeholder="Sélectionner un type"
                    >
                      <IonSelectOption value="all">Tous</IonSelectOption>
                      <IonSelectOption value="credit">Crédits</IonSelectOption>
                      <IonSelectOption value="debit">Débits</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="filter-section">
                    <h4>Période</h4>
                    <IonSelect
                      value={dateRange}
                      onIonChange={(e) => setDateRange(e.detail.value)}
                      interface="popover"
                      placeholder="Sélectionner une période"
                    >
                      <IonSelectOption value="all">Toutes les dates</IonSelectOption>
                      <IonSelectOption value="today">Aujourd'hui</IonSelectOption>
                      <IonSelectOption value="week">7 derniers jours</IonSelectOption>
                      <IonSelectOption value="month">30 derniers jours</IonSelectOption>
                      <IonSelectOption value="year">12 derniers mois</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="filter-actions">
                    <IonButton expand="block" onClick={resetFilters}>
                      Réinitialiser les filtres
                    </IonButton>
                    <IonButton expand="block" onClick={() => setIsFilterModalOpen(false)}>
                      Appliquer
                    </IonButton>
                  </div>
                </IonContent>
              </IonModal>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="compte-page-analytics">
              <div className="analytics-grid">
                <IonCard className="spending-chart-card">
                  <IonCardHeader>Répartition des Dépenses</IonCardHeader>
                  <IonCardContent>
                    <div className="pie-chart-container">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value))}
                            contentStyle={{
                              background: "rgba(30, 30, 30, 0.95)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="spending-categories-card">
                  <IonCardHeader>Catégories de Dépenses</IonCardHeader>
                  <IonCardContent>
                    <div className="categories-list">
                      {categoryData.map((category, index) => (
                        <div key={index} className="category-item">
                          <div className="category-color" style={{ backgroundColor: category.color }}></div>
                          <div className="category-name">{category.name}</div>
                          <div className="category-amount">{formatCurrency(category.value)}</div>
                        </div>
                      ))}
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="monthly-summary-card">
                  <IonCardHeader>Résumé Mensuel</IonCardHeader>
                  <IonCardContent>
                    <div className="monthly-summary">
                      <div className="summary-item">
                        <div className="summary-label">Revenus du mois</div>
                        <div className="summary-value income">{formatCurrency(stats.income)}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Dépenses du mois</div>
                        <div className="summary-value expense">{formatCurrency(stats.expenses)}</div>
                      </div>
                      <div className="summary-item">
                        <div className="summary-label">Solde net</div>
                        <div className="summary-value">{formatCurrency(stats.income - stats.expenses)}</div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="compte-page-details">
              <div className="details-grid">
                <IonCard className="account-details-card">
                  <IonCardHeader>Détails du Compte</IonCardHeader>
                  <IonCardContent>
                    <div className="details-list">
                      <div className="detail-item">
                        <div className="detail-label">Type de compte</div>
                        <div className="detail-value">{account?.type}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Numéro de compte</div>
                        <div className="detail-value">{account?.numéroCompte}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">IBAN</div>
                        <div className="detail-value">{account?.IBAN}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">RIB</div>
                        <div className="detail-value">{account?.RIB}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Date d'ouverture</div>
                        <div className="detail-value">{formatDate(account?.createdAt || "")}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Chéquier</div>
                        <div className="detail-value">{account?.avecChéquier ? "Oui" : "Non"}</div>
                      </div>
                      <div className="detail-item">
                        <div className="detail-label">Carte bancaire</div>
                        <div className="detail-value">{account?.avecCarteBancaire ? "Oui" : "Non"}</div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonCard className="user-details-card">
                  <IonCardHeader>Informations Personnelles</IonCardHeader>
                  <IonCardContent>
                    <div className="user-details">
                      <div className="user-avatar">
                        <IonAvatar>
                          <img src="./avatar.png?height=80&width=80" alt="Avatar" />
                        </IonAvatar>
                      </div>
                      <div className="user-info">
                        <h3 className="user-name">
                          {profile?.user.prenom} {profile?.user.nom}
                        </h3>
                        <div className="user-meta">
                          <div className="user-meta-item">
                            <IonIcon icon={personOutline} />
                            <span>CIN: {profile?.user.cin}</span>
                          </div>
                          <div className="user-meta-item">
                            <IonIcon icon={mailOutline} />
                            <span>{profile?.user.email}</span>
                          </div>
                          <div className="user-meta-item">
                            <IonIcon icon={callOutline} />
                            <span>{profile?.user.telephone}</span>
                          </div>
                          <div className="user-meta-item">
                            <IonIcon icon={businessOutline} />
                            <span>{profile?.user.employeur}</span>
                          </div>
                          <div className="user-meta-item">
                            <IonIcon icon={locationOutline} />
                            <span>{profile?.user.adresseEmployeur}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>

                {card && (
                  <IonCard className="card-details-card">
                    <IonCardHeader>Carte Associée</IonCardHeader>
                    <IonCardContent>
                      <div className="card-preview">
                        <div className="credit-card">
                          <div className="card-chip"></div>
                          <div className="card-number">•••• •••• •••• {card.CardNumber.slice(-4)}</div>
                          <div className="card-holder">{card.CardHolder}</div>
                          <div className="card-expiry">
                            <span>Valable jusqu'à</span>
                            <span>{card.ExpiryDate}</span>
                          </div>
                          <div className="card-type">{card.TypeCarte}</div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <IonButton expand="block" routerLink="/carte">
                          <IonIcon slot="start" icon={cardOutline} />
                          Gérer ma carte
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                )}

                <IonCard className="documents-card">
                  <IonCardHeader>Documents</IonCardHeader>
                  <IonCardContent>
                    <div className="documents-list">
                      <div className="document-item">
                        <div className="document-icon">
                          <IonIcon icon={documentTextOutline} />
                        </div>
                        <div className="document-details">
                          <div className="document-name">Relevé de compte - Avril 2023</div>
                          <div className="document-date">01/05/2023</div>
                        </div>
                        <IonButton fill="clear" size="small">
                          <IonIcon slot="icon-only" icon={downloadOutline} />
                        </IonButton>
                      </div>
                      <div className="document-item">
                        <div className="document-icon">
                          <IonIcon icon={documentTextOutline} />
                        </div>
                        <div className="document-details">
                          <div className="document-name">Relevé de compte - Mars 2023</div>
                          <div className="document-date">01/04/2023</div>
                        </div>
                        <IonButton fill="clear" size="small">
                          <IonIcon slot="icon-only" icon={downloadOutline} />
                        </IonButton>
                      </div>
                      <div className="document-item">
                        <div className="document-icon">
                          <IonIcon icon={documentTextOutline} />
                        </div>
                        <div className="document-details">
                          <div className="document-name">Relevé de compte - Février 2023</div>
                          <div className="document-date">01/03/2023</div>
                        </div>
                        <IonButton fill="clear" size="small">
                          <IonIcon slot="icon-only" icon={downloadOutline} />
                        </IonButton>
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          )}

          {activeTab === "credit" && (
            <div className="compte-page-credit">
              <div className="credit-grid">
                <IonCard className="credit-status-card">
                  <IonCardHeader>Mes demandes de crédit</IonCardHeader>
                  <IonCardContent>
                    {loadingCredits ? (
                      <div className="loading-message">Chargement des crédits...</div>
                    ) : userCredits.length > 0 ? (
                      <div className="credit-applications-list">
                        {userCredits.map((credit) => (
                          <div key={credit._id} className="credit-application-item">
                            <div className="credit-application-icon">
                              <IonIcon icon={walletOutline} />
                            </div>
                            <div className="credit-application-details">
                              <div className="credit-application-title">{credit.type}</div>
                              <div className="credit-application-meta">
                                <span className="credit-application-date">
                                  Demande du {formatDate(credit.createdAt)}
                                </span>
                                <span className="credit-application-amount">{formatCurrency(credit.montant)}</span>
                                <span className="credit-application-duree">Durée: {credit.duree} mois</span>
                              </div>
                              <div className="credit-application-info">
                                <div>
                                  <IonIcon icon={personOutline} />
                                  {credit.userId.prenom} {credit.userId.nom}
                                </div>
                                <div>
                                  <IonIcon icon={documentTextOutline} />
                                  Compte: {credit.compteId.numéroCompte}
                                </div>
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
                            <div className={`credit-application-status status-${credit.status}`}>
                              {renderCreditStatus(credit.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-data-message">Aucune demande de crédit en cours</div>
                    )}
                  </IonCardContent>
                </IonCard>

                <IonCard className="new-credit-card">
                  <IonCardHeader>Nouvelle demande de crédit</IonCardHeader>
                  <IonCardContent>
                    <form className="credit-application-form">
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

                        <IonInput
                          type="number"
                          placeholder="Montant en TND"
                          min="1000"
                          value={montantValue}
                          onIonChange={(e) => setMontantValue(Number(e.detail.value!))}
                        />

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
                          {isSubmitting ? "Envoi en cours..." : "Soumettre ma demande"}
                        </IonButton>
                      </div>
                    </form>
                  </IonCardContent>
                </IonCard>

                {/* Simulateur de crédit interactif amélioré */}
                <IonCard className="credit-simulator-card" style={{ gridColumn: "1 / -1" }}>
                  <IonCardHeader>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Simulateur de crédit interactif</span>
                      <IonButton fill="clear" onClick={resetSimulator}>
                        <IonIcon slot="start" icon={refreshOutline} />
                        Réinitialiser
                      </IonButton>
                    </div>
                  </IonCardHeader>
                  <IonCardContent>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      {/* Contrôles du simulateur */}
                      <div className="simulator-controls">
                        <div className="form-group" style={{ marginBottom: "20px" }}>
                          <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                            Montant du crédit: {formatCurrency(simulatorMontant)}
                          </label>
                          <IonRange
                            min={1000}
                            max={100000}
                            step={1000}
                            value={simulatorMontant}
                            onIonChange={(e) => setSimulatorMontant(e.detail.value as number)}
                            color="primary"
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8em",
                              color: "#666",
                            }}
                          >
                            <span>1 000 TND</span>
                            <span>100 000 TND</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: "20px" }}>
                          <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                            Taux d'intérêt annuel: {simulatorTaux}%
                          </label>
                          <IonRange
                            min={3}
                            max={15}
                            step={0.1}
                            value={simulatorTaux}
                            onIonChange={(e) => setSimulatorTaux(e.detail.value as number)}
                            color="secondary"
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8em",
                              color: "#666",
                            }}
                          >
                            <span>3%</span>
                            <span>15%</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: "20px" }}>
                          <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                            Durée: {simulatorDuree} mois
                          </label>
                          <IonRange
                            min={12}
                            max={120}
                            step={6}
                            value={simulatorDuree}
                            onIonChange={(e) => setSimulatorDuree(e.detail.value as number)}
                            color="tertiary"
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8em",
                              color: "#666",
                            }}
                          >
                            <span>12 mois</span>
                            <span>120 mois</span>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: "20px" }}>
                          <label style={{ fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                            Revenus mensuels: {formatCurrency(simulatorRevenu)}
                          </label>
                          <IonRange
                            min={500}
                            max={10000}
                            step={100}
                            value={simulatorRevenu}
                            onIonChange={(e) => setSimulatorRevenu(e.detail.value as number)}
                            color="success"
                          />
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.8em",
                              color: "#666",
                            }}
                          >
                            <span>500 TND</span>
                            <span>10 000 TND</span>
                          </div>
                        </div>
                      </div>

                      {/* Résultats de la simulation */}
                      <div className="simulator-results">
                        <div
                          className="result-preview"
                          style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            padding: "20px",
                            borderRadius: "12px",
                            color: "white",
                            marginBottom: "20px",
                          }}
                        >
                          <h4 style={{ margin: "0 0 15px 0", textAlign: "center" }}>Résultats de la simulation</h4>
                          <div
                            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", fontSize: "0.9em" }}
                          >
                            <div>
                              <div style={{ opacity: 0.8 }}>Mensualité</div>
                              <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                                {formatCurrency(simulatorResults.mensualite)}
                              </div>
                            </div>
                            <div>
                              <div style={{ opacity: 0.8 }}>Coût total</div>
                              <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                                {formatCurrency(simulatorResults.coutTotal)}
                              </div>
                            </div>
                            <div>
                              <div style={{ opacity: 0.8 }}>Total à rembourser</div>
                              <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                                {formatCurrency(simulatorResults.montantTotal)}
                              </div>
                            </div>
                            <div>
                              <div style={{ opacity: 0.8 }}>Taux d'endettement</div>
                              <div style={{ fontSize: "1.2em", fontWeight: "bold" }}>
                                {simulatorResults.tauxEndettement.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Indicateur de faisabilité */}
                        <div
                          className="feasibility-indicator"
                          style={{
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "15px",
                            background: simulatorResults.tauxEndettement > 33 ? "#ffebee" : "#e8f5e8",
                            border: `2px solid ${simulatorResults.tauxEndettement > 33 ? "#f44336" : "#4caf50"}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                            <IonIcon
                              icon={simulatorResults.tauxEndettement > 33 ? warningOutline : checkmarkCircleOutline}
                              style={{
                                color: simulatorResults.tauxEndettement > 33 ? "#f44336" : "#4caf50",
                                marginRight: "10px",
                              }}
                            />
                            <span style={{ fontWeight: "bold" }}>
                              {simulatorResults.tauxEndettement > 33 ? "Attention" : "Faisable"}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.9em", color: "#666" }}>
                            {simulatorResults.tauxEndettement > 33
                              ? "Votre taux d'endettement dépasse 33%. Il sera difficile d'obtenir ce crédit."
                              : "Votre taux d'endettement est acceptable. Ce crédit semble réalisable."}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="simulator-actions">
                          <IonButton expand="block" onClick={useSimulatorParams} style={{ marginBottom: "10px" }}>
                            Utiliser ces paramètres pour ma demande
                          </IonButton>

                          <IonButton
                            expand="block"
                            fill="outline"
                            onClick={() => setShowAmortissement(!showAmortissement)}
                          >
                            {showAmortissement ? "Masquer" : "Voir"} le tableau d'amortissement
                          </IonButton>
                        </div>
                      </div>
                    </div>

                    {/* Graphique de comparaison */}
                    <div style={{ marginTop: "30px" }}>
                      <h4>Comparaison par durée</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={comparisonData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="duree" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="mensualite" fill="#8884d8" name="Mensualité" />
                          <Bar dataKey="coutTotal" fill="#82ca9d" name="Coût total" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Tableau d'amortissement */}
                    {showAmortissement && (
                      <div style={{ marginTop: "30px" }}>
                        <h4>Tableau d'amortissement (12 premiers mois)</h4>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
                            <thead>
                              <tr style={{ background: "#f5f5f5" }}>
                                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Mois</th>
                                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Mensualité</th>
                                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Capital</th>
                                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Intérêts</th>
                                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Capital restant</th>
                              </tr>
                            </thead>
                            <tbody>
                              {amortissementData.map((row, index) => (
                                <tr key={index}>
                                  <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "center" }}>
                                    {row.mois}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                                    {formatCurrency(row.mensualite)}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                                    {formatCurrency(row.capital)}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                                    {formatCurrency(row.interets)}
                                  </td>
                                  <td style={{ padding: "8px", border: "1px solid #ddd", textAlign: "right" }}>
                                    {formatCurrency(row.capitalRestant)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>
              </div>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default ComptePageDesktop
