"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface UserSummary {
  id: string;
  merchant_id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export interface MerchantSummary {
  id: string;
  name: string;
  slug: string;
  currency: string;
  country: string;
  business_category?: string;
  description?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: UserSummary | null;
  merchant: MerchantSummary | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    store_name: string;
    business_category?: string;
    currency?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [merchant, setMerchant] = useState<MerchantSummary | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshProfile = async () => {
    try {
      const storedToken = localStorage.getItem("revora_access_token");
      if (!storedToken) {
        setUser(null);
        setMerchant(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setMerchant(data.merchant);
      } else {
        // Token invalid or expired
        localStorage.removeItem("revora_access_token");
        setUser(null);
        setMerchant(null);
        setToken(null);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Invalid email or password.");
      }

      const data = await res.json();
      localStorage.setItem("revora_access_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setMerchant(data.merchant);
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (formData: {
    email: string;
    password: string;
    full_name: string;
    store_name: string;
    business_category?: string;
    currency?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Registration failed.");
      }

      const data = await res.json();
      localStorage.setItem("revora_access_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setMerchant(data.merchant);
      router.push("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    } catch {
      // Ignore network errors during logout
    }
    localStorage.removeItem("revora_access_token");
    setUser(null);
    setMerchant(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        merchant,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
