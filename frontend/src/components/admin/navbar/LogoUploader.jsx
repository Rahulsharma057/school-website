"use client";

import { useState, useEffect } from "react";

import {
  Box,
  Button,
  Typography,
  Avatar,
  Grid,
  TextField,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function LogoUploader({ navbar }) {
  const [file, setFile] = useState(null);

  const [logoWidth, setLogoWidth] = useState(70);
  const [logoHeight, setLogoHeight] = useState(70);

  const { mutate, isPending } = useCreateNavbar();

  useEffect(() => {
    if (navbar) {
      setLogoWidth(navbar.logoWidth ?? 70);
      setLogoHeight(navbar.logoHeight ?? 70);
    }
  }, [navbar]);

  const handleUpload = () => {
    const formData = new FormData();

    if (file) {
      formData.append("logo", file);
    }

    formData.append("logoWidth", Number(logoWidth));
    formData.append("logoHeight", Number(logoHeight));

    mutate(formData);
  };

  return (
    <Box>
      <Typography variant="body2" mb={2}>
        Upload School Logo
      </Typography>

      {navbar?.logo?.url && (
        <Avatar
          src={navbar.logo.url}
          variant="rounded"
          sx={{
            width: logoWidth,
            height: logoHeight,
            mb: 2,
          }}
        />
      )}

      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUploadIcon />}
      >
        Select Logo
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files[0]);
          }}
        />
      </Button>

      {file && (
        <Typography mt={1} fontSize={14}>
          {file.name}
        </Typography>
      )}

      <Grid container spacing={2} mt={1}>
        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Logo Width (px)"
            value={logoWidth}
            onChange={(e) => setLogoWidth(e.target.value)}
          />
        </Grid>

        <Grid item xs={6} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Logo Height (px)"
            value={logoHeight}
            onChange={(e) => setLogoHeight(e.target.value)}
          />
        </Grid>
      </Grid>

      <Box mt={2}>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={handleUpload}
        >
          {isPending ? "Uploading..." : "Save Logo"}
        </Button>
      </Box>
    </Box>
  );
}