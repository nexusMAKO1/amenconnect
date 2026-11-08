"use client"

import type React from "react"
import { Redirect, Route } from "react-router-dom"
import {
  IonApp,
  IonRouterOutlet,
  setupIonicReact,
  IonSpinner,
} from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Suspense, lazy, useEffect } from "react"
import "./theme/global.css"

// Core & Basic CSS for Ionic
import "@ionic/react/css/core.css"
import "@ionic/react/css/normalize.css"
import "@ionic/react/css/structure.css"
import "@ionic/react/css/typography.css"
import "@ionic/react/css/padding.css"
import "@ionic/react/css/float-elements.css"
import "@ionic/react/css/text-alignment.css"
import "@ionic/react/css/text-transformation.css"
import "@ionic/react/css/flex-utils.css"
import "@ionic/react/css/display.css"
import "@ionic/react/css/palettes/dark.system.css"
import "./theme/variables.css"

// Context providers for public routes (if needed)
import { OrientationProvider } from "./context/OrientationContext"
import { ThemeProvider } from "../../ThemeContext"
import ThemeLoader from "./context/ThemeLoader";
import ChatBotKiosk from "./pages/chatBot/chat-bot-kiosk";
// Lazy loaded components for public pages
const Accueil = lazy(() => import("./pages/accueil/AccueilKiosk"))
const Compte = lazy(() => import("./pages/Compte/CompteKiosk"))
const Carte = lazy(() => import("./pages/Carte/CarteKiosk"))
const ThemeCustomizerPage = lazy(() => import("./theme-customizer-page"))
const KioskSetup = lazy(() => import("./components/KioskComponents/kiosk-setup"))
const Home = lazy(() =>
  import("./pages/Home").catch((err) => {
    console.error("Failed to load Home component:", err)
    return {
      default: () => (
        <div>An error occurred while loading the Home component.</div>
      ),
    }
  }),
)
import ModeInvite from "./pages/modeinvite/mode-invite"

const Login = lazy(() =>
  import("./pages/login/login").catch((err) => {
    console.error("Failed to load Login component:", err)
    return {
      default: () => (
        <div>An error occurred while loading the Login component.</div>
      ),
    }
  }),
)
const AccountCreation = lazy(() =>
  import("./pages/AccountCreationForm").catch((err) => {
    console.error("Failed to load AccountCreation component:", err)
    return {
      default: () => (
        <div>An error occurred while loading the AccountCreation component.</div>
      ),
    }
  }),
)
const ForgotPassword = lazy(() =>
  import("./pages/login/ForgotPassword/ForgotPassword").catch((err) => {
    console.error("Failed to load ForgotPassword component:", err)
    return {
      default: () =>
        <div>An error occurred while loading ForgotPassword.</div>,
    }
  }),
)
const Otp = lazy(() =>
  import("./pages/otp/otp").catch((err) => {
    console.error("Failed to load Otp component:", err)
    return {
      default: () =>
        <div>An error occurred while loading the Otp component.</div>,
    }
  }),
)

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="kiosk-loading-container">
    <div className="kiosk-loading-content animate-fade-in">
      <IonSpinner name="circles" className="kiosk-spinner" />
      <p className="loading-text">Chargement en cours...</p>
    </div>
  </div>
)

setupIonicReact({
  mode: "md",
  hardwareBackButton: false,
})

// A wrapper for private pages, which are only accessible when authenticated.
// These routes are wrapped with AuthProvider to get authentication context.
import PrivateRoute from "./context/PrivateRoute"
import { AuthProvider } from "./context/AuthContext"
import { CarteProvider } from "./context/CarteContext"
import Virement from "./pages/virement/virement"

const App: React.FC = () => {
  // Remove any useAuth calls here since this part of the app is public.
  useEffect(() => {
    const handleResize = () => {
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      )
      document.documentElement.style.setProperty(
        "--viewport-width",
        `${window.innerWidth}px`
      )
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <ThemeProvider>
      <OrientationProvider>
        {/* Single root AuthProvider for entire app */}
        <AuthProvider>
          <CarteProvider>
            <IonApp className="kiosk-app">
              {/* Load theme variables from MongoDB */}
              <ThemeLoader />
              <IonReactRouter>
                <Suspense fallback={<LoadingFallback />}>
                  <IonRouterOutlet>
                    {/* Public Routes */}
                    <Route exact path="/home">
                      <Home />
                    </Route>
                    <Route exact path="/modeinvite">
                      <ModeInvite />
                    </Route>
                    <Route exact path="/login">
                      <Login />
                    </Route>
                    <Route exact path="/account-creation">
                      <AccountCreation onBack={() => window.history.back()} />
                    </Route>
                    <Route exact path="/otp">
                      <Otp />
                    </Route>
                    <Route exact path="/forgot-password">
                      <ForgotPassword onBack={() => window.history.back()} />
                    </Route>
                    <Route exact path="/">
                      <Redirect to="/home" />
                    </Route>
                    <Route exact path="/theme">
                      <ThemeCustomizerPage />
                    </Route>
                    <Route exact path="/setup">
                      <KioskSetup />
                    </Route>

                    {/* Protected Private Routes */}
                    <PrivateRoute exact path="/accueil" component={Accueil} />
                    <PrivateRoute exact path="/compte" component={Compte} />
                    <PrivateRoute exact path="/carte" component={Carte} />
                    <PrivateRoute exact path="/chatbot" component={ChatBotKiosk} />
                    <PrivateRoute exact path="/virement" component={Virement} />
                  </IonRouterOutlet>
                </Suspense>
              </IonReactRouter>
            </IonApp>
          </CarteProvider>
        </AuthProvider>
      </OrientationProvider>
    </ThemeProvider>
  );
}
export default App
