// src/App.tsx
import React, { lazy, Suspense, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { CarteProvider } from './CarteContext';
import PrivateRoute from './PrivateRoute';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import './theme/variables.css';

setupIonicReact();

// Lazy load public pages
import Home from './pages/Home';
import Login from './pages/Login/Login';
import ModeInvite from './pages/ModeInvite/ModeInvite';
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));
const AccountCreationForm = lazy(() => import('./pages/AccountCreationForm'));
const QRScanner = lazy(() => import('./pages/Client/accueil/qrscanner'));
const Otp = lazy(() => import('./pages/otp/otp'));

// Lazy load protected client pages
const Accueil = lazy(() => import('./pages/Client/accueil/accueil'));
const Compte = lazy(() => import('./pages/Client/Compte/Compte'));
const Carte = lazy(() => import('./pages/Client/Carte/Carte'));
const ChatBot = lazy(() => import('./pages/Client/chatBot/chatBot'));
const Virement = lazy(() => import('./pages/Client/virement/virement'));
const ProfileMobile = lazy(() => import('./pages/Client/accueil/MenuMobile/ProfileMobile'));
const SecuritySettingsMobile = lazy(() => import('./pages/Client/accueil/MenuMobile/SecuritySettingsMobile'));

// Lazy load admin pages
const Dashboard = lazy(() => import('./pages/Admin/Dashboard/Dashboard'));
const UserManagement = lazy(() => import('./pages/Admin/Gestion Utilisateur/UserManagement'));
const SurveillanceMonitoring = lazy(() => import('./pages/Admin/SurveillanceMonitoring/SurveillanceMonitoring'));
const PermissionsManagement = lazy(() => import('./pages/Admin/Permissions/permissionsManagement'));
const AuthenticationSecurity = lazy(() => import('./pages/Admin/AuthenticationSecurity/AuthenticationSecurity'));
const InteractiveTotemManagement = lazy(() => import('./pages/Admin/Gestion des Totem/InteractiveTotemManagement'));

const AppContent: React.FC = () => {
  const { isAuthenticated, pendingUser } = useAuth();

  useEffect(() => {
    // You can add additional side effects if needed
  }, [isAuthenticated]);

  return (
    <IonReactRouter>
      {/* Wrap your routes with Suspense and a fallback UI */}
      <Suspense fallback={<div>Loading...</div>}>
        <IonRouterOutlet>
          {/* Public routes */}
          <Route exact path="/home" component={Home} />
          <Route exact path="/login" component={Login} />
          <Route exact path="/ForgotPassword" component={ForgotPassword} />
          <Route exact path="/ResetPassword" component={ResetPassword} />
          <Route exact path="/ModeInvite" component={ModeInvite} />
          <Route exact path="/qr-scanner" component={QRScanner} />
          <Route exact path="/accountcreation" component={AccountCreationForm} />
          <Route
            exact
            path="/otp"
            render={(props) =>
              pendingUser ? <Otp {...props} /> : <Redirect to="/login" />
            }
          />

          {/* Protected routes */}
          <PrivateRoute
            exact
            path="/accueil"
            component={Accueil}
            isAuthenticated={isAuthenticated}
          />
            
            
          <PrivateRoute
            exact
            path="/compte"
            component={Compte}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            exact
            path="/carte"
            component={Carte}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            exact
            path="/chatBot"
            component={ChatBot}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            exact
            path="/virement"
            component={Virement}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            exact
            path="/profile"
            component={ProfileMobile}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            exact
            path="/SecuritySettingsMobile"
            component={SecuritySettingsMobile}
            isAuthenticated={isAuthenticated}
          />

          {/* Admin routes */}
          <PrivateRoute
            path="/Dashboard"
            component={Dashboard}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            path="/UserManagement"
            component={UserManagement}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            path="/SurveillanceMonitoring"
            component={SurveillanceMonitoring}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            path="/PermissionsManagement"
            component={PermissionsManagement}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            path="/AuthenticationSecurity"
            component={AuthenticationSecurity}
            isAuthenticated={isAuthenticated}
          />
          <PrivateRoute
            path="/InteractiveTotemManagement"
            component={InteractiveTotemManagement}
            isAuthenticated={isAuthenticated}
          />

          <Route exact path="/" render={() => <Redirect to="/home" />} />
        </IonRouterOutlet>
      </Suspense>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <CarteProvider>
      <IonApp>
        <AppContent />
      </IonApp>
    </CarteProvider>
  </AuthProvider>
);

export default App;
