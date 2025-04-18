"use client"
import type React from "react"
import { useMemo,useState, useEffect } from "react"
import { IonContent, IonPage, IonIcon, IonRippleEffect, IonButton, IonImg } from "@ionic/react"
import {
  printOutline,
  walletOutline,
  cardOutline,
  pieChartOutline,
  trendingUpOutline,
  trendingDownOutline,
  timeOutline,
  globeOutline,
} from "ionicons/icons"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useHistory } from "react-router-dom"
import { useAuth } from "../../../AuthContext"
import NavbarKiosk from "../../../components/NavbarKiosk"
import "./AccueilKiosk.css"

// Import jsPDF and autoTable
import jsPDF from "jspdf"
import "jspdf-autotable"

interface Account {
  _id: string
  numéroCompte: string
  solde: number
  type: string
}

interface Card {
  _id: string
  CardNumber: string
  ExpiryDate: string
  CardHolder: string
}

interface Transaction {
  id: number
  description: string
  amount: number
  date: string
  type: "credit" | "debit"
}

const AccueilKiosk: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loadingTransactions, setLoadingTransactions] = useState<boolean>(true)
    const [errorTransactions, setErrorTransactions] = useState<string | null>(null)

  const history = useHistory()
  const { profile, authLoading } = useAuth()

  const prenom = profile?.user?.prenom || "Utilisateur"
  const nom = profile?.user?.nom || "Foulen"

  const accounts: Account[] = (profile?.comptes || []).map((compte) => ({
    _id: compte._id,
    numéroCompte: compte.numéroCompte,
    solde: compte.solde,
    type: compte.type,
  }))

  const cards: Card[] = (profile?.cartes || []).map((card) => ({
    _id: card._id,
    CardNumber: card.CardNumber,
    ExpiryDate: card.ExpiryDate,
    CardHolder: card.CardHolder,
  }))
  // Fetch transactions from the API.
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch("/api/historique", {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch transactions")
        }
        const data: Transaction[] = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des transactions:", error)
        setErrorTransactions("Erreur lors de la récupération des transactions.")
      } finally {
        setLoadingTransactions(false)
      }
    }
    fetchTransactions()
  }, [])
  const recentTransactions: Transaction[] = [
    { id: 1, description: "Supermarché", amount: 85.5, date: "2025-01-20", type: "debit" },
    { id: 2, description: "Salaire", amount: 2500.0, date: "2025-01-15", type: "credit" },
    { id: 3, description: "Restaurant", amount: 45.0, date: "2025-01-18", type: "debit" },
    { id: 4, description: "Transport", amount: 30.0, date: "2025-01-17", type: "debit" },
  ]

  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + account.solde, 0), [accounts])

  const chartData = useMemo(() => {
    const groupedData = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date)
      const month = date.toLocaleString("default", { month: "short" })
      if (!acc[month]) {
        acc[month] = { name: month, income: 0, expenses: 0 }
      }
      if (transaction.type === "credit") {
        acc[month].income += transaction.amount
      } else if (transaction.type === "debit") {
        acc[month].expenses += transaction.amount
      }
      return acc
    }, {} as { [month: string]: { name: string; income: number; expenses: number } })
    return Object.values(groupedData)
  }, [transactions])

  const handleAccountClick = (accountId: string) => {
    console.log(`Viewing account ${accountId}...`)
    history.push(`/Compte/${accountId}`)
  }

  // Function to generate and print the PDF statement
// Updated handlePrintStatement with enhanced styling

const defaultBankBranding = {
  name: "Amen Bank",
  logo: "amen_logo.png", // Ensure this path is accessible
  primaryColor: [0, 51, 102], // Dark blue
  secondaryColor: [0, 85, 165], // Slightly lighter blue
  address: ["Avenue Mohamed V", "Tunis 1002", "Tunisie"],
  website: "www.amenbank.com.tn",
  phone: "(+216) 71 148 000",
  email: "contact@amenbank.com.tn",
}

const defaultStatementConfig = {
  showLogo: true,
  showFooter: true,
  showPageNumbers: true,
  showBankInfo: true,
  dateFormat: "fr-FR",
  locale: "en-US",
  currency: "TND",
  theme: {
    headerColor: [0, 51, 102],
    textColor: [33, 33, 33],
    accentColor: [0, 102, 204],
    tableHeaderColor: [0, 51, 102],
    alternateRowColor: [240, 240, 240],
  },
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat(defaultStatementConfig.locale, {
    style: "currency",
    currency: defaultStatementConfig.currency,
  }).format(amount)
}

const handlePrintStatement = async () => {
  try {
    // Use the first card from the cards array as card details (if available)
    const cardDetails = cards[0] || {
      _id: "inconnu",
      CardNumber: "0000000000000000",
      ExpiryDate: "00/00",
      CardHolder: `${prenom} ${nom}`,
    }

    // Calculate total balance, total credits, and debits from recent transactions
    const totalBalanceFormatted = totalBalance.toFixed(2)
    const totalCredit = recentTransactions
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0)
    const totalDebit = recentTransactions
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0)
    const netBalance = totalCredit - totalDebit

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

    // ─── Background Pattern ──────────────────────────────
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFillColor(250, 250, 250)
    doc.rect(0, 0, pageWidth, pageHeight, "F")
    doc.setDrawColor(230, 230, 230)
    for (let y = 0; y < pageHeight; y += 10) {
      doc.line(0, y, pageWidth, y)
    }

    // ─── Header ──────────────────────────────
    const headerHeight = 40
    const headerColor = defaultStatementConfig.theme.headerColor
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.rect(0, 0, pageWidth, headerHeight, "F")

    // Bank contact info (Top Left)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    const bankInfo = [
      defaultBankBranding.name,
      ...defaultBankBranding.address,
      `Tél: ${defaultBankBranding.phone}`,
      `Email: ${defaultBankBranding.email}`,
      `Site: ${defaultBankBranding.website}`,
    ]
    doc.text(bankInfo, 10, 10)

    // Title (Centered)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.text("Relevé de Compte", pageWidth / 2, 20, { align: "center" })

    // Bank logo (Top Right)
    if (defaultStatementConfig.showLogo) {
      try {
        const img = new Image()
        img.crossOrigin = "anonymous"
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = defaultBankBranding.logo
        })
        // Position logo within header
        doc.addImage(img, "PNG", pageWidth - 55, 10, 45, 20)
      } catch (error) {
        console.error("Erreur de chargement du logo:", error)
      }
    }

    // ─── Statement Period (Below Header) ──────────────────────────────
    const today = new Date()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(
      defaultStatementConfig.theme.textColor[0],
      defaultStatementConfig.theme.textColor[1],
      defaultStatementConfig.theme.textColor[2]
    )
    doc.text(
      `Période: ${firstDayOfMonth.toLocaleDateString(defaultStatementConfig.locale)} - ${today.toLocaleDateString(
        defaultStatementConfig.locale
      )}`,
      15,
      headerHeight + 10
    )

    // ─── Card Information Box ──────────────────────────────
    const cardBoxX = 15,
      cardBoxY = headerHeight + 15,
      cardBoxWidth = 180,
      cardBoxHeight = 35
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(cardBoxX, cardBoxY, cardBoxWidth, cardBoxHeight, 3, 3, "F")
    // Dashed border for card box
    doc.setDrawColor(defaultStatementConfig.theme.accentColor[0], defaultStatementConfig.theme.accentColor[1], defaultStatementConfig.theme.accentColor[2])
    doc.setLineDash([2, 2])
    doc.roundedRect(cardBoxX, cardBoxY, cardBoxWidth, cardBoxHeight, 3, 3, "D")
    doc.setLineDash([])

    const cardInfoY = cardBoxY + 10
    doc.setFont("helvetica", "normal")
    doc.setFontSize(12)
    doc.setTextColor(
      defaultStatementConfig.theme.textColor[0],
      defaultStatementConfig.theme.textColor[1],
      defaultStatementConfig.theme.textColor[2]
    )
    doc.text(`Titulaire: ${cardDetails.CardHolder}`, cardBoxX + 5, cardInfoY)
    doc.text(`Carte: **** **** **** ${cardDetails.CardNumber.slice(-4)}`, cardBoxX + 5, cardInfoY + 8)
    doc.text(`Solde Total: ${formatCurrency(totalBalance)}`, cardBoxX + 5, cardInfoY + 16)

    // ─── Summary Section ──────────────────────────────
    const summaryBoxY = cardBoxY + cardBoxHeight + 10
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(15, summaryBoxY, 180, 40, 3, 3, "F")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("Résumé des opérations", 20, summaryBoxY + 12)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    const summaryY = summaryBoxY + 22
    doc.setTextColor(0, 102, 0)
    doc.text("Total crédits:", 25, summaryY)
    doc.text(formatCurrency(totalCredit), 110, summaryY)
    doc.setTextColor(204, 0, 0)
    doc.text("Total débits:", 25, summaryY + 8)
    doc.text(formatCurrency(totalDebit), 110, summaryY + 8)
    doc.setTextColor(
      defaultStatementConfig.theme.textColor[0],
      defaultStatementConfig.theme.textColor[1],
      defaultStatementConfig.theme.textColor[2]
    )
    doc.text("Solde net:", 25, summaryY + 16)
    doc.setTextColor(netBalance >= 0 ? 0 : 204, netBalance >= 0 ? 102 : 0, netBalance >= 0 ? 0 : 0)
    doc.text(formatCurrency(netBalance), 110, summaryY + 16)

    // ─── Transactions Table ──────────────────────────────
    const tableHead = [["Date", "Description", "Type", "Montant"]]
    const tableData = recentTransactions.map((t) => [
      t.date,
      t.description,
      t.type === "credit" ? "+" : "-",
      formatCurrency(t.amount),
    ])

    doc.autoTable({
      startY: summaryBoxY + 50,
      head: tableHead,
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 6,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: defaultStatementConfig.theme.tableHeaderColor,
        textColor: [255, 255, 255],
        fontSize: 11,
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
      },
      alternateRowStyles: {
        fillColor: defaultStatementConfig.theme.alternateRowColor,
      },
    })

    // ─── Footer ──────────────────────────────
    if (defaultStatementConfig.showFooter) {
      const pageCount = (doc.internal as any).getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
        doc.rect(0, pageHeight - 20, pageWidth, 20, "F")
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)
        if (defaultStatementConfig.showPageNumbers) {
          doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 7, { align: "center" })
        }
        doc.text(
          `Généré le ${new Date().toLocaleDateString(defaultStatementConfig.locale)} à ${new Date().toLocaleTimeString(
            defaultStatementConfig.locale
          )}`,
          10,
          pageHeight - 7
        )
      }
    }

    // ─── Open Print Dialog ──────────────────────────────
    doc.autoPrint()
    const blobUrl = doc.output("bloburl")
    const printWindow = window.open(blobUrl)
    if (printWindow) {
      printWindow.focus()
    }
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error)
  }
}

  

  if (authLoading) {
    return <div className="accueil-kiosk-loading">Chargement...</div>
  }

  return (
    <IonPage>
      <NavbarKiosk currentPage="accueil" />
      <IonContent fullscreen>
        <div className="accueil-kiosk-container">
          <div className="background-white"></div>
          <svg className="background-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 983 1920" fill="none">
            <path
              d="M0 0H645.236C723.098 0 770.28 85.9638 728.469 151.647C697.151 200.847 715.114 266.33 767.152 292.664L793.096 305.793C854.316 336.773 866.865 418.795 817.709 466.662L691.328 589.731C677.652 603.048 659.319 610.5 640.231 610.5C577.253 610.5 543.641 684.721 585.184 732.054L641.155 795.826C676.082 835.621 671.964 896.237 631.974 930.943L582.069 974.254C522.93 1025.58 568.96 1122.18 646.076 1108.59C700.297 1099.03 746.811 1147.67 734.833 1201.41L727.617 1233.79C715.109 1289.9 752.705 1344.88 809.534 1353.59L836.788 1357.76C862.867 1361.76 886.31 1375.9 902.011 1397.1L964.656 1481.7C1003.87 1534.65 970.947 1610.18 905.469 1617.5C862.212 1622.34 829.5 1658.92 829.5 1702.44V1717.72C829.5 1756.01 800.102 1787.88 761.94 1790.96L696.194 1796.27C667.843 1798.56 652.928 1831 669.644 1854.01C685.614 1876 672.771 1907.1 645.942 1911.41L597.738 1919.16C594.251 1919.72 590.726 1920 587.195 1920H462.5H200.5H0V0Z"
              fill="#47CE65"
              stroke="#47CE65"
            />
          </svg>

          <div className="accueil-kiosk-content">
            <div className="accueil-kiosk-header">
              <IonImg class="Logo" src="amen_logo.png" alt="Amen Bank Logo"></IonImg>
              <div className="accueil-kiosk-welcome">
                <h1 className="accueil-kiosk-title">
                  Bienvenu, {prenom} {nom}
                </h1>
                <p className="accueil-kiosk-subtitle">Voici un aperçu de vos finances</p>
              </div>
            </div>

            <div className="accueil-kiosk-balance-card">
              <div className="accueil-kiosk-balance-icon">
                <IonIcon icon={walletOutline} />
              </div>
              <div className="accueil-kiosk-balance-details">
                <h2 className="accueil-kiosk-balance-label">Solde Total</h2>
                <div className="accueil-kiosk-balance-amount">{totalBalance.toFixed(2)} TND</div>
              </div>
            </div>

            <div className="accueil-kiosk-grid">
              <div className="accueil-kiosk-section accueil-kiosk-accounts">
                <div className="accueil-kiosk-section-header">
                  <h2 className="accueil-kiosk-section-title">
                    <IonIcon icon={walletOutline} />
                    Comptes
                  </h2>
                </div>
                <div className="accueil-kiosk-accounts-list">
                  {accounts.map((account) => (
                    <div
                      key={account._id}
                      className="accueil-kiosk-account-item"
                      onClick={() => handleAccountClick(account._id)}
                    >
                      <IonRippleEffect />
                      <div className="accueil-kiosk-account-icon">
                        <IonIcon icon={account.type === "Compte courant" ? walletOutline : trendingUpOutline} />
                      </div>
                      <div className="accueil-kiosk-account-details">
                        <div className="accueil-kiosk-account-name">{account.type}</div>
                        <div className="accueil-kiosk-account-number">{account.numéroCompte}</div>
                      </div>
                      <div className="accueil-kiosk-account-balance">{account.solde.toFixed(2)} TND</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="accueil-kiosk-section accueil-kiosk-cards">
                <div className="accueil-kiosk-section-header">
                  <h2 className="accueil-kiosk-section-title">
                    <IonIcon icon={cardOutline} />
                    Cartes
                  </h2>
                </div>
                <div className="accueil-kiosk-cards-list">
                  {cards.map((card) => (
                    <div key={card._id} className="accueil-kiosk-card-item">
                      <IonRippleEffect />
                      <div className="accueil-kiosk-card-icon">
                        <IonIcon icon={cardOutline} />
                      </div>
                      <div className="accueil-kiosk-card-details">
                        <div className="accueil-kiosk-card-number">**** **** **** {card.CardNumber.slice(-4)}</div>
                        <div className="accueil-kiosk-card-expiry">Expire: {card.ExpiryDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="accueil-kiosk-section accueil-kiosk-chart">
                <div className="accueil-kiosk-section-header">
                  <h2 className="accueil-kiosk-section-title">
                    <IonIcon icon={pieChartOutline} />
                    Aperçu Financier
                  </h2>
                </div>
                <div className="accueil-kiosk-chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorIncome)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorExpenses)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="accueil-kiosk-section accueil-kiosk-transactions">
                <div className="accueil-kiosk-section-header">
                  <h2 className="accueil-kiosk-section-title">
                    <IonIcon icon={timeOutline} />
                    Transactions Récentes
                  </h2>
                </div>
                <div className="accueil-kiosk-transactions-list">
                                  {loadingTransactions ? (
                                    <div>Loading transactions...</div>
                                  ) : errorTransactions ? (
                                    <div className="error-message">{errorTransactions}</div>
                                  ) : transactions.length > 0 ? (
                                    transactions.map((transaction, index) => (
                                      <div key={index} className="transaction-item">
                                        <IonRippleEffect />
                                        <div className="transaction-icon">
                                          <IonIcon icon={transaction.type === "credit" ? trendingUpOutline : trendingDownOutline} />
                                        </div>
                                        <div className="transaction-details">
                                          <div className="transaction-description">{transaction.description}</div>
                                          <div className="transaction-date">
                                            {new Date(transaction.date).toLocaleString()}
                                          </div>
                                        </div>
                                        <div className={`transaction-amount ${transaction.type}`}>
                                          {transaction.type === "credit" ? "+" : "-"} {transaction.amount.toFixed(2)} TND
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div>Aucune transaction disponible</div>
                                  )}
                </div>
              </div>
            </div>

            <div className="accueil-kiosk-actions">
              {/* When the button is clicked, it calls handlePrintStatement */}
              <IonButton
                expand="block"
                className="accueil-kiosk-action-button"
                onClick={handlePrintStatement}
              >
                <IonIcon slot="start" icon={printOutline} />
                Relevé de compte
              </IonButton>
              <IonButton expand="block" className="accueil-kiosk-action-button">
                <IonIcon slot="start" icon={cardOutline} />
                Payer une Facture
              </IonButton>
              <IonButton expand="block" className="accueil-kiosk-action-button">
                <IonIcon slot="start" icon={globeOutline} />
                Transfert International
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default AccueilKiosk
