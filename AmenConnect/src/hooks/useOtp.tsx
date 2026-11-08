import { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import { IonInput } from "@ionic/react";

interface UseOtpProps {
  email: string;
  onSuccess: () => void;
  initialCountdown?: number;
}

export default function useOtp({
  email,
  onSuccess,
  initialCountdown = 90,
}: UseOtpProps) {
  const [otp, setOtp] = useState<string>("");
  const inputRefs = useRef<(HTMLIonInputElement | null)[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Countdown effect for enabling resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (/^\d{6}$/.test(value)) {
      // If a 6-digit number is pasted in one go
      setOtp(value);
      inputRefs.current[5]?.setFocus();
    } else if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      // Update OTP string by replacing the character at the current index
      const newOtp = otp.slice(0, index) + value + otp.slice(index + 1);
      setOtp(newOtp);
      if (value && index < 5) {
        inputRefs.current[index + 1]?.setFocus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.setFocus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedData = e.clipboardData.getData("Text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      setOtp(pastedData);
      inputRefs.current[5]?.setFocus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage("Veuillez saisir un code OTP valide à 6 chiffres.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      await axios.post(
        "/api/auth/verify-otp",
        { email, otp },
        { withCredentials: true }
      );
      onSuccess();
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "OTP verification failed."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      await axios.post(
        "/api/auth/resend-otp",
        { email },
        { withCredentials: true }
      );
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.message || "Error resending OTP."
      );
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return {
    otp,
    setOtp,
    inputRefs,
    errorMessage,
    isLoading,
    countdown,
    canResend,
    handleOtpChange,
    handleKeyDown,
    handlePaste,
    handleSubmit,
    handleResend,
  };
}
