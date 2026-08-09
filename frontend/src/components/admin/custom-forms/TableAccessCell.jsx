"use client";

import { useState } from "react";

import { Chip, MenuItem, Select, Stack, Typography, CircularProgress } from "@mui/material";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { updateForm } from "@/services/formService";

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

/**
 * Inline, autosaving access control — no dialog, no separate save step.
 * Change the dropdown, it saves immediately and shows a toast. This is
 * the fast path for "who can see this table"; the full FormBuilder's
 * Access tab remains the place for everything else (public viewRoles,
 * fields, layout).
 */
export default function TableAccessCell({ row }) {
  const queryClient = useQueryClient();
  const [roles, setRoles] = useState(row.accessControl?.tableViewRoles || []);

  const mutation = useMutation({
    mutationFn: (nextRoles) =>
      updateForm(row._id, {
        accessControl: {
          viewRoles: row.accessControl?.viewRoles || [],
          tableViewRoles: nextRoles,
        },
      }),
    onSuccess: () => {
      toast.success(`Access updated for "${row.title}"`);
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not update access");
      setRoles(row.accessControl?.tableViewRoles || []); // revert on failure
    },
  });

  const handleChange = (e) => {
    const value = e.target.value;
    const next = typeof value === "string" ? value.split(",") : value;
    setRoles(next);
    mutation.mutate(next);
  };

  return (
    <Select
      multiple
      size="small"
      value={roles}
      onChange={handleChange}
      disabled={mutation.isPending}
      displayEmpty
      renderValue={(selected) =>
        selected.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: "#dc2626" }}>No access set</Typography>
        ) : (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ py: 0.2 }}>
            {selected.map((r) => (
              <Chip key={r} label={r} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 600, bgcolor: "#f4f4f5" }} />
            ))}
          </Stack>
        )
      }
      endAdornment={mutation.isPending ? <CircularProgress size={14} sx={{ mr: 2 }} /> : null}
      sx={{
        width: "100%",
        maxWidth: 280,
        bgcolor: "#fff",
        "& .MuiSelect-select": { py: 0.8, minHeight: "unset" },
      }}
    >
      {ROLE_OPTIONS.map((role) => (
        <MenuItem key={role} value={role} sx={{ fontSize: 13.5 }}>
          {role}
        </MenuItem>
      ))}
    </Select>
  );
}