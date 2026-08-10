"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";

import NewsSectionForm from "@/components/admin/news/NewsSectionForm";
import NewsSectionsTable from "@/components/admin/news/NewsSectionsTable";

export default function AdminNewsSectionsPage() {
  const [editData, setEditData] = useState(null);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>
        News Sections
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 2.5 }}>
        Filtered, styled, routable news widgets built on top of your articles.
      </Typography>

      <NewsSectionForm editData={editData} clearEdit={() => setEditData(null)} />

      <Box mt={5}>
        <NewsSectionsTable onEdit={(data) => setEditData(data)} />
      </Box>
    </Box>
  );
}
