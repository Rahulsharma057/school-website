"use client";

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Slider, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CropIcon from "@mui/icons-material/Crop";

import { readFileAsDataURL, getCroppedImageFile } from "@/utils/cropImage";

/**
 * Standalone crop dialog. Doesn't manage the file input itself — pass it
 * an already-picked `file` and `open`, it shows the cropper, and calls
 * back `onCropped(croppedFile)` when the admin confirms.
 *
 * `aspect` sets the fixed crop ratio (e.g. 16/9 for a cover image, 1 for
 * a square card image) — pass `null` for a free-form crop.
 */
export default function ImageCropDialog({ open, file, aspect = 16 / 9, onClose, onCropped }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load the picked file into a data URL whenever a new file arrives.
  useEffect(() => {
    if (open && file) {
      readFileAsDataURL(file).then(setImageSrc);
    }
    if (!open) {
      setImageSrc(null);
    }
  }, [open, file]);

  const handleClose = () => {
    setImageSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  const onCropComplete = useCallback((_croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setSaving(true);
    try {
      const croppedFile = await getCroppedImageFile(imageSrc, croppedAreaPixels, file?.name || "cropped.jpg");
      onCropped(croppedFile);
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CropIcon fontSize="small" />
          <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Crop Image</Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: "relative", width: "100%", height: 380, bgcolor: "#18181b" }}>
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect || undefined}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Box>

        <Box sx={{ px: 3, py: 2 }}>
          <Typography sx={{ fontSize: 12.5, color: "#71717a", mb: 0.5 }}>Zoom</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(_, v) => setZoom(v)}
            sx={{ color: "#18181b" }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ textTransform: "none", color: "#71717a" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={saving || !croppedAreaPixels}
          onClick={handleConfirm}
          sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
        >
          {saving ? "Saving…" : "Apply Crop"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
