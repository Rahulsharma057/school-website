"use client";

import {
  Grid,
  TextField,
  MenuItem,
  Typography,
  Button,
  Box,
  FormControlLabel,
  Switch,
} from "@mui/material";

import { useEffect } from "react";
import { useForm } from "react-hook-form";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function MenuStyleForm({ navbar = {} }) {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      menuFontSize: 16,
      menuFontWeight: 500,
      menuTextTransform: "none",
      activeMenuColor: "#1976d2",
      navbarHoverColor: "#1976d2",
      borderBottomColor: "#e5e5e5",
      showShadow: true,
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        menuFontSize: navbar.menuFontSize ?? 16,
        menuFontWeight: Number(navbar.menuFontWeight ?? 500),
        menuTextTransform: navbar.menuTextTransform || "none",
        activeMenuColor: navbar.activeMenuColor || "#1976d2",
        navbarHoverColor: navbar.navbarHoverColor || "#1976d2",
        borderBottomColor: navbar.borderBottomColor || "#e5e5e5",
        showShadow: navbar.showShadow ?? true,
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      let value = data[key];

      if (key === "menuFontWeight" || key === "menuFontSize") {
        value = Number(value);
      }

      if (key === "showShadow") {
        value = value ? true : false;
      }

      formData.append(key, value);
    });

    mutate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Menu Style Settings
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Menu Font Size (px)"
            {...register("menuFontSize")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Menu Font Weight"
            {...register("menuFontWeight")}
          >
            <MenuItem value={400}>Light (400)</MenuItem>
            <MenuItem value={500}>Normal (500)</MenuItem>
            <MenuItem value={600}>Semi Bold (600)</MenuItem>
            <MenuItem value={700}>Bold (700)</MenuItem>
            <MenuItem value={800}>Extra Bold (800)</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Text Transform"
            {...register("menuTextTransform")}
          >
            <MenuItem value="none">Normal</MenuItem>
            <MenuItem value="capitalize">Capitalize</MenuItem>
            <MenuItem value="uppercase">Uppercase</MenuItem>
            <MenuItem value="lowercase">Lowercase</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="color"
            label="Active Menu Color"
            InputLabelProps={{ shrink: true }}
            {...register("activeMenuColor")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="color"
            label="Menu Hover Color"
            InputLabelProps={{ shrink: true }}
            {...register("navbarHoverColor")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="color"
            label="Bottom Border Color"
            InputLabelProps={{ shrink: true }}
            {...register("borderBottomColor")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Switch
                checked={watch("showShadow")}
                onChange={(e) => setValue("showShadow", e.target.checked)}
              />
            }
            label="Enable Menu Shadow"
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Menu Style"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
