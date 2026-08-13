"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import SchoolIcon from "@mui/icons-material/School";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import Link from "next/link";

import { loginSchema } from "@/validations/loginSchema";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { login, loading: authLoading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect logic ab AuthContext ke andar hai — yahan sirf login call karo
  const onSubmit = async (data) => {
    await login(data);
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f8f7fb 0%, #f1eef7 50%, #fafafa 100%)",
        px: 2,
        py: 5,
      }}
    >
      <Container maxWidth="xs" sx={{ px: { xs: 0, sm: 2 } }}>
        <Card
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 3,
            border: "1px solid #e4e4e7",
            backgroundColor: "#fff",
            overflow: "hidden",
            boxShadow: "0 12px 40px rgba(0, 0, 0, 0.07)",
          }}
        >
          {/* ================= HEADER ================= */}
          <Box
            sx={{
              px: 3,
              pt: 4,
              pb: 3,
              textAlign: "center",
              background: "linear-gradient(135deg, #6B12B7 0%, #702f9c 100%)",
              color: "#fff",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: "auto",
                mb: 2,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <SchoolIcon sx={{ fontSize: 34 }} />
            </Box>

            <Typography
              sx={{ fontSize: 23, fontWeight: 700, letterSpacing: 0.2 }}
            >
              SSGIC
            </Typography>

            <Typography sx={{ mt: 0.5, fontSize: 13, opacity: 0.9 }}>
              School Management Portal
            </Typography>
          </Box>

          {/* ================= CONTENT ================= */}
          <CardContent
            sx={{
              p: { xs: 3, sm: 4 },
              "&:last-child": { pb: { xs: 3, sm: 4 } },
            }}
          >
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontSize: 21,
                  fontWeight: 700,
                  color: "#18181b",
                  mb: 0.5,
                }}
              >
                Welcome Back
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: "#71717a" }}>
                Sign in to access the administration panel.
              </Typography>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* ================= FORM ================= */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                margin="normal"
                autoComplete="email"
                disabled={isLoading}
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        sx={{ fontSize: 16, fontWeight: 600, color: "#71717a" }}
                      >
                        @
                      </Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 1,
                  "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                margin="normal"
                autoComplete="current-password"
                disabled={isLoading}
                {...register("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        sx={{ fontSize: 19, color: "#71717a" }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        edge="end"
                        disabled={isLoading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  height: 46,
                  borderRadius: 1.5,
                  textTransform: "none",
                  fontSize: 14.5,
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg, #6B12B7 0%, #702f9c 100%)",
                  boxShadow: "none",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #5b0fa0 0%, #63288d 100%)",
                    boxShadow: "0 5px 15px rgba(107,18,183,0.20)",
                  },
                  "&.Mui-disabled": { background: "#d4d4d8", color: "#fff" },
                }}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <Box sx={{ mt: 2.5, textAlign: "center" }}>
                <Typography
                  component="span"
                  sx={{ fontSize: 13, color: "#71717a" }}
                >
                  Don't have an account?{" "}
                </Typography>
                <Link
                  href="/register"
                  style={{
                    textDecoration: "none",
                    color: "#6B12B7",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  Register
                </Link>
              </Box>
            </Box>

            <Typography
              sx={{
                mt: 3,
                textAlign: "center",
                fontSize: 11.5,
                color: "#a1a1aa",
              }}
            >
              Authorized access only
            </Typography>
          </CardContent>
        </Card>

        <Typography
          sx={{
            mt: 2.5,
            textAlign: "center",
            fontSize: 11.5,
            color: "#a1a1aa",
          }}
        >
          © {new Date().getFullYear()} SSGIC. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
