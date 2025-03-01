// App.tsx
import React, { useEffect,Suspense, lazy } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';  
import { CarteProvider } from './CarteContext';
import Home from './pages/Home';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword/ResetPassword'));
const ProfileMobile = lazy(() => import('./pages/Client/accueil/MenuMobile/ProfileMobile'));
const SecuritySettingsMobile = lazy(() => import('./pages/Client/accueil/MenuMobile/SecuritySettingsMobile'));
import Otp from './pages/otp/otp';
import Login from './pages/Login/Login';
import Accueil from './pages/Client/accueil/accueil';
import Compte from './pages/Client/Compte/Compte';
import Carte from './pages/Client/Carte/Carte';
import ChatBot from './pages/Client/chatBot/chatBot';
import Virement from './pages/Client/virement/virement';
// Admin routes
import Dashboard from './pages/Admin/Dashboard/Dashboard';
import UserManagement from './pages/Admin/Gestion Utilisateur/UserManagement';
import SurveillanceMonitoring from './pages/Admin/SurveillanceMonitoring/SurveillanceMonitoring';
import PermissionsManagement from './pages/Admin/Permissions/permissionsManagement';
import AuthenticationSecurity from './pages/Admin/AuthenticationSecurity/AuthenticationSecurity';
import InteractiveTotemManagement from './pages/Admin/Gestion des Totem/InteractiveTotemManagement';

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
const QRScanner = lazy(() => import('./pages/Client/accueil/qrscanner'));

setupIonicReact();

const AppContent: React.FC = () => {
  const { isAuthenticated, pendingUser } = useAuth();

  useEffect(() => {
  }, [isAuthenticated]);

  return (
    <IonReactRouter>
       <Suspense fallback={<div>Loading...</div>}></Suspense>
      <IonRouterOutlet>
        {/* Public routes */}
        <Route exact path="/home" component={Home} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/ForgotPassword" component={ForgotPassword} />
        <Route exact path="/ResetPassword" component={ResetPassword} />
        <Route exact path="/qr-scanner" component={QRScanner} />
        {/* Render OTP page only if a user exists (i.e. after login/OTP step) */}
        <Route exact path="/otp" render={(props) => pendingUser ? <Otp {...props} /> : <Redirect to="/login" /> }/>

        {/* Protected routes */}
        <PrivateRoute exact path="/accueil" component={Accueil} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/compte" component={Compte} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/carte" component={Carte} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/chatBot" component={ChatBot} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/virement" component={Virement} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/profile" component={ProfileMobile} isAuthenticated={isAuthenticated} />
        <PrivateRoute exact path="/SecuritySettingsMobile" component={SecuritySettingsMobile} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/Dashboard" component={Dashboard} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/UserManagement" component={UserManagement} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/SurveillanceMonitoring" component={SurveillanceMonitoring} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/PermissionsManagement" component={PermissionsManagement} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/AuthenticationSecurity" component={AuthenticationSecurity} isAuthenticated={isAuthenticated} />
        <PrivateRoute path="/InteractiveTotemManagement" component={InteractiveTotemManagement} isAuthenticated={isAuthenticated} />

        <Route exact path="/" render={() => <Redirect to="/home" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <CarteProvider>  {/* Wrap the application with the CarteProvider */}
      <IonApp>
        <AppContent />
      </IonApp>
    </CarteProvider>
  </AuthProvider>
);

export default App;
