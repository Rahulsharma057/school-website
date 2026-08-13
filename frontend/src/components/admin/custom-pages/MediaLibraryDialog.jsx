"use client";

import { useEffect, useState } from "react";

import { Box, Dialog, DialogContent, DialogTitle, Grid, IconButton, Skeleton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { getMediaLibrary } from "@/services/customPageService";
import EmptyState from "@/components/common/EmptyState";

/**
 * `onSelect(image)` receives the full existing image object
 * ({ url, public_id, alt, objectFit, position, borderRadius, ... }) —
 * this is already a REAL, uploaded Cloudinary asset, not a pending file,
 * so callers should set it directly onto their field rather than routing
 * it through the toPendingImage()/upload flow.
 */
export default function MediaLibraryDialog({ open, onClose, onSelect }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    setError(false);

    getMediaLibrary({ limit: 200 })
      .then(({ data }) => {
        if (!cancelled) setImages(data?.data || []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handlePick = (img) => {
    onSelect(img);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Choose from Media Library</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {loading ? (
          <Grid container spacing={1.5}>
            {Array.from({ length: 12 }).map((_, i) => (
              <Grid size={{ xs: 4, sm: 3, md: 2.4 }} key={i}>
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1.5 }} />
              </Grid>
            ))}
          </Grid>
        ) : error ? (
          <EmptyState title="Couldn't load the media library" description="Please try again." />
        ) : images.length === 0 ? (
          <EmptyState title="No images yet" description="Upload an image anywhere in the builder first — it'll show up here for reuse next time." />
        ) : (
          <Grid container spacing={1.5}>
            {images.map((img) => (
              <Grid size={{ xs: 4, sm: 3, md: 2.4 }} key={img.public_id}>
                <Box
                  onClick={() => handlePick(img)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 1.5,
                    overflow: "hidden",
                    border: "1px solid #e4e4e7",
                    position: "relative",
                    "&:hover": { borderColor: "#18181b", "& .overlay": { opacity: 1 } },
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || ""} loading="lazy" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                  <Box
                    className="overlay"
                    sx={{
                      position: "absolute", inset: 0, bgcolor: "rgba(24,24,27,0.55)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s ease",
                      fontSize: 12, fontWeight: 600, textAlign: "center", p: 1,
                    }}
                  >
                    Use this image
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
}
