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

import { registerSchema } from "@/validations/registerSchema";

import { useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

export default function RegisterForm() {
  const router = useRouter();

  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),

    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    const success = await registerUser(data);

    if (success) {
      router.replace("/login");
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
          Student Register
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Name"
            margin="normal"
            {...register("name")}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

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
            autoComplete="new-password"
            {...register("password")}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            margin="normal"
            {...register("confirmPassword")}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={isSubmitting}
            sx={{
              mt: 2,
            }}
          >
            {isSubmitting ? "Registering..." : "Register"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
