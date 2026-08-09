"use client";

import {
  Grid,
  TextField,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Switch,
} from "@mui/material";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function NavbarDesignForm({ navbar = {} }) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      navbarBackground: "#ffffff",
      navbarTextColor: "#000000",
      navbarHeight: 80,
      navbarFontSize: 15,
      navbarFontWeight: 600,
      navbarShadow: true,
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        navbarBackground: navbar.navbarBackground || "#ffffff",
        navbarTextColor: navbar.navbarTextColor || "#000000",
        navbarHeight: navbar.navbarHeight ?? 80,
        navbarFontSize: navbar.navbarFontSize ?? 15,
        navbarFontWeight: Number(navbar.navbarFontWeight ?? 600),
        navbarShadow: navbar.navbarShadow ?? true,
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      let value = data[key];

      if (["navbarHeight", "navbarFontSize", "navbarFontWeight"].includes(key)) {
        value = Number(value);
      }

      if (key === "navbarShadow") {
        value = value ? true : false;
      }

      formData.append(key, value);
    });

    mutate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Navbar Container Design
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="color"
            label="Navbar Background"
            helperText="Navbar ka overall background color"
            InputLabelProps={{ shrink: true }}
            {...register("navbarBackground")}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="color"
            label="Navbar Text Color"
            InputLabelProps={{ shrink: true }}
            {...register("navbarTextColor")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Navbar Height (px)"
            {...register("navbarHeight", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Navbar Font Size (px)"
            helperText="School name ka font size"
            {...register("navbarFontSize", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Navbar Font Weight"
            {...register("navbarFontWeight", { valueAsNumber: true })}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={watch("navbarShadow")}
                onChange={(e) => setValue("navbarShadow", e.target.checked)}
              />
            }
            label="Enable Navbar Shadow"
          />
        </Grid>

        <Grid item xs={12}>
          <Button fullWidth variant="contained" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Navbar Design"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}