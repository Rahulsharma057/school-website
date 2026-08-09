"use client";

import { useState } from "react";

import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import CustomPageForm from "@/components/admin/custom-pages/CustomPageForm";
import CustomPageTable from "@/components/admin/custom-pages/CustomPageTable";

export default function CustomPagesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const openCreate = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditData(row);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
            Custom Pages
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#71717a" }}>
            Build any page — About, Admissions, Facilities, anything — with the same builder.
          </Typography>
        </Box>

        <Button
          startIcon={<AddIcon />}
          variant="contained"
          disableElevation
          onClick={openCreate}
          sx={{ textTransform: "none", fontWeight: 600, bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
        >
          Add Page
        </Button>
      </Stack>

      <CustomPageTable onEdit={openEdit} />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        maxWidth="lg"
        fullWidth
        scroll="body"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5", position: "sticky", top: 0, bgcolor: "#fff", zIndex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17 }}>
            {editData ? "Edit Page" : "Add Page"}
          </Typography>
          <IconButton size="small" onClick={closeDialog}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fafafa" }}>
          <CustomPageForm editData={editData} clearEdit={closeDialog} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
