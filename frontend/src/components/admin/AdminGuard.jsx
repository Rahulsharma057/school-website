"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { CircularProgress, Box, Typography } from "@mui/material";

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "ACCOUNTANT"];

export default function AdminGuard({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return null;

  // general check — staff role hai ya nahi
  if (!STAFF_ROLES.includes(user.role)) {
    return (
      <Box sx={{ p: 5 }}>
        <Typography>Access denied — staff only.</Typography>
      </Box>
    );
  }

  // page-specific check (agar diya ho)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <Box sx={{ p: 5 }}>
        <Typography>Access denied — you don't have permission to view this page.</Typography>
      </Box>
    );
  }

  return children;
}