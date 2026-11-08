// AdminAuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import axios from "axios";

export interface AdminProfile {
  _id: string;
  cin: string;
  name: string;
  email: string;
  phone: string;
  dateDeNaissance: string;
  role: string;
  department: string;
  // Add any additional admin fields here as needed
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
  adminProfile: AdminProfile | null;
  setAdminProfile: (profile: AdminProfile | null) => void;
  pendingAdmin: { email: string } | null;
  setPendingAdmin: (admin: { email: string } | null) => void;
  authLoading: boolean;
  refreshAdminProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [pendingAdmin, setPendingAdmin] = useState<{ email: string } | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const refreshAdminProfile = useCallback(async () => {
    try {
      const response = await axios.get("/api/admin/profile", { withCredentials: true });
      if (response.data && response.data.admin) {
        setAdminProfile(response.data.admin);
        setIsAuthenticated(true);
      } else {
        setAdminProfile(null);
        setIsAuthenticated(false);
      }
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error("Error refreshing admin profile:", error);
      }
      setAdminProfile(null);
      setIsAuthenticated(false);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminProfile();
  }, [refreshAdminProfile]);

  const contextValue = useMemo<AdminAuthContextType>(
    () => ({
      isAuthenticated,
      setIsAuthenticated,
      adminProfile,
      setAdminProfile,
      pendingAdmin,
      setPendingAdmin,
      authLoading,
      refreshAdminProfile,
    }),
    [isAuthenticated, adminProfile, pendingAdmin, authLoading, refreshAdminProfile]
  );

  return (
    <AdminAuthContext.Provider value={contextValue}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};
