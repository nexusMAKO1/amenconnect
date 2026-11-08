// app.js
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const swaggerUi = require("swagger-ui-express")
const swaggerSpecs = require("./config/swagger")
require("dotenv").config()
const cookieParser = require("cookie-parser")

// Import routes
const accountCreationRoutes = require("./routes/accountCreationRoutes")
const authRoutes = require("./routes/authRoutes")
const ipRoutes = require("./routes/ipRoutes")
const forgotPasswordRoutes = require("./routes/forgotPasswordRoutes")
const carteRoutes = require("./routes/carteRoutes")
const qrLoginRoutes = require("./routes/qrLogin")
const paymentRoutes = require("./routes/paymentRoutes")
const virementRoutes = require("./routes/virementRoutes")
const virementProgrammeRoutes = require("./routes/virementProgrammeRoutes")
const virementGroupeRoutes = require("./routes/virementGroupeRoutes")
const beneficiairesRoutes = require("./routes/beneficiaires")
const videoConferenceRoutes = require("./routes/videoConferenceRoutes")
const adminNotificationsRoutes = require("./routes/adminNotificationsRoutes")
const adminListRoutes = require("./routes/adminList")
const adminRoutes = require("./routes/adminAuthRoutes")
const transactionRoutes = require("./routes/transactionRoutes")
const historiqueRoutes = require("./routes/historiqueRoutes")
const budgetCategoryRoutes = require("./routes/budgetCategoryRoutes")
const sessionRoutes = require("./routes/sessionRoutes")
const systemStatsRoute = require("./routes/systemStatsRoute")
const kioskRoutes = require("./routes/kioskRoutes")
const auditLogsRoutes = require("./routes/auditLogsRoutes")
const mongoOpsRoute = require("./routes/mongoOpsRoute")
const alertsRouter = require("./routes/alerts")
const incidentsRouter = require('./routes/incidents')
const passport = require("./config/passport")
const adminpassport = require("./config/adminPassport")
const Twofa = require("./routes/2fa")
const themeRoutes = require("./routes/theme")
const themesPresetRoutes = require("./routes/themeRoutes")
const logoRoutes = require('./routes/logoRoutes')
const chatRoutes = require("./routes/chatRoutes")
const creditRoutes = require("./routes/creditRoutes")
const app = express()

// Trust first proxy hop (Nginx reverse proxy)
app.set("trust proxy", 1)

// Middlewares
app.use(helmet())
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ limit: "50mb", extended: true }))
app.use(cookieParser())
// Setup CORS origins
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:8100,http://localhost:8200")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*") || process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}))
app.options('*', cors())

// Initialize Passport
app.use(passport.initialize())
app.use(adminpassport.initialize())

// Mount some routes
app.use("/api/incidents", incidentsRouter)
app.use("/api", accountCreationRoutes)
app.use("/api/compte", transactionRoutes)
app.use("/api/categories", budgetCategoryRoutes)
app.use("/api/budget", require("./routes/budgetCategoryRoutes"));
app.use("/api/credit", creditRoutes)
app.use("/api/historique", passport.authenticate("jwt", { session: false }), historiqueRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/password", forgotPasswordRoutes)
app.use("/api/ip", ipRoutes)
app.use("/api/carte", carteRoutes)
app.use("/api/qr-login", qrLoginRoutes)
app.use("/auth", authRoutes)
// ---- Notice the change here: we mount paymentRoutes at /api/payments ----
app.use("/api/payments", paymentRoutes)
app.use("/api/virements", virementRoutes)
app.use("/api/virements/programme", virementProgrammeRoutes)
app.use("/api/virements/group", virementGroupeRoutes)
app.use("/api/beneficiaires", beneficiairesRoutes)
app.use("/api/video-requests", videoConferenceRoutes)
app.use("/api/admin/notifications", adminNotificationsRoutes)
app.use("/api/admin/reset", adminRoutes)
app.use("/api/admin/list", adminpassport.authenticate("admin-jwt", { session: false }), adminListRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/sessions", sessionRoutes)
app.use("/api/system-stats", systemStatsRoute)
app.use("/api/2fa", adminpassport.authenticate("admin-jwt", { session: false }), Twofa)
app.use("/api/chat", chatRoutes)
app.use("/api/mongo-ops", mongoOpsRoute)
app.use("/api/alerts", alertsRouter)
app.use("/api/audit-logs", auditLogsRoutes)
app.use("/api/kiosk", kioskRoutes)
app.use("/api/", logoRoutes)
app.use("/api/theme", themeRoutes)
app.use("/api/", themesPresetRoutes)

// Healthcheck endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "backend", timestamp: new Date().toISOString() });
});

// Swagger documentation route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: "An unexpected error occurred." })
})

module.exports = app
