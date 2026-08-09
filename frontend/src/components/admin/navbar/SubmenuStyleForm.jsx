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

export default function SubmenuStyleForm({ navbar = {} }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      submenuBackground: "#ffffff",
      submenuTextColor: "#222222",
      submenuHoverBackground: "#f5f5f5",
      submenuHoverTextColor: "#1976d2",
      submenuBorderRadius: 8,
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        submenuBackground: navbar.submenuBackground || "#ffffff",
        submenuTextColor: navbar.submenuTextColor || "#222222",
        submenuHoverBackground: navbar.submenuHoverBackground || "#f5f5f5",
        submenuHoverTextColor: navbar.submenuHoverTextColor || "#1976d2",
        submenuBorderRadius: navbar.submenuBorderRadius ?? 8,
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      let value = data[key];

      if (key === "submenuBorderRadius") {
        value = Number(value);
      }

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
        Submenu (Dropdown) Style
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {color("submenuBackground", "Background Color")}
        </Grid>

        <Grid item xs={12} md={6}>
          {color("submenuTextColor", "Text Color")}
        </Grid>

        <Grid item xs={12} md={6}>
          {color("submenuHoverBackground", "Hover Background")}
        </Grid>

        <Grid item xs={12} md={6}>
          {color("submenuHoverTextColor", "Hover Text Color")}
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Border Radius (px)"
            helperText="Dropdown corner roundness"
            {...register("submenuBorderRadius", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Submenu Style"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}