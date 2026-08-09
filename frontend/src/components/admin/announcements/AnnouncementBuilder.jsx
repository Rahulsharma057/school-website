"use client";

import { useEffect, useRef, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AttachFileIcon from "@mui/icons-material/AttachFile";
import CloseIcon from "@mui/icons-material/Close";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createAnnouncement, updateAnnouncement } from "@/services/announcementService";

const TYPE_OPTIONS = [
  { value: "general", label: "General" },
  { value: "notice", label: "Notice" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
];

const LINK_TYPE_OPTIONS = [
  { value: "none", label: "No link — just open detail page" },
  { value: "internal", label: "Internal page (e.g. /admissions)" },
  { value: "external", label: "External URL" },
];

const PLACEMENT_OPTIONS = [
  { value: "homepage-ticker", label: "Homepage Ticker" },
  { value: "navbar-ticker", label: "Navbar Ticker" },
  { value: "footer", label: "Footer" },
  { value: "notice-board", label: "Notice Board" },
  { value: "sidebar", label: "Sidebar" },
];

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

// Converts an ISO date string / Date to yyyy-MM-dd for a date input.
const toDateInputValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export default function AnnouncementBuilder({ editData, clearEdit }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [tickerText, setTickerText] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [slug, setSlug] = useState("");
  const [priority, setPriority] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState(true);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState("");

  const [linkType, setLinkType] = useState("none");
  const [linkUrl, setLinkUrl] = useState("");

  const [placements, setPlacements] = useState([]);
  const [viewRoles, setViewRoles] = useState([]);

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [existingAttachment, setExistingAttachment] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);

  useEffect(() => {
    if (!editData) {
      setTitle("");
      setTickerText("");
      setContent("");
      setType("general");
      setSlug("");
      setPriority(0);
      setPinned(false);
      setStatus(true);
      setStartDate(toDateInputValue(new Date()));
      setEndDate("");
      setLinkType("none");
      setLinkUrl("");
      setPlacements([]);
      setViewRoles([]);
      setAttachmentFile(null);
      setExistingAttachment(null);
      setRemoveAttachment(false);
      return;
    }

    setTitle(editData.title || "");
    setTickerText(editData.tickerText || "");
    setContent(editData.content || "");
    setType(editData.type || "general");
    setSlug(editData.slug || "");
    setPriority(editData.priority || 0);
    setPinned(Boolean(editData.pinned));
    setStatus(editData.status ?? true);
    setStartDate(toDateInputValue(editData.startDate) || toDateInputValue(new Date()));
    setEndDate(toDateInputValue(editData.endDate));
    setLinkType(editData.link?.type || "none");
    setLinkUrl(editData.link?.url || "");
    setPlacements(editData.placements || []);
    setViewRoles(editData.accessControl?.viewRoles || []);
    setAttachmentFile(null);
    setExistingAttachment(editData.attachment?.url ? editData.attachment : null);
    setRemoveAttachment(false);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateAnnouncement(editData._id, payload) : createAnnouncement(payload),
    onSuccess: () => {
      toast.success(editData ? "Announcement updated" : "Announcement created");
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const togglePlacement = (value) =>
    setPlacements((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));

  const toggleRole = (value) =>
    setViewRoles((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));

  const previewSlug = slugify(slug || title) || "your-announcement-title";

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("Title is required");
    if (!tickerText.trim()) return toast.error("Ticker text is required");
    if (tickerText.length > 220) return toast.error("Ticker text should stay short (max ~220 chars)");

    if (linkType !== "none" && !linkUrl.trim()) {
      return toast.error("A URL is required for the selected link type");
    }

    if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
      return toast.error("End date must be after the start date");
    }

    mutation.mutate({
      title,
      tickerText,
      content,
      type,
      slug,
      priority,
      pinned,
      status,
      startDate,
      endDate: endDate || null,
      link: { type: linkType, url: linkType === "none" ? "" : linkUrl },
      placements,
      accessControl: { viewRoles },
      attachment: attachmentFile || undefined,
      removeAttachment,
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Announcement" : "Create Announcement"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Short ticker text scrolls on the site; the full content shows when clicked.
            </Typography>
          </Box>
          {editData && (
            <Chip label={`Editing: ${editData.title}`} size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />
          )}
        </Stack>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Title (internal / detail page heading)" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField select fullWidth size="small" label="Type" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Ticker Text (1-2 lines)"
              placeholder="Admissions for 2026-27 now open — click to know more"
              value={tickerText}
              onChange={(e) => setTickerText(e.target.value)}
              helperText={`${tickerText.length}/220`}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={5}
              label="Full Content (shown on detail page)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              size="small"
              label="Public Route"
              placeholder="Leave empty to auto-generate"
              helperText={`Will be available at /announcements/${previewSlug}`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Priority"
              helperText="Higher shows first"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </Grid>

          <Grid item xs={6} md={2}>
            <FormControlLabel control={<Switch checked={pinned} onChange={(e) => setPinned(e.target.checked)} />} label="Pin to top" />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={1.5}>Link (optional)</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={5}>
            <TextField select fullWidth size="small" label="Link Type" value={linkType} onChange={(e) => setLinkType(e.target.value)}>
              {LINK_TYPE_OPTIONS.map((l) => (
                <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {linkType !== "none" && (
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                size="small"
                label={linkType === "external" ? "External URL" : "Internal Path"}
                placeholder={linkType === "external" ? "https://example.com" : "/admissions"}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </Grid>
          )}
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={1.5}>Attachment (optional)</Typography>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => {
              setAttachmentFile(e.target.files[0] || null);
              setRemoveAttachment(false);
            }}
          />
          <Button
            size="small"
            startIcon={<AttachFileIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
          >
            {attachmentFile ? attachmentFile.name : existingAttachment ? "Replace file" : "Attach file"}
          </Button>

          {(existingAttachment || attachmentFile) && !removeAttachment && (
            <Chip
              label={attachmentFile ? attachmentFile.name : existingAttachment.originalName || "Current file"}
              onDelete={() => {
                setAttachmentFile(null);
                setRemoveAttachment(true);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              deleteIcon={<CloseIcon />}
              sx={{ bgcolor: "#f4f4f5" }}
            />
          )}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={1.5}>Schedule & Status</Typography>
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="End Date (optional)"
              helperText="Leave empty to never expire"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active" />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={1}>Where should this appear?</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} mb={3}>
          {PLACEMENT_OPTIONS.map((p) => (
            <Chip
              key={p.value}
              label={p.label}
              clickable
              onClick={() => togglePlacement(p.value)}
              sx={{ fontWeight: 600, bgcolor: placements.includes(p.value) ? "#18181b" : "#f4f4f5", color: placements.includes(p.value) ? "#fff" : "#3f3f46" }}
            />
          ))}
        </Stack>

        <Typography fontWeight={700} mb={1}>Who can view the detail page?</Typography>
        <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1 }}>
          Leave unchecked to keep it public — restricted announcements never appear in an unauthenticated ticker either way.
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} mb={3}>
          {ROLE_OPTIONS.map((role) => (
            <Chip
              key={role}
              label={role}
              clickable
              onClick={() => toggleRole(role)}
              sx={{ fontWeight: 600, bgcolor: viewRoles.includes(role) ? "#18181b" : "#f4f4f5", color: viewRoles.includes(role) ? "#fff" : "#3f3f46" }}
            />
          ))}
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Button
          sx={{ px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : editData ? "Update Announcement" : "Save Announcement"}
        </Button>
      </CardContent>
    </Card>
  );
}