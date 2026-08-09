"use client";

import { useState } from "react";
import { Box } from "@mui/material";

import AnnouncementBuilder from "@/components/admin/announcements/AnnouncementBuilder";
import AnnouncementsTable from "@/components/admin/announcements/AnnouncementsTable";

export default function AnnouncementsPage() {
  const [editData, setEditData] = useState(null);

  return (
    <Box>
      <AnnouncementBuilder editData={editData} clearEdit={() => setEditData(null)} />
      <Box mt={5}>
        <AnnouncementsTable onEdit={(data) => setEditData(data)} />
      </Box>
    </Box>
  );
}