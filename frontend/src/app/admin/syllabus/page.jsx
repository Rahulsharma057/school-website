"use client";

import { useState } from "react";
import { Box, Grid } from "@mui/material";

import SchoolClassManager from "@/components/admin/syllabus/SchoolClassManager";
import SyllabusBuilder from "@/components/admin/syllabus/SyllabusBuilder";
import SyllabusTable from "@/components/admin/syllabus/SyllabusTable";

export default function SyllabusPage() {
  const [editData, setEditData] = useState(null);

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <SchoolClassManager />
        </Grid>
        <Grid item xs={12} md={8}>
          <SyllabusBuilder editData={editData} clearEdit={() => setEditData(null)} />
        </Grid>
      </Grid>

      <SyllabusTable onEdit={(data) => setEditData(data)} />
    </Box>
  );
}