"use client";

import { useEffect, useState } from "react";

import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import CustomPageForm from "@/components/admin/custom-pages/CustomPageForm";
import CustomPageTable from "@/components/admin/custom-pages/CustomPageTable";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";

export default function CustomPagesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  // FIX: NEW — reported up by CustomPageForm; true if anything has been
  // touched since the dialog opened (form fields, images, or sections).
  const [isDirty, setIsDirty] = useState(false);
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);

  const openCreate = () => {
    setEditData(null);
    setIsDirty(false);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditData(row);
    setIsDirty(false);
    setDialogOpen(true);
  };

  // Actually closes, no confirmation — used once the admin has confirmed,
  // or when there's nothing to lose.
  const forceClose = () => {
    setDialogOpen(false);
    setEditData(null);
    setIsDirty(false);
    setDiscardConfirmOpen(false);
  };

  // What every "close" path (X button, backdrop click, Cancel inside the
  // form) actually calls — steps in with a confirmation only if the
  // admin has unsaved changes.
  const requestClose = () => {
    if (isDirty) {
      setDiscardConfirmOpen(true);
    } else {
      forceClose();
    }
  };

  // FIX: NEW — catches an actual browser tab close/refresh while the
  // dialog is open with unsaved changes (the in-dialog confirmation
  // above only catches in-app navigation, not this).
  useEffect(() => {
    if (!dialogOpen || !isDirty) return;

    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dialogOpen, isDirty]);

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
        onClose={requestClose}
        maxWidth="lg"
        fullWidth
        scroll="body"
        sx={{ "& .MuiDialog-paper": { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5", position: "sticky", top: 0, bgcolor: "#fff", zIndex: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 17 }}>
            {editData ? "Edit Page" : "Add Page"}
          </Typography>
          <IconButton size="small" onClick={requestClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, md: 3 }, bgcolor: "#fafafa" }}>
          <CustomPageForm editData={editData} clearEdit={forceClose} onDirtyChange={setIsDirty} />
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={discardConfirmOpen}
        title="Discard Changes?"
        message="You have unsaved changes on this page. Closing now will lose them."
        confirmText="Discard"
        onClose={() => setDiscardConfirmOpen(false)}
        onConfirm={forceClose}
      />
    </Box>
  );
}
