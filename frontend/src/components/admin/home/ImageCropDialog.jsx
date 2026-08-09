"use client";

import { useState, useCallback, useEffect } from "react";

import Cropper from "react-easy-crop";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

export default function ImageCropDialog({
  open,
  image,
  onClose,
  onCropComplete,
}) {
  const [crop, setCrop] = useState({
    x: 0,
    y: 0,
  });

  const [zoom, setZoom] = useState(1);

  const [rotation, setRotation] = useState(0);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (open) {
      setCrop({
        x: 0,
        y: 0,
      });

      setZoom(1);

      setRotation(0);
    }
  }, [open]);

  const handleCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleSave = () => {
    if (!croppedAreaPixels) return;

    onCropComplete(croppedAreaPixels, rotation);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
        }}
      >
        Crop Slider Image
      </DialogTitle>

      <DialogContent>
        <Typography
          variant="body2"
          color="text.secondary"
          mb={2}
        >
          Recommended Ratio: <b>16:9</b>
        </Typography>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: {
              xs: 300,
              sm: 400,
              md: 500,
            },
            bgcolor: "#000",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={16 / 9}
            cropShape="rect"
            showGrid
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </Box>

        <Stack spacing={3} mt={4}>
          <Box>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Zoom
            </Typography>

            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
              onChange={(_, value) => setZoom(value)}
            />
          </Box>

          <Box>
            <Typography
              fontWeight={600}
              gutterBottom
            >
              Rotation
            </Typography>

            <Slider
              value={rotation}
              min={0}
              max={360}
              step={1}
              valueLabelDisplay="auto"
              onChange={(_, value) => setRotation(value)}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 3,
        }}
      >
        <Button
          color="inherit"
          onClick={() => {
            setCrop({
              x: 0,
              y: 0,
            });

            setZoom(1);

            setRotation(0);
          }}
        >
          Reset
        </Button>

        <Button
          color="error"
          variant="outlined"
          onClick={onClose}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          Crop & Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}