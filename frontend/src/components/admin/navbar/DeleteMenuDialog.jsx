"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

import useDeleteMenu from "@/hooks/navbar/useDeleteMenu";

export default function DeleteMenuDialog({
  open,

  index,

  onClose,
}) {
  const { mutate, isPending } = useDeleteMenu();

  const handleDelete = () => {
    mutate(index, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Menu</DialogTitle>

      <DialogContent>
        <Typography>Are you sure you want to delete this menu?</Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          color="error"
          variant="contained"
          disabled={isPending}
          onClick={handleDelete}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
