"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Box, CircularProgress } from "@mui/material";

import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";

import { useAuth } from "@/context/AuthContext";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const { user, loading } = useAuth();

  useEffect(() => {
    // Auth check abhi complete nahi hua
    if (loading) return;

    // Login nahi hai
    if (!user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // User staff role ka nahi hai
    if (!STAFF_ROLES.includes(user.role)) {
      router.replace("/portal/profile");
    }
  }, [user, loading, pathname, router]);

  // Jab tak authentication check ho raha hai
  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect hone se pehle protected content mat dikhao
  if (!user) {
    return null;
  }

  // Wrong role ke case mein admin UI render mat karo
  if (!STAFF_ROLES.includes(user.role)) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px",
          minWidth: 0,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
