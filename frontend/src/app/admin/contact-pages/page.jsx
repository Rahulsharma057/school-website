"use client";

import { useState } from "react";
import { Box, Typography, Stack, Avatar } from "@mui/material";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";

import ContactPageBuilder from "@/components/admin/contact/ContactPageBuilder";
import ContactPagesTable from "@/components/admin/contact/ContactPagesTable";

function ContactPagesContent() {
  const [editData, setEditData] = useState(null);

  const handleEdit = (row) => {
    setEditData(row);
    // form ke top pe le jao taaki user ko dikhe ki edit mode khul gaya
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearEdit = () => setEditData(null);

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar
          sx={{ bgcolor: "#eff6ff", color: "#2563eb", width: 44, height: 44 }}
        >
          <ContactMailOutlinedIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Contact Pages
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Create and manage public contact pages — address, phone, email, and
            enquiry forms
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 4 }}>
        <ContactPageBuilder editData={editData} clearEdit={clearEdit} />
      </Box>

      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, color: "#1e293b", mb: 2 }}
        >
          All Contact Pages
        </Typography>
        <ContactPagesTable onEdit={handleEdit} />
      </Box>
    </Box>
  );
}

export default function ContactPagesPage() {
  return <ContactPagesContent />;
}
