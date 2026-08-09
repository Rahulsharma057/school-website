"use client";

import {
  Grid,
  TextField,
  Typography,
  Button,
  Box,
} from "@mui/material";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function MobileMenuStyleForm({ navbar = {} }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      mobileMenuBackground: "#ffffff",
      mobileMenuTextColor: "#222222",
      mobileMenuActiveColor: "#1976d2",
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        mobileMenuBackground: navbar.mobileMenuBackground || "#ffffff",
        mobileMenuTextColor: navbar.mobileMenuTextColor || "#222222",
        mobileMenuActiveColor: navbar.mobileMenuActiveColor || "#1976d2",
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      formData.append(key, data[key]);
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
        Mobile Menu Style
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          {color("mobileMenuBackground", "Background Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("mobileMenuTextColor", "Text Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("mobileMenuActiveColor", "Active Item Color")}
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Mobile Menu Style"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}