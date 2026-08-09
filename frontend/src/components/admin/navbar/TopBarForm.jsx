"use client";

import {
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Grid,
  Typography,
  Divider,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { useEffect } from "react";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function TopBarForm({ navbar }) {
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      showTopBar: true,

      topBarEmail: "",
      topBarPhone: "",
      topBarAddress: "",

      topBarBackground: "#1976d2",
      topBarTextColor: "#ffffff",
      topBarFontSize: 13,
    },
  });

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      reset({
        showTopBar: navbar.showTopBar,

        topBarEmail: navbar.topBarEmail || "",
        topBarPhone: navbar.topBarPhone || "",
        topBarAddress: navbar.topBarAddress || "",

        topBarBackground: navbar.topBarBackground || "#1976d2",
        topBarTextColor: navbar.topBarTextColor || "#ffffff",
        topBarFontSize: navbar.topBarFontSize ?? 13,
      });
    }
  }, [navbar, reset]);

  const submit = (data) => {
    const formData = new FormData();

    Object.keys(data).forEach((key) => {
      let value = data[key];

      if (key === "topBarFontSize") {
        value = Number(value);
      }

      formData.append(key, value);
    });

    mutate(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(submit)}>
      <FormControlLabel
        control={
          <Switch
            checked={watch("showTopBar")}
            onChange={(e) => setValue("showTopBar", e.target.checked)}
          />
        }
        label="Show Top Bar"
      />

      <TextField
        fullWidth
        margin="normal"
        label="Email"
        {...register("topBarEmail")}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Phone"
        {...register("topBarPhone")}
      />

      <TextField
        fullWidth
        margin="normal"
        label="Address"
        {...register("topBarAddress")}
      />

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle1" fontWeight={600} mb={2}>
        Top Bar Style
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="color"
            label="Background Color"
            InputLabelProps={{ shrink: true }}
            {...register("topBarBackground")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="color"
            label="Text Color"
            InputLabelProps={{ shrink: true }}
            {...register("topBarTextColor")}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            type="number"
            label="Font Size (px)"
            {...register("topBarFontSize", { valueAsNumber: true })}
          />
        </Grid>
      </Grid>

      <Button variant="contained" type="submit" disabled={isPending} sx={{ mt: 3 }}>
        {isPending ? "Saving..." : "Save Top Bar"}
      </Button>
    </Box>
  );
}