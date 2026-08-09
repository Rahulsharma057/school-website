"use client";

import {
  Box,
  Grid,
  TextField,
  Typography,
  Divider,
  Button,
  FormControlLabel,
  Switch,
} from "@mui/material";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function ButtonStyleForm({ navbar = {} }) {
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      showLoginButton: true,
      showAdmissionButton: true,

      loginButtonText: "",
      loginButtonLink: "",

      loginButtonBackground: "#1976d2",
      loginButtonTextColor: "#ffffff",
      loginButtonBorderColor: "#1976d2",
      loginButtonHoverColor: "#1565c0",
      loginButtonFontSize: 14,
      loginButtonBorderRadius: 8,

      admissionButtonText: "",
      admissionButtonLink: "",

      admissionButtonBackground: "#2e7d32",
      admissionButtonTextColor: "#ffffff",
      admissionButtonHoverColor: "#1b5e20",
      admissionButtonFontSize: 14,
      admissionButtonBorderRadius: 8,
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        showLoginButton: navbar.showLoginButton ?? true,
        showAdmissionButton: navbar.showAdmissionButton ?? true,

        loginButtonText: navbar.loginButtonText || "",
        loginButtonLink: navbar.loginButtonLink || "",

        loginButtonBackground: navbar.loginButtonBackground || "#1976d2",
        loginButtonTextColor: navbar.loginButtonTextColor || "#ffffff",
        loginButtonBorderColor: navbar.loginButtonBorderColor || "#1976d2",
        loginButtonHoverColor: navbar.loginButtonHoverColor || "#1565c0",
        loginButtonFontSize: navbar.loginButtonFontSize ?? 14,
        loginButtonBorderRadius: navbar.loginButtonBorderRadius ?? 8,

        admissionButtonText: navbar.admissionButtonText || "",
        admissionButtonLink: navbar.admissionButtonLink || "",

        admissionButtonBackground: navbar.admissionButtonBackground || "#2e7d32",
        admissionButtonTextColor: navbar.admissionButtonTextColor || "#ffffff",
        admissionButtonHoverColor: navbar.admissionButtonHoverColor || "#1b5e20",
        admissionButtonFontSize: navbar.admissionButtonFontSize ?? 14,
        admissionButtonBorderRadius: navbar.admissionButtonBorderRadius ?? 8,
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    mutate(formData);
  };

  const color = (name, label) => (
    <TextField
      fullWidth
      type="color"
      label={label}
      InputLabelProps={{ shrink: true }}
      {...register(name)}
    />
  );

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Button Visibility
      </Typography>

      <FormControlLabel
        control={<Switch checked={watch("showLoginButton")} {...register("showLoginButton")} />}
        label="Show Login Button"
      />

      <FormControlLabel
        control={<Switch checked={watch("showAdmissionButton")} {...register("showAdmissionButton")} />}
        label="Show Admission Button"
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" mb={2}>
        Login Button Style
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Button Text"
            helperText="Login button me kya text dikhega"
            {...register("loginButtonText")}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Button Link"
            helperText="Click karne par kaha jayega"
            {...register("loginButtonLink")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          {color("loginButtonBackground", "Background Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("loginButtonTextColor", "Text Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("loginButtonBorderColor", "Border Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("loginButtonHoverColor", "Hover Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Font Size px"
            {...register("loginButtonFontSize", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Border Radius px"
            {...register("loginButtonBorderRadius", { valueAsNumber: true })}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" mb={2}>
        Admission Button Style
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Button Text"
            {...register("admissionButtonText")}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Button Link"
            {...register("admissionButtonLink")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          {color("admissionButtonBackground", "Background Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("admissionButtonTextColor", "Text Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("admissionButtonHoverColor", "Hover Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Font Size px"
            {...register("admissionButtonFontSize", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Border Radius px"
            {...register("admissionButtonBorderRadius", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Button Style"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}