"use client"

// src/App.tsx
import type React from "react"
import { lazy, Suspense, useEffect } from "react"
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react"
import { IonReactRouter } from "@ionic/react-router"
import { Route, Redirect } from "react-router-dom"
import { AuthProvider, useAuth } from "./AuthContext"
import { AdminAuthProvider } from "./AdminAuthContext"
import { CarteProvider } from "./CarteContext"
import PrivateRoute from "./PrivateRoute"
import AdminPrivateRoute from "./AdminPrivateRoute"
import KioskPrivateRoute from "./KioskPrivateRoute" // Import the kiosk private route
import JitsiMeetComponent from "./components/JitsiMeetComponent"
import NotFound from "./components/NotFound"
import { LoadingProvider } from "./components/LoadingContext"
import LoadingBar from "./components/LoadingBar"
import LoadingProgressBar from "./components/LoadingProgressBar"

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
import "./theme/variables.css"

setupIonicReact()

// Lazy load pages and components (existing ones)
import Home from "./pages/Home"
import HomeKiosk from "./pages/HomeKiosk"
import KioskSetup from "./components/KioskComponents/kiosk-setup"
import Login from "./pages/Login/Login"
import ModeInvite from "./pages/ModeInvite/ModeInvite"
const ForgotPassword = lazy(() => import("./pages/ForgotPassword/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword/ResetPassword"))
const AccountCreationForm = lazy(() => import("./pages/AccountCreationForm"))
const QRScanner = lazy(() => import("./pages/Client/accueil/qrscanner"))
const Otp = lazy(() => import("./pages/otp/otp"))
const TestPay = lazy(() => import("./pages/payment-form"))
const GestionCredit = lazy(() => import("./pages/Admin/GestionCredit/GestionCredit"))

// Lazy load protected client pages
const Accueil = lazy(() => import("./pages/Client/accueil/accueil"))
const Compte = lazy(() => import("./pages/Client/Compte/Compte"))
const Carte = lazy(() => import("./pages/Client/Carte/Carte"))
const ChatBot = lazy(() => import("./pages/Client/chatBot/chatBot"))
const Virement = lazy(() => import("./pages/Client/virement/virement"))
const ProfileMobile = lazy(() => import("./pages/Client/accueil/MenuMobile/ProfileMobile"))
const SecuritySettingsMobile = lazy(() => import("./pages/Client/accueil/MenuMobile/SecuritySettingsMobile"))
const ResetPasswordAdmin = lazy(() => import("./pages/AdminForgetPassword/ResetPassword"))
const AdminForgetPassword = lazy(() => import("./pages/AdminForgetPassword/forgot-password"))

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/AdminLogin/AdminLogin"))
const AdminOtp = lazy(() => import("./pages/AdminOtp/AdminOtp"))
const Dashboard = lazy(() => import("./pages/Admin/Dashboard/Dashboard"))
const UserManagement = lazy(() => import("./pages/Admin/GestionUtilisateur/UserManagement"))
const SurveillanceMonitoring = lazy(() => import("./pages/Admin/SurveillanceMonitoring/SurveillanceMonitoring"))
const PermissionsManagement = lazy(() => import("./pages/Admin/Permissions/permissionsManagement"))
const AuthenticationSecurity = lazy(() => import("./pages/Admin/AuthenticationSecurity/AuthenticationSecurity"))
const InteractiveTotemManagement = lazy(() => import("./pages/Admin/GestiondesTotem/InteractiveTotemManagement"))
const VideoConferenceManagement = lazy(() => import("./pages/Admin/videoconfmanage/videoconfmanage"))
const theme = lazy(() => import("./pages/Admin/Themes/page"))
// Lazy load your kiosk component
const KioskComponent = lazy(() => import("./pages/HomeKiosk"))

const AppContent: React.FC = () => {
  const { isAuthenticated, pendingUser } = useAuth()

  useEffect(() => {
    // Additional side effects can be added here if needed.
  }, [isAuthenticated])

  return (
    <IonReactRouter>
      <LoadingProvider>
        {/* The LoadingBar will appear at the top of the page when isLoading is true */}
        <LoadingBar />

        <Suspense fallback={<LoadingProgressBar />}>
          <IonRouterOutlet>
            {/* Public Routes */}
            <Route exact path="/testpay" component={TestPay} />
            <Route exact path="/admin/reset-password" component={ResetPasswordAdmin} />
            <Route exact path="/admin/forgot-password" component={AdminForgetPassword} />
            <Route exact path="/home" component={Home} />
            <Route exact path="/setup" component={KioskSetup} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/admin/otp" component={AdminOtp} />
            <Route exact path="/admin/login" component={AdminLogin} />
            <Route exact path="/totem/kiosk" component={HomeKiosk} />
            <Route exact path="/ForgotPassword" component={ForgotPassword} />
            <Route exact path="/ResetPassword" component={ResetPassword} />
            <Route exact path="/ModeInvite" component={ModeInvite} />
            <Route exact path="/qr-scanner" component={QRScanner} />
            <Route exact path="/auth" render={({ location }) => <Redirect to={{ pathname: "/qr-scanner", search: location.search }} />} />
            <Route exact path="/accountcreation" component={AccountCreationForm} />
            <Route exact path="/admin/Themes" component={theme} />
            <Route path="/video/:roomId" component={JitsiMeetComponent} />
            <Route
              exact
              path="/otp"
              render={(props) => (pendingUser ? <Otp {...props} /> : <Redirect to="/login" />)}
            />

            {/* Protected Client Routes */}
            <PrivateRoute exact path="/accueil" component={Accueil} isAuthenticated={isAuthenticated} />
            <PrivateRoute exact path="/compte" component={Compte} isAuthenticated={isAuthenticated} />
            <PrivateRoute exact path="/carte" component={Carte} isAuthenticated={isAuthenticated} />
            <PrivateRoute exact path="/chatBot" component={ChatBot} isAuthenticated={isAuthenticated} />
            <PrivateRoute exact path="/virement" component={Virement} isAuthenticated={isAuthenticated} />
            <PrivateRoute exact path="/profile" component={ProfileMobile} isAuthenticated={isAuthenticated} />
            <PrivateRoute
              exact
              path="/SecuritySettingsMobile"
              component={SecuritySettingsMobile}
              isAuthenticated={isAuthenticated}
            />

            {/* Protected Admin Routes */}
            <AdminPrivateRoute exact path="/admin/dashboard" component={Dashboard} />
            <AdminPrivateRoute path="/admin/userManagement" component={UserManagement} />
            <AdminPrivateRoute path="/admin/surveillanceMonitoring" component={SurveillanceMonitoring} />
            <AdminPrivateRoute path="/admin/permissionsManagement" component={PermissionsManagement} />
            <AdminPrivateRoute path="/admin/authenticationSecurity" component={AuthenticationSecurity} />
            <AdminPrivateRoute path="/admin/interactiveTotemManagement" component={InteractiveTotemManagement} />
            <AdminPrivateRoute path="/admin/VideoConferenceManagement" component={VideoConferenceManagement} />
            <AdminPrivateRoute path="/admin/GestionCredit" component={GestionCredit} />

            {/* Protected Kiosk Route */}
            <KioskPrivateRoute exact path="/totem/login" component={KioskComponent} />
            <KioskPrivateRoute path="/Home/HomeKiosk" component={HomeKiosk} />

            <Route exact path="/" render={() => <Redirect to="/home" />} />
            <Route component={NotFound} />
          </IonRouterOutlet>
        </Suspense>
      </LoadingProvider>
    </IonReactRouter>
  )
}

const App: React.FC = () => (
  <AuthProvider>
    <AdminAuthProvider>
      <CarteProvider>
        <IonApp>
          <AppContent />
        </IonApp>
      </CarteProvider>
    </AdminAuthProvider>
  </AuthProvider>
)

export default App
