import { IonContent, IonPage, IonInput, IonButton, IonText, IonLabel, IonImg } from "@ionic/react";
import { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../AuthContext"; // Import the useAuth hook
import "./LoginDesktop.css";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setIsAuthenticated } = useAuth(); // Get setIsAuthenticated from context
  const history = useHistory();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      // Sending a POST request to the backend for login
      const response = await axios.post("/api/auth/login", { email, password });
      console.log("Login successful:", response.data);

      // Assuming the response contains the user data
      const user = response.data.user;

      // Store user data in localStorage for further use
      localStorage.setItem("user", JSON.stringify(user));

      // Set the user as authenticated
      setIsAuthenticated(true);

      // Redirect to the OTP page and pass the user data (email) as state
      history.push("/otp", { user });

    } catch (error: any) {
      console.error("Login error:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding login-container" fullscreen>
        <div className="content-wrapper">
          <div className="login-box">
            <div className="logo-container-accueil-desktop">
              <IonImg src="../amen_logo.png" alt="Logo" className="logo-accueil-desktop" />
            </div>
            <div className="form-container">
              <h1 className="title-accueil-desktop">Bienvenu</h1>
              <p className="subtitle">Veuillez saisir les détails de votre compte</p>

              <form onSubmit={handleLogin} className="login-form">
                <div className="input-group">
                  <IonLabel className="input-label">Identifiant</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value!)}
                    className="custom-input"
                    required
                  />
                </div>

                <div className="input-group">
                  <IonLabel className="input-label">Mot De Passe</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonChange={(e) => setPassword(e.detail.value!)}
                    className="custom-input"
                    required
                  />
                </div>

                {errorMessage && (
                  <IonText color="danger" className="error-message">
                    {errorMessage}
                  </IonText>
                )}

                <IonText className="forgot-password">
                  <a href="/forgot-password">Mot De Passe oublier ?</a>
                </IonText>

                <IonButton expand="block" type="submit" className="login-button" disabled={isLoading}>
                  {isLoading ? "Chargement..." : "Se Connecter"}
                </IonButton>
              </form>
            </div>
          </div>
        </div>
        <div className="blurry-div"></div>
      </IonContent>
    </IonPage>
  );
}
