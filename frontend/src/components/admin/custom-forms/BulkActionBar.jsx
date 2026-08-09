"use client";

import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

export const BULK_ACTION_OPTIONS = [
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "archive", label: "Archive" },
  { value: "delete", label: "Move to Trash" },
  { value: "restore", label: "Restore" },
  { value: "permanentlyDelete", label: "Delete Permanently" },
];

/**
 * The "N selected -> bulk action -> Apply" bar, shared by DynamicFormTable
 * and FormEntriesTable. Renders nothing until at least one row is selected.
 */
export default function BulkActionBar({
  selectedCount,
  action,
  onActionChange,
  onClear,
  onApply,
  applying,
}) {
  if (!selectedCount) return null;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.5}
      sx={{ mb: 2, p: 1.5, border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fafafa" }}
    >
      <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedCount} selected</Typography>

      <TextField
        select
        size="small"
        label="Bulk action"
        value={action}
        onChange={(e) => onActionChange(e.target.value)}
        sx={{ width: 200, bgcolor: "#fff" }}
      >
        {BULK_ACTION_OPTIONS.map((a) => (
          <MenuItem key={a.value} value={a.value}>
            {a.label}
          </MenuItem>
        ))}
      </TextField>

      <Button
        size="small"
        variant="contained"
        disableElevation
        disabled={!action || applying}
        onClick={onApply}
        sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
      >
        Apply
      </Button>

      <Button size="small" onClick={onClear} sx={{ textTransform: "none", color: "#71717a" }}>
        Clear selection
      </Button>
    </Stack>
  );
}
