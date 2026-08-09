"use client";

import { useEffect } from "react";

import {
  Box,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { navbarSchema } from "@/validations/navbarSchema";
import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

import ColorPicker from "./ColorPicker";

export default function NavbarForm({ navbar }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(navbarSchema),
    defaultValues: {
      schoolName: "",
      shortName: "",

      primaryColor: "#1976d2",
      secondaryColor: "#0d47a1",

      sticky: true,
      transparent: false,

      showTopBar: true,
      topBarEmail: "",
      topBarPhone: "",
      topBarAddress: "",

      showLoginButton: true,
      loginButtonText: "Login",
      loginButtonLink: "/login",

      showAdmissionButton: true,
      admissionButtonText: "Admission Open",
      admissionButtonLink: "/admission",
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset(navbar);
    }
  }, [navbar, reset]);

  const onSubmit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
    });

    mutate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="School Name"
            {...register("schoolName")}
            error={!!errors.schoolName}
            helperText={errors.schoolName?.message}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Short Name" {...register("shortName")} />
        </Grid>

        <Grid item xs={12} md={6}>
          <ColorPicker
            label="Primary Color"
            value={watch("primaryColor")}
            onChange={(value) => setValue("primaryColor", value)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ColorPicker
            label="Secondary Color"
            value={watch("secondaryColor")}
            onChange={(value) => setValue("secondaryColor", value)}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={watch("sticky")}
                onChange={(e) => setValue("sticky", e.target.checked)}
              />
            }
            label="Sticky Navbar"
          />

          <FormControlLabel
            control={
              <Switch
                checked={watch("transparent")}
                onChange={(e) => setValue("transparent", e.target.checked)}
              />
            }
            label="Transparent"
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={watch("showLoginButton")}
                onChange={(e) => setValue("showLoginButton", e.target.checked)}
              />
            }
            label="Show Login Button"
          />

          <FormControlLabel
            control={
              <Switch
                checked={watch("showAdmissionButton")}
                onChange={(e) =>
                  setValue("showAdmissionButton", e.target.checked)
                }
              />
            }
            label="Show Admission Button"
          />
        </Grid>

        <Grid item xs={12}>
          <Button type="submit" variant="contained" disabled={isPending}>
            {isPending ? "Saving..." : "Save Navbar"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
