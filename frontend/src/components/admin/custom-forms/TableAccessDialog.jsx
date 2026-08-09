"use client";

import { useState, useEffect } from "react";

import {
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
  Button,
} from "@mui/material";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateForm } from "@/services/formService";

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

/**
 * Lightweight quick-edit for "who can see this table" — a smaller
 * surface than opening the full FormBuilder just to flip access roles.
 * Sends only accessControl.tableViewRoles; the public viewRoles are
 * untouched (edit those from the full builder's Access tab).
 */
export default function TableAccessDialog({ form, open, onClose }) {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    setRoles(form?.accessControl?.tableViewRoles || []);
  }, [form]);

  const mutation = useMutation({
    mutationFn: () =>
      updateForm(form._id, {
        accessControl: {
          viewRoles: form.accessControl?.viewRoles || [],
          tableViewRoles: roles,
        },
      }),
    onSuccess: () => {
      toast.success("Table access updated");
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not update access"),
  });

  const toggle = (role) =>
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  if (!form) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Who can view "{form.title}"?</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12.5, color: "#71717a", mb: 2 }}>
          Controls access to <code>/admin/tables/{form.adminTableSlug}</code>. Always requires login.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
          {ROLE_OPTIONS.map((role) => (
            <Chip
              key={role}
              label={role}
              clickable
              onClick={() => toggle(role)}
              sx={{
                fontWeight: 600,
                bgcolor: roles.includes(role) ? "#18181b" : "#f4f4f5",
                color: roles.includes(role) ? "#fff" : "#3f3f46",
              }}
            />
          ))}
        </Stack>
        {roles.length === 0 && (
          <Typography sx={{ fontSize: 12, color: "#dc2626", mt: 1.5 }}>
            No role selected — the table will require login but let no one in.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#71717a" }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disableElevation
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}