"use client";

import { useEffect, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArchiveIcon from "@mui/icons-material/Archive";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

const STATUS_STYLES = {
  pending: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
  approved: { bg: "#dcfce7", color: "#15803d", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  archived: { bg: "#f4f4f5", color: "#71717a", label: "Archived" },
};

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Turns a camelCase / snake_case field key into a readable label since
// form fields are fully dynamic and have no separate "display label"
// stored on the entry itself.
const humanizeKey = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function EntryDetailDialog({
  open,
  entry,
  onClose,
  onStatusChange,
  statusLoading,
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(entry?.reviewNote || "");
  }, [entry]);

  if (!entry) return null;

  const statusStyle = STATUS_STYLES[entry.status] || STATUS_STYLES.pending;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ fontWeight: 700, fontSize: 17 }}>
              {entry.formTitle || "Form Entry"}
            </Typography>
            <Chip
              label={statusStyle.label}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: 11,
                bgcolor: statusStyle.bg,
                color: statusStyle.color,
              }}
            />
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>
            Submitted {formatDate(entry.createdAt)}
          </Typography>
        </Stack>

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 12, right: 12 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Stack spacing={2.5}>
          {/* Submitter info */}
          {(entry.submitterName ||
            entry.submitterEmail ||
            entry.submitterPhone) && (
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1 }}>
                SUBMITTER
              </Typography>
              <Grid container spacing={1.5}>
                {entry.submitterName && (
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: 13, color: "#18181b" }}>
                      {entry.submitterName}
                    </Typography>
                  </Grid>
                )}
                {entry.submitterEmail && (
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: 13, color: "#52525b" }}>
                      {entry.submitterEmail}
                    </Typography>
                  </Grid>
                )}
                {entry.submitterPhone && (
                  <Grid item xs={12} sm={4}>
                    <Typography sx={{ fontSize: 13, color: "#52525b" }}>
                      {entry.submitterPhone}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          <Divider />

          {/* Dynamic submitted fields */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1 }}>
              SUBMITTED DATA
            </Typography>

            <Stack spacing={1.25}>
              {Object.entries(entry.data || {}).map(([key, value]) => (
                <Grid container spacing={1} key={key}>
                  <Grid item xs={5} sm={4}>
                    <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
                      {humanizeKey(key)}
                    </Typography>
                  </Grid>
                  <Grid item xs={7} sm={8}>
                    <Typography sx={{ fontSize: 13, color: "#18181b", wordBreak: "break-word" }}>
                      {formatValue(value)}
                    </Typography>
                  </Grid>
                </Grid>
              ))}

              {!Object.keys(entry.data || {}).length && (
                <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>
                  No fields submitted.
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Uploaded files */}
          {entry.files?.length > 0 && (
            <>
              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1 }}>
                  UPLOADED FILES
                </Typography>
                <Stack spacing={1}>
                  {entry.files.map((file, i) => {
                    const isImage = file.mimeType?.startsWith("image/");

                    return (
                      <Stack
                        key={file.public_id || i}
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        component="a"
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                          textDecoration: "none",
                          color: "inherit",
                          p: 1,
                          border: "1px solid #e4e4e7",
                          borderRadius: 1.5,
                          "&:hover": { bgcolor: "#fafafa" },
                        }}
                      >
                        {isImage ? (
                          <Avatar
                            src={file.url}
                            variant="rounded"
                            sx={{ width: 40, height: 40 }}
                          />
                        ) : (
                          <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: "#f4f4f5" }}>
                            <InsertDriveFileIcon sx={{ color: "#71717a" }} />
                          </Avatar>
                        )}
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#18181b" }} noWrap>
                            {file.originalName || "File"}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }}>
                            {humanizeKey(file.fieldName)}
                          </Typography>
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}

          <Divider />

          {/* Review note + actions */}
          <Box>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1 }}>
              REVIEW
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Add a note (optional) — visible to other admins"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              sx={{ mb: 1.5 }}
            />

            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<CheckCircleIcon />}
                disabled={statusLoading || entry.status === "approved"}
                onClick={() => onStatusChange("approved", note)}
                sx={{
                  textTransform: "none",
                  bgcolor: "#15803d",
                  "&:hover": { bgcolor: "#166534" },
                }}
              >
                Approve
              </Button>

              <Button
                size="small"
                variant="contained"
                disableElevation
                startIcon={<CancelIcon />}
                disabled={statusLoading || entry.status === "rejected"}
                onClick={() => onStatusChange("rejected", note)}
                sx={{
                  textTransform: "none",
                  bgcolor: "#dc2626",
                  "&:hover": { bgcolor: "#b91c1c" },
                }}
              >
                Reject
              </Button>

              <Button
                size="small"
                variant="outlined"
                startIcon={<ArchiveIcon />}
                disabled={statusLoading || entry.status === "archived"}
                onClick={() => onStatusChange("archived", note)}
                sx={{ textTransform: "none", color: "#3f3f46", borderColor: "#e4e4e7" }}
              >
                Archive
              </Button>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
