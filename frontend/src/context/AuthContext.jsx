"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  loginUser,
  logoutUser,
  getProfile,
  registerUser,
} from "@/services/authService";

import { toast } from "react-toastify";

const AuthContext = createContext();

// role ke hisaab se decide karta hai user ko kahan bhejna hai
const getRedirectPath = (role) => {
  const staffRoles = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"];
  if (staffRoles.includes(role)) {
    return "/admin/dashboard";
  }
  // STUDENT, TEACHER, PARENT
  return "/";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // LOGIN
  const login = async (data) => {
    try {
      const response = await loginUser(data);

      if (response.data.success) {
        const loggedInUser = response.data.data;
        setUser(loggedInUser);

        toast.success("Login successful");

        const redirectPath = getRedirectPath(loggedInUser.role);
        router.replace(redirectPath);
        router.refresh();

        return loggedInUser; // ← role ke saath return karo, taaki caller bhi check kar sake agar chahe
      }

      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await logoutUser();
      setUser(null);
      toast.success("Logout successful");
      router.push("/login");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // REGISTER
  const register = async (data) => {
    try {
      const response = await registerUser(data);

      if (response.data.success) {
        toast.success("Registration successful");
        return true;
      }

      return false;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      return false;
    }
  };

  // CHECK SESSION
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const response = await getProfile();

        if (mounted && response.data.success) {
          setUser(response.data.data);
        }
      } catch (error) {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // login/register page par profile call nahi karni
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/login" ||
        window.location.pathname === "/register")
    ) {
      setLoading(false);
      return;
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
