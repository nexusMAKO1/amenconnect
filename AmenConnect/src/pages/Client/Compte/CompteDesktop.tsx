"use client"
import React, { useMemo, useState, useEffect } from "react"
import {
  IonContent,
  IonHeader,
  IonPage,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonIcon,
  IonBadge
} from "@ionic/react"
import {
  walletOutline,
  repeatOutline,
  analyticsOutline,
  cardOutline,
  trendingUpOutline,
  trendingDownOutline,
} from "ionicons/icons"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import Navbar from "../../../components/Navbar"
import "./CompteDesktop.css"
import Profile from "../accueil/MenuDesktop/ProfileMenu"
import { useAuth } from "../../../AuthContext"

interface Operation {
  _id: string
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
}

const CompteDesktop: React.FC = () => {
  const { profile, authLoading } = useAuth()

  // Today state to display the last update date.
  const [today, setToday] = useState<string>("")
  useEffect(() => {
    const currentDate = new Date()
    const formattedDate = currentDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    setToday(formattedDate)
  }, [])

  if (authLoading) {
    return <div>Loading...</div>
  }

  // Retrieve the accounts from the profile data.
  const accounts = profile?.comptes ?? []

  // Operations state, now populated by aggregating historique data from each account.
  const [operations, setOperations] = useState<Operation[]>([])
  const [loadingOperations, setLoadingOperations] = useState<boolean>(true)
  const [errorOperations, setErrorOperations] = useState<string | null>(null)

  // Aggregate operations (historique) from all accounts in the profile.
  useEffect(() => {
    if (profile) {
      let allOperations: Operation[] = []
      profile.comptes.forEach((compte: any) => {
        if (compte.historique && Array.isArray(compte.historique)) {
          allOperations = [...allOperations, ...compte.historique]
        }
      })
      setOperations(allOperations)
      setLoadingOperations(false)
    } else {
      setLoadingOperations(false)
    }
  }, [profile])

  // Build chart data by grouping operations by month.
  const chartData = useMemo(() => {
    const grouped = operations.reduce((acc, op) => {
      const month = new Date(op.date).toLocaleString("default", { month: "short" })
      if (!acc[month]) {
        acc[month] = { name: month, revenus: 0, depenses: 0 }
      }
      if (op.type === "credit") {
        acc[month].revenus += op.amount
      } else if (op.type === "debit") {
        acc[month].depenses += op.amount
      }
      return acc
    }, {} as { [key: string]: { name: string; revenus: number; depenses: number } })
    return Object.values(grouped)
  }, [operations])

  // Navigate to account details.
  const handleAccountClick = (accountId: string) => {
    console.log(`Viewing account ${accountId}...`)
    window.location.href = `/Compte/${accountId}`
  }

  // A sample stat card render function.
  const renderStatCard = (
    label: string,
    value: string,
    change: string,
    icon: string,
    changeType: "positive" | "negative"
  ) => (
    <div className="stat-card">
      <div className="stat-icon">
        <IonIcon icon={icon} />
      </div>
      <div className="stat-content">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className={`stat-change ${changeType}`}>
          <IonIcon icon={changeType === "positive" ? trendingUpOutline : trendingDownOutline} />
          {change}
        </div>
      </div>
    </div>
  )

  return (
    <IonPage>
      <IonHeader>
        <Navbar currentPage="compte" />
      </IonHeader>
      <IonContent className="ion-padding custom-content">
        <div className="compte-container">
          <h1 className="page-title">Mes Comptes</h1>
          <div className="ProfileCom">
            <Profile />
          </div>

          <div className="compte-grid">
            {/* Display each account coming from the profile */}
            {accounts.map((account: any) => (
              <IonCard
                key={account._id}
                className="compte-card"
                onClick={() => handleAccountClick(account._id)}
              >
                <IonCardHeader>{account.type}</IonCardHeader>
                <IonCardContent>
                  <div className="balance">{account.solde.toFixed(2)} TND</div>
                  <div className="account-number">{account.numéroCompte}</div>
                  <div className="balance-change">
                    <IonIcon icon={trendingUpOutline} />
                    <span>+2.5% ce mois</span>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}

            <IonCard className="chart-card">
              <IonCardHeader>Aperçu financier</IonCardHeader>
              <IonCardContent>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenus" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorDepenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{ fill: "rgba(255,255,255,0.5)" }} />
                      <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: "rgba(255,255,255,0.5)" }} />
                      <Tooltip contentStyle={{ background: "rgba(0,0,0,0.8)", border: "none" }} />
                      <Area
                        type="monotone"
                        dataKey="revenus"
                        stroke="#6366F1"
                        fillOpacity={1}
                        fill="url(#colorRevenus)"
                      />
                      <Area
                        type="monotone"
                        dataKey="depenses"
                        stroke="#F43F5E"
                        fillOpacity={1}
                        fill="url(#colorDepenses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="actions-card">
              <IonCardHeader>Actions Rapides</IonCardHeader>
              <IonCardContent>
                <div className="actions-grid">
                  <IonButton fill="clear" className="action-button">
                    <div className="action-content">
                      <IonIcon icon={walletOutline} />
                      <span>Virement</span>
                    </div>
                  </IonButton>

                  <IonButton fill="clear" className="action-button">
                    <div className="action-content">
                      <IonIcon icon={cardOutline} />
                      <span>Recharge</span>
                    </div>
                  </IonButton>

                  <IonButton fill="clear" className="action-button">
                    <div className="action-content">
                      <IonIcon icon={repeatOutline} />
                      <span>Conversion</span>
                    </div>
                  </IonButton>

                  <IonButton fill="clear" className="action-button">
                    <div className="action-content">
                      <IonIcon icon={analyticsOutline} />
                      <span>Analyse</span>
                    </div>
                  </IonButton>
                </div>
              </IonCardContent>
            </IonCard>

            <IonCard className="operations-card">
              <IonCardHeader>
                <div className="operations-header">
                  <span>Opérations</span>
                  <span className="update-date">Dernière mise à jour : {today}</span>
                </div>
              </IonCardHeader>
              <IonCardContent>
                <div className="operations-list">
                  {loadingOperations ? (
                    <div>Loading operations...</div>
                  ) : errorOperations ? (
                    <div className="error-message">{errorOperations}</div>
                  ) : operations.length > 0 ? (
                    operations.map((op) => (
                      <div key={op._id} className="operation-item">
                        <div className="operation-icon">
                          <IonIcon icon={op.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                        </div>
                        <div className="operation-details">
                          <span className="operation-description">{op.description}</span>
                          <span className="operation-date">{op.date}</span>
                        </div>
                        <div className="operation-amount">
                          <IonBadge color={op.type === "credit" ? "success" : "danger"}>
                            {op.type === "credit" ? "+" : "-"} {op.amount} TND
                          </IonBadge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div>Aucune opération disponible</div>
                  )}
                </div>
              </IonCardContent>
            </IonCard>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default CompteDesktop
