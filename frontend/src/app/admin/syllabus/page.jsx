"use client";

import { useState } from "react";
import { Box } from "@mui/material";

import SyllabusBuilder from "@/components/admin/syllabus/SyllabusBuilder";
import SyllabusTable from "@/components/admin/syllabus/SyllabusTable";

export default function SyllabusPage() {
  const [editData, setEditData] = useState(null);

  const handleEdit = (syllabus) => {
    setEditData(syllabus);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleClearEdit = () => {
    setEditData(null);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Create / Update Syllabus */}
      <SyllabusBuilder
        editData={editData}
        clearEdit={handleClearEdit}
      />

      {/* Syllabus List */}
      <Box sx={{ mt: 3 }}>
        <SyllabusTable onEdit={handleEdit} />
      </Box>
    </Box>
  );
}