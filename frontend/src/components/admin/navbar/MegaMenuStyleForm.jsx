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

export default function MegaMenuStyleForm({ navbar = {} }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      megaMenuBackground: "#ffffff",
      megaMenuHeadingColor: "#1976d2",
      megaMenuTextColor: "#222222",
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        megaMenuBackground: navbar.megaMenuBackground || "#ffffff",
        megaMenuHeadingColor: navbar.megaMenuHeadingColor || "#1976d2",
        megaMenuTextColor: navbar.megaMenuTextColor || "#222222",
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
        Mega Menu Style
      </Typography>

      <Typography variant="body2" color="text.secondary" mb={2}>
        Ye tab apply hoga jab menu item me "Mega Menu" toggle ON ho.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          {color("megaMenuBackground", "Background Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("megaMenuHeadingColor", "Heading Color")}
        </Grid>

        <Grid item xs={12} md={4}>
          {color("megaMenuTextColor", "Text Color")}
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Mega Menu Style"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}