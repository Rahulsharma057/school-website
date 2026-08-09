"use client";

import { useEffect, useState } from "react";

import { Box, Dialog, IconButton } from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function Lightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index);

  useEffect(() => setCurrent(index), [index]);

  if (current === null || current === undefined) return null;

  const image = images[current];
  if (!image) return null;

  const go = (delta) => setCurrent((c) => (c + delta + images.length) % images.length);

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { bgcolor: "#000", boxShadow: "none" } }}>
      <Box sx={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 8, right: 8, color: "#fff", zIndex: 1 }}>
          <CloseIcon />
        </IconButton>

        {images.length > 1 && (
          <IconButton onClick={() => go(-1)} sx={{ position: "absolute", left: 8, color: "#fff", zIndex: 1 }}>
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        <Box
          component="img"
          src={image.url}
          alt={image.altText || image.caption || ""}
          sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
        />

        {images.length > 1 && (
          <IconButton onClick={() => go(1)} sx={{ position: "absolute", right: 8, color: "#fff", zIndex: 1 }}>
            <ArrowForwardIosIcon />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
}
