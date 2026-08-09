"use client";

import { useState } from "react";

import { Button, Stack } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CropIcon from "@mui/icons-material/Crop";

import ImageCropDialog from "./ImageCropDialog";

/**
 * `onFile(file)` is called with a plain File either way — straight from
 * the picker for "Upload", or the cropped result for "Crop & Upload".
 * Parents don't need to know or care which path was used.
 *
 * Crop option is hidden when `multiple` is true (cropping several images
 * in one action isn't supported — pick single images individually with
 * "Crop & Upload" if some of a batch need cropping).
 */
export default function ImageUploadButtons({ onFile, aspect = 16 / 9, multiple = false, label = "Upload Image" }) {
  const [cropFile, setCropFile] = useState(null);
  const [cropOpen, setCropOpen] = useState(false);

  const handlePlainSelect = (fileList) => {
    Array.from(fileList || []).forEach((file) => onFile(file));
  };

  const handleCropSelect = (file) => {
    if (!file) return;
    setCropFile(file);
    setCropOpen(true);
  };

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
        <Button
          component="label"
          size="small"
          startIcon={<CloudUploadIcon />}
          sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
        >
          {label}
          <input
            hidden
            type="file"
            accept="image/*"
            multiple={multiple}
            onChange={(e) => {
              handlePlainSelect(e.target.files);
              e.target.value = ""; // allows picking the same file again later
            }}
          />
        </Button>

        {!multiple && (
          <Button
            component="label"
            size="small"
            startIcon={<CropIcon />}
            sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
          >
            Crop & Upload
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                handleCropSelect(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </Button>
        )}
      </Stack>

      <ImageCropDialog
        open={cropOpen}
        file={cropFile}
        aspect={aspect}
        onClose={() => setCropOpen(false)}
        onCropped={(croppedFile) => onFile(croppedFile)}
      />
    </>
  );
}
