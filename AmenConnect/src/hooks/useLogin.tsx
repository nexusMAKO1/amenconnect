// hooks/useLogin.tsx
import { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../AuthContext";

export function useLogin() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const history = useHistory();
  const { setPendingUser } = useAuth();

  const login = async (email: string, password: string) => {
    setErrorMessage("");
    setIsLoading(true);

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Veuillez remplir tous les champs.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage("Veuillez saisir une adresse email valide.");
      setIsLoading(false);
      return;
    }

    try {
      // Send credentials to your backend
      const response = await axios.post(
        "/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      // If login is successful, set pending user before OTP verification
      if (response.data.message) {
        setPendingUser({ email });
        // Optionally, pass user info via location state if needed by OTP pages
        history.replace("/otp", { user: { email } });
      } else {
        throw new Error("Réponse inattendue.");
      }
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || "Erreur inattendue.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, errorMessage, login };
}
