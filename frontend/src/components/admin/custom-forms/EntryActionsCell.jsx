"use client";

import { IconButton, Stack, Tooltip } from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/**
 * Row-actions cell shared by DynamicFormTable and FormEntriesTable —
 * view / approve / reject / duplicate / trash / restore / permanent-delete.
 * All mutation logic lives in useEntryActions; this component only wires
 * buttons to whatever handlers it's given.
 */
export default function EntryActionsCell({
  row,
  onView,
  onApprove,
  onReject,
  onDuplicate,
  onTrash,
  onRestore,
  onPermanentDelete,
}) {
  return (
    <Stack direction="row" spacing={0.3}>
      <Tooltip title="View">
        <IconButton size="small" onClick={() => onView(row)} sx={{ color: "#18181b" }}>
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {row.status !== "approved" && (
        <Tooltip title="Approve">
          <IconButton size="small" sx={{ color: "#15803d" }} onClick={() => onApprove(row)}>
            <CheckCircleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {row.status !== "rejected" && (
        <Tooltip title="Reject">
          <IconButton size="small" sx={{ color: "#dc2626" }} onClick={() => onReject(row)}>
            <CancelIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Duplicate">
        <IconButton size="small" sx={{ color: "#52525b" }} onClick={() => onDuplicate(row)}>
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {row.isDeleted ? (
        <>
          <Tooltip title="Restore">
            <IconButton size="small" sx={{ color: "#15803d" }} onClick={() => onRestore(row)}>
              <RestoreFromTrashIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Permanently">
            <IconButton size="small" sx={{ color: "#dc2626" }} onClick={() => onPermanentDelete(row)}>
              <DeleteForeverIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ) : (
        <Tooltip title="Move to Trash">
          <IconButton size="small" sx={{ color: "#dc2626" }} onClick={() => onTrash(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
