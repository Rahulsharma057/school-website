"use client";

import { useState } from "react";

import { Box, Button, Typography, Avatar } from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

export default function FaviconUploader({ navbar }) {
  const [file, setFile] = useState(null);

  const { mutate, isPending } = useCreateNavbar();

  const handleUpload = () => {
    if (!file) {
      return;
    }

    const formData = new FormData();

    formData.append("favicon", file);

    mutate(formData);
  };

  return (
    <Box>
      <Typography mb={2}>Upload Website Favicon</Typography>

      {navbar?.favicon?.url && (
        <Avatar
          src={navbar.favicon.url}
          variant="rounded"
          sx={{
            width: 70,
            height: 70,
            mb: 2,
          }}
        />
      )}

      <Button
        component="label"
        variant="outlined"
        startIcon={<CloudUploadIcon />}
      >
        Select Favicon
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files[0]);
          }}
        />
      </Button>

      {file && <Typography mt={1}>{file.name}</Typography>}

      <Box mt={2}>
        <Button
          variant="contained"
          disabled={!file || isPending}
          onClick={handleUpload}
        >
          {isPending ? "Uploading..." : "Upload Favicon"}
        </Button>
      </Box>
    </Box>
  );
}
