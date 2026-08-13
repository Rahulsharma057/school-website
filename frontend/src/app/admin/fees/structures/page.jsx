"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Collapse, Stack, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import FeeStructureForm from "@/components/admin/fees/FeeStructureForm";
import FeeStructuresTable from "@/components/admin/fees/FeeStructuresTable";

export default function FeeStructuresPage() {
  const router = useRouter();
  const [editData, setEditData] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const openForCreate = () => { setEditData(null); setShowForm(true); };
  const openForEdit = (row) => { setEditData(row); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditData(null); };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>Fee Structures</Typography>
          <Typography sx={{ fontSize: 13, color: "#71717a" }}>Templates by class + academic year — assign them to students to generate real fee records.</Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {!showForm && (
            <Button startIcon={<AddIcon />} onClick={openForCreate} variant="contained" disableElevation sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}>
              New Structure
            </Button>
          )}
          {showForm && (
            <Button startIcon={<CloseIcon />} onClick={closeForm} sx={{ textTransform: "none", color: "#71717a" }}>Close</Button>
          )}
        </Stack>
      </Stack>

      <Collapse in={showForm} unmountOnExit>
        <Box mb={4}><FeeStructureForm editData={editData} clearEdit={closeForm} /></Box>
      </Collapse>

      <FeeStructuresTable
        onEdit={openForEdit}
        onAssign={(row) => router.push(`/admin/fees/assign?structureId=${row._id}`)}
      />
    </Box>
  );
}