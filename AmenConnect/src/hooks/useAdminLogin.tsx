// hooks/useAdminLogin.tsx
import { useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useAdminAuth } from "../AdminAuthContext";

export function useAdminLogin() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const history = useHistory();
  const { setPendingAdmin } = useAdminAuth();

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
      // Call the admin login endpoint
      const response = await axios.post(
        "/api/admin/login",
        { email, password },
        { withCredentials: true }
      );

      // On successful login, store pending admin info (if OTP or extra step is used)
      // and redirect to the admin dashboard.
      if (response.data.message) {
        setPendingAdmin({ email });
        history.replace("/admin/otp");
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
