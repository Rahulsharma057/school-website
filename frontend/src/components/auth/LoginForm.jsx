"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { useRouter } from "next/navigation";

import { loginSchema } from "@/validations/loginSchema";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const router = useRouter();

  const { login, loading: authLoading } = useAuth();

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

  const onSubmit = async (data) => {
    const success = await login(data);

    if (success) {
      router.replace("/admin/dashboard");
      router.refresh();
    }
  };

  return (
    <Card
      sx={{
        maxWidth: 420,
        mx: "auto",
        mt: 10,
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          sx={{
            mb: 3,
            textAlign: "center",
          }}
        >
          Admin Login
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Email"
            margin="normal"
            autoComplete="email"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <TextField
            fullWidth
            type="password"
            label="Password"
            margin="normal"
            autoComplete="current-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isSubmitting || authLoading}
            sx={{ mt: 2 }}
          >
            {isSubmitting || authLoading ? "Logging in..." : "Login"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}