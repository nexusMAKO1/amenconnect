# AmenConnect 🏦💳

[![AmenConnect CI](https://github.com/nexusMAKO1/amenconnect/actions/workflows/ci.yml/badge.svg)](https://github.com/nexusMAKO1/amenconnect/actions/workflows/ci.yml)
[![CodeQL Security](https://github.com/nexusMAKO1/amenconnect/actions/workflows/codeql.yml/badge.svg)](https://github.com/nexusMAKO1/amenconnect/actions/workflows/codeql.yml)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Ionic](https://img.shields.io/badge/Ionic-8.4-3880FF?logo=ionic&logoColor=white)](https://ionicframework.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-7.0-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Next-Generation Omnichannel Digital Banking & Interactive Self-Service Totem Terminal Ecosystem.**

AmenConnect is a unified, full-stack banking platform designed for modern financial institutions. It bridges the gap between everyday digital banking (Web, iOS, and Android) and in-branch physical self-service kiosks (Totems), backed by secure REST APIs, real-time WebSocket telemetry, and an AI-driven conversational assistant.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Ecosystem Modules](#-ecosystem-modules)
  - [1. AmenConnect (Web & Mobile Banking)](#1-amenconnect-web--mobile-banking)
  - [2. AmenKiosk (Self-Service Terminal)](#2-amenkiosk-self-service-terminal)
  - [3. Backend (API & Realtime Gateway)](#3-backend-api--realtime-gateway)
  - [4. AmenBot (Conversational AI & WhatsApp)](#4-amenbot-conversational-ai--whatsapp)
  - [5. Hardware Daemon (`api.py`)](#5-hardware-daemon-apipy)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Repository Clone](#1-clone-the-repository)
  - [Backend Setup](#2-backend-api-setup)
  - [AmenConnect Setup](#3-amenconnect-client-setup)
  - [AmenKiosk Setup](#4-amenkiosk-terminal-setup)
  - [AmenBot Setup](#5-amenbot-service-setup)
  - [Hardware Daemon Setup](#6-hardware-bridge-daemon-setup)
- [Environment Configuration](#-environment-configuration)
- [API Documentation & Swagger](#-api-documentation--swagger)
- [Project Directory Structure](#-project-directory-structure)
- [Contributing](#-contributing)
- [Security Policy](#-security-policy)
- [License](#-license)

---

## 🏛 Architectural Overview

```mermaid
flowchart TB
    subgraph Clients["Front-End Touchpoints"]
        MobileApp["📱 AmenConnect Mobile<br/>(iOS & Android / Capacitor)"]
        WebApp["💻 AmenConnect Web<br/>(Customer & Admin Portal)"]
        Kiosk["🏧 AmenKiosk Terminal<br/>(Touch Screen & Physical Kiosk)"]
        WhatsApp["💬 WhatsApp Clients<br/>(Green API Gateway)"]
    end

    subgraph CoreBackend["Core Backend Infrastructure"]
        API["⚙️ Express.js REST API<br/>(:3000 /api)"]
        SocketServer["⚡ Socket.IO Gateway<br/>(Live Telemetry & Notifications)"]
        Swagger["📖 Swagger UI Docs<br/>(/api-docs)"]
        TotemMonitor["🔍 Totem Watchdog<br/>(Health & Status Monitor)"]
    end

    subgraph PythonServices["AI & Microservices"]
        AmenBot["🤖 AmenBot AI Service<br/>(Flask :5000 / LLaMA 3.3)"]
        HardwareDaemon["🖥️ Hardware Bridge Daemon<br/>(api.py :5001 / OS Telemetry)"]
    end

    subgraph StorageLayer["Data & Cloud Layer"]
        MongoDB[("🍃 MongoDB Database<br/>(Accounts, Transactions, Logs)")]
        Firebase[("🔥 Firebase Realtime DB<br/>(Kiosk State Sync)")]
        TogetherAI["🧠 Together AI Cloud<br/>(LLaMA 70B Inference)"]
    end

    MobileApp -->|HTTPS / WSS| API
    WebApp -->|HTTPS / WSS| API
    Kiosk -->|HTTPS / WSS| API
    Kiosk <-->|Localhost REST| HardwareDaemon
    HardwareDaemon -->|Telemetry Sync| Firebase
    HardwareDaemon -->|Hardware Status| MongoDB

    API <--> SocketServer
    API --> MongoDB
    API <--> AmenBot
    AmenBot <--> TogetherAI
    WhatsApp <--> AmenBot
    TotemMonitor --> MongoDB
```

---

## 🚀 Ecosystem Modules

### 1. AmenConnect (Web & Mobile Banking)
Located in [`AmenConnect/`](file:///Users/mako/Desktop/amenconnect/amenconnect/AmenConnect)
- **Universal Multi-Platform**: Built on Ionic React with Capacitor 7 for seamless deployment to iOS, Android, and modern desktop/mobile browsers.
- **Financial Accounts & Cards**: Real-time balance queries, card activation/blocking, PIN management, and monthly limits.
- **Transfers & Payments**:
  - Instant one-to-one wire transfers (`Virement`).
  - Scheduled automated recurring transfers (`Virement Programmé`).
  - Bulk transfers to multiple beneficiaries (`Virement Groupé`).
- **Interactive Budgeting & Analytics**: Visual expense categorization and budget breakdowns powered by `Recharts`.
- **Branch & ATM Finder**: Interactive geolocation-aware branch locator powered by `Leaflet` and cluster markers.
- **Advisor Video Conferencing**: In-app video appointments and remote support requests with bank advisors.
- **Robust Security**: Multi-factor authentication (2FA SMS/Email OTP), biometric unlock via Capacitor Device, and QR-code web session login.

### 2. AmenKiosk (Self-Service Terminal)
Located in [`AmenKiosk/`](file:///Users/mako/Desktop/amenconnect/amenconnect/AmenKiosk)
- **Touch-First Terminal Interface**: Tailored for full-screen touch totems with customized responsive layouts.
- **Virtual On-Screen Keyboard**: Integrated virtual touch keypad (`react-simple-keyboard`) with high-contrast accessibility.
- **Digital Signature Pad**: Secure client signature capture on-screen (`react-signature-canvas`) for account opening and forms.
- **Dynamic PDF Receipt Generation**: Instant banking receipt, statement, and ticket generation using `jsPDF` and `jspdf-autotable`.
- **QR Quick-Pairing**: Instant QR authentication allowing mobile customers to transfer their session to the terminal.
- **Live Theme Customizer**: Real-time styling engine allowing dynamic branding, banking color palettes, and seasonal kiosk themes.

### 3. Backend (API & Realtime Gateway)
Located in [`Backend/`](file:///Users/mako/Desktop/amenconnect/amenconnect/Backend)
- **RESTful Banking API**: Over 30 modular route controllers covering authentication, credit simulations, payments, card operations, audit logs, and kiosk management.
- **Real-Time Communication**: `Socket.io` connection server handling instant notifications, administrative alerts, and kiosk heartbeat synchronization.
- **Totem Watchdog (`monitorTotems.js`)**: Background polling service monitoring connected kiosk terminals, hardware status, and alerting admins when a terminal goes offline.
- **Enterprise Security**: Rate limiting (`express-rate-limit`), HTTP header protection (`helmet`), CORS enforcement, and audit trail logging with `winston`.
- **Automated Documentation**: Interactive Swagger OpenAPI 3.0 documentation available directly at `/api-docs`.

### 4. AmenBot (Conversational AI & WhatsApp)
Located in [`bot/`](file:///Users/mako/Desktop/amenconnect/amenconnect/bot)
- **Banking LLM Engine**: Powered by Meta-Llama 3.3 70B Instruct Turbo via Together AI.
- **Multi-Turn Context Awareness**: Understands banking queries, explains loan calculations, retrieves account details, and answers customer questions in French, Arabic, and English.
- **WhatsApp Gateway**: Seamless bi-directional messaging with customers via Green API webhook and polling integration.

### 5. Hardware Daemon (`api.py`)
Located in [`api.py`](file:///Users/mako/Desktop/amenconnect/amenconnect/api.py)
- **Cross-Platform Serial Detection**: Detects BIOS/motherboard serial IDs across Windows (`wmic`), Linux (`dmidecode`), and macOS (`ioreg`).
- **Terminal Heartbeat & Telemetry**: Reports CPU, memory, and disk health metrics (`psutil`) to MongoDB and Firebase Realtime Database.
- **Kiosk Approval Handshake**: Validates hardware identifiers against administrator-approved kiosks before enabling financial operations.

---

## 🛠 Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontends** | React 19, TypeScript, Ionic 8, Capacitor 7, Vite 5, Tailwind CSS, Framer Motion |
| **Mapping & Charts** | Leaflet, Leaflet MarkerCluster, Recharts |
| **Kiosk Peripherals** | React Simple Keyboard, React Signature Canvas, jsPDF, QRCode |
| **Backend API** | Node.js (v20+), Express.js (v4.21), Socket.io (v4.8) |
| **Security & Auth** | Passport.js (JWT & Local), bcryptjs, Helmet, Express-Rate-Limit, CORS |
| **Databases** | MongoDB (Mongoose v8), Firebase Realtime Database & Admin SDK |
| **AI & Messaging** | Python 3.11, Flask, Together AI (Llama 3.3), Green API (WhatsApp) |
| **CI/CD & DevOps** | GitHub Actions (CI & CodeQL), Dependabot |

---

## 📋 Prerequisites

Before running the application, ensure the following tools are installed:

- **Node.js**: `v20.x` or higher ([Download](https://nodejs.org/))
- **npm**: `v10.x` or higher
- **Python**: `v3.10` or higher ([Download](https://www.python.org/))
- **MongoDB**: Local instance running on port `27017` or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI.
- **Git**

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/nexusMAKO1/amenconnect.git
cd amenconnect
```

### 2. Backend API Setup

```bash
cd Backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and email credentials

# Start development server
npm run dev
# Server will run at http://localhost:3000
# Swagger API docs available at http://localhost:3000/api-docs
```

### 3. AmenConnect Client Setup (Web & Mobile)

```bash
cd AmenConnect
npm install

# Configure environment
cp .env.example .env

# Run Vite dev server
npm run dev
# Application will launch at https://localhost:8100 (or Vite assigned port)

# To sync Capacitor for native mobile platforms:
npx cap sync
# Open in Android Studio / Xcode:
# npx cap open android
# npx cap open ios
```

### 4. AmenKiosk Terminal Setup

```bash
cd AmenKiosk
npm install

# Configure environment
cp .env.example .env

# Start kiosk dev server
npm run dev
# Kiosk terminal interface runs at http://localhost:8200
```

### 5. AmenBot Service Setup

```bash
cd bot
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run the Flask bot service
python3 app.py
# AmenBot listening on http://localhost:5000
```

### 6. Hardware Bridge Daemon Setup

To run the local hardware serial and telemetric monitor on a physical totem terminal:

```bash
# In the repository root
pip install -r requirements.txt
python3 api.py
# Daemon running on http://127.0.0.1:5001
```

---

## ⚙️ Environment Configuration

### Backend (`Backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP server port | `3000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |
| `CLIENT_ORIGIN` | Allowed client URL for CORS | `http://localhost:8100` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/amenconnect` |
| `JWT_SECRET` | Secret key used to sign authentication tokens | *Required* |
| `EMAIL_USER` | SMTP email for sending 2FA OTP and password resets | *Required* |
| `EMAIL_PASS` | SMTP email app password | *Required* |
| `FLASK_API_URL` | Microservice URL for AmenBot | `http://localhost:5000` |

### AmenBot (`bot/.env`)

| Variable | Description |
| :--- | :--- |
| `TOGETHER_API_KEY` | API Key for Together AI LLaMA inference |
| `TOGETHER_MODEL` | LLM model (`meta-llama/Llama-3.3-70B-Instruct-Turbo`) |
| `GREEN_API_INSTANCE_ID` | Green API WhatsApp instance ID |
| `GREEN_API_TOKEN` | Green API WhatsApp authorization token |

---

## 📖 API Documentation & Swagger

AmenConnect includes interactive Swagger OpenAPI documentation:

1. Start the backend: `cd Backend && npm start`
2. Open your browser and navigate to:
   ```
   http://localhost:3000/api-docs
   ```
3. Explore, inspect schemas, and test all endpoints directly from the interactive UI.

---

## 📂 Project Directory Structure

```plaintext
amenconnect/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   ├── kiosk_issue.md
│   │   └── config.yml
│   ├── workflows/
│   │   ├── ci.yml               # Automated CI (lint, build, syntax)
│   │   └── codeql.yml           # CodeQL security scanning
│   ├── dependabot.yml           # Automated dependency updates
│   └── PULL_REQUEST_TEMPLATE.md # Standard PR checklist
├── AmenConnect/                 # Mobile & Web client (Ionic React + Capacitor)
│   ├── android/                 # Native Android project
│   ├── ios/                     # Native iOS project
│   ├── src/                     # React components, pages, contexts, hooks
│   ├── capacitor.config.ts      # Capacitor runtime configuration
│   └── vite.config.ts           # Vite bundler configuration
├── AmenKiosk/                   # Interactive Totem Kiosk client
│   ├── src/                     # Touch keyboard, signature pad, PDF tickets
│   └── vite.config.ts           # Vite configuration
├── Backend/                     # Core REST API & WebSocket server
│   ├── config/                  # DB, Passport, Swagger, Firebase configurations
│   ├── controllers/             # Business logic controllers
│   ├── middleware/              # Auth, admin, rate-limiting middlewares
│   ├── models/                  # Mongoose data schemas
│   ├── routes/                  # API endpoint definitions
│   ├── monitorTotems.js         # Kiosk watchdog background process
│   ├── app.js                   # Express application setup
│   └── server.js                # HTTP & Socket.IO server entrypoint
├── bot/                         # Conversational AI & WhatsApp bot
│   ├── services/                # Chatbot and Green API integration
│   ├── routes.py                # Bot Flask API endpoints
│   ├── config.py                # Bot configuration
│   └── app.py                   # Bot entrypoint
├── api.py                       # Totem hardware serial & telemetry bridge
├── requirements.txt             # Root Python dependencies
├── package.json                 # Monorepo orchestration scripts
├── CONTRIBUTING.md              # Contribution guide
├── CODE_OF_CONDUCT.md           # Community code of conduct
├── SECURITY.md                  # Vulnerability disclosure policy
├── LICENSE                      # MIT License
└── README.md                    # Project documentation
```

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before submitting pull requests.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat(banking): add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🔒 Security Policy

Security is essential in banking software. If you identify a potential security vulnerability, please refer to our [Security Policy](SECURITY.md) to report it confidentially.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.

---

<p align="center">
  Built with ❤️ for Modern Digital Banking & Smart Branches.
</p>
