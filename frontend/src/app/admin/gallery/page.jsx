"use client";

import { useState } from "react";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import GalleryBuilder from "@/components/admin/gallery/GalleryBuilder";
import GalleriesTable from "@/components/admin/gallery/GalleriesTable";
import GalleryImageManager from "@/components/admin/gallery/GalleryImageManager";

export default function GalleryPage() {
  const [editData, setEditData] = useState(null);
  const [manageGallery, setManageGallery] = useState(null);

  if (manageGallery) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setManageGallery(null)}
          sx={{ textTransform: "none", color: "#3f3f46", mb: 2 }}
        >
          Back to galleries
        </Button>
        <GalleryImageManager gallery={manageGallery} />
      </Box>
    );
  }

  return (
    <Box>
      <GalleryBuilder editData={editData} clearEdit={() => setEditData(null)} />

      <Box mt={5}>
        <GalleriesTable onEdit={setEditData} onManageImages={setManageGallery} />
      </Box>
    </Box>
  );
}
