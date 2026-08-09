"use client";

import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createQuote, updateQuote } from "@/services/quoteService";
import QuoteCard from "@/components/website/quotes/QuoteCard";

const MAX_QUOTE_LENGTH = 600;
const MAX_NAME_LENGTH = 100;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const DEFAULTS = {
  quoteText: "",
  authorName: "",
  authorTitle: "",
  category: "",
  status: true,
  button: {
    enabled: false,
    label: "Read More",
    url: "",
  },
};

export default function QuoteForm({ editData, clearEdit }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(DEFAULTS);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [removeImage, setRemoveImage] = useState(false);

  // Returns the whole form — text, image, everything — to its default,
  // empty state. Used by both the explicit "Reset" button and after a
  // successful create (so the form is ready for the next quote).
  const resetToDefaults = () => {
    setForm(DEFAULTS);
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!editData) {
      resetToDefaults();
      return;
    }

    setForm({
      quoteText: editData.quoteText || "",
      authorName: editData.authorName || "",
      authorTitle: editData.authorTitle || "",
      category: editData.category || "",
      status: editData.status ?? true,
      button: { ...DEFAULTS.button, ...(editData.button || {}) },
    });
    setImageFile(null);
    setImagePreview(editData.authorImage?.url || "");
    setRemoveImage(false);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (formData) =>
      editData ? updateQuote(editData?._id, formData) : createQuote(formData),
    onSuccess: () => {
      toast.success(editData ? "Quote updated" : "Quote added");
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      if (editData) clearEdit?.();
      else resetToDefaults();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const setButton = (patch) => setForm((p) => ({ ...p, button: { ...p.button, ...patch } }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, WEBP or GIF images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!form.quoteText.trim()) return toast.error("Quote text is required");
    if (form.quoteText.trim().length > MAX_QUOTE_LENGTH) {
      return toast.error(`Quote text must be at most ${MAX_QUOTE_LENGTH} characters`);
    }
    if (!form.authorName.trim()) return toast.error("Author name is required");
    if (form.authorName.trim().length > MAX_NAME_LENGTH) {
      return toast.error(`Author name must be at most ${MAX_NAME_LENGTH} characters`);
    }

    const fd = new FormData();
    fd.append("quoteText", form.quoteText.trim());
    fd.append("authorName", form.authorName.trim());
    fd.append("authorTitle", form.authorTitle.trim());
    fd.append("category", form.category.trim());
    fd.append("status", String(form.status));
    // multer parses multipart text fields into plain strings, so a
    // nested object has to travel as a JSON string — quote.controller.js
    // JSON.parses this back out server-side.
    fd.append("button", JSON.stringify(form.button));
    if (imageFile) fd.append("authorImage", imageFile);
    if (removeImage) fd.append("removeImage", "true");

    mutation.mutate(fd);
  };

  // The form doubles as a live preview of the QuoteCard component so an
  // admin sees exactly what visitors will see before saving — including
  // this quote's own per-card button, if enabled.
  const previewQuote = {
    quoteText: form.quoteText || "Your quote will appear here exactly as visitors will see it.",
    authorName: form.authorName || "Author Name",
    authorTitle: form.authorTitle,
    category: form.category,
    authorImage: { url: imagePreview },
    button: form.button,
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" rowGap={1}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Quote" : "Add a Quote"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Testimonials shown on the public quotes wall.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {editData && (
              <Chip
                label={`Editing: ${editData.authorName}`}
                size="small"
                sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }}
              />
            )}
            <Button
              size="small"
              startIcon={<RestartAltIcon />}
              onClick={() => {
                resetToDefaults();
                clearEdit?.();
              }}
              sx={{ textTransform: "none", color: "#71717a" }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                label="Quote"
                placeholder="What did they say?"
                value={form.quoteText}
                onChange={(e) => setForm((p) => ({ ...p, quoteText: e.target.value }))}
                inputProps={{ maxLength: MAX_QUOTE_LENGTH }}
                helperText={`${form.quoteText.length}/${MAX_QUOTE_LENGTH}`}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Author Name"
                    value={form.authorName}
                    onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                    inputProps={{ maxLength: MAX_NAME_LENGTH }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Author Title (optional)"
                    placeholder="e.g. Class 10 Student, Parent, Principal"
                    value={form.authorTitle}
                    onChange={(e) => setForm((p) => ({ ...p, authorTitle: e.target.value }))}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Category (optional)"
                    placeholder="e.g. Alumni, Parent, Staff"
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.status}
                        onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked }))}
                      />
                    }
                    label="Visible on public wall"
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                  Author Photo (optional)
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={imagePreview || undefined}
                    sx={{ width: 56, height: 56, bgcolor: "#f4f4f5" }}
                  />
                  <Button
                    component="label"
                    size="small"
                    startIcon={<CloudUploadIcon />}
                    sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
                  >
                    Upload Photo
                    <input
                      hidden
                      ref={fileInputRef}
                      type="file"
                      accept={ALLOWED_IMAGE_TYPES.join(",")}
                      onChange={handleImageChange}
                    />
                  </Button>
                  {imagePreview && (
                    <Button
                      size="small"
                      onClick={handleRemoveImage}
                      sx={{ textTransform: "none", color: "#dc2626" }}
                    >
                      Remove
                    </Button>
                  )}
                </Stack>
              </Box>

              <Divider />

              {/* ---- Optional per-card button — travels with this quote
                   wherever it's used, independent of any page-wide "View
                   All" button a Quote Page might also show. ---- */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
                    Card Button
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
                    Optional — e.g. "Read Full Story" on this specific quote's card.
                  </Typography>
                </Box>
                <Switch
                  checked={form.button.enabled}
                  onChange={(e) => setButton({ enabled: e.target.checked })}
                />
              </Stack>

              {form.button.enabled && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Button Label"
                      placeholder="Read More"
                      value={form.button.label}
                      onChange={(e) => setButton({ label: e.target.value })}
                      inputProps={{ maxLength: 60 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Button Route / Link"
                      placeholder="/stories/riya-sharma or https://..."
                      helperText="Internal route (starts with /) opens in the same tab; anything else opens in a new tab"
                      value={form.button.url}
                      onChange={(e) => setButton({ url: e.target.value })}
                    />
                  </Grid>
                </Grid>
              )}

              <Stack direction="row" spacing={1.5} mt={1}>
                <Button
                  disableElevation
                  disabled={mutation.isPending}
                  onClick={handleSubmit}
                  sx={{
                    px: 4,
                    py: 1.2,
                    bgcolor: "#18181b",
                    color: "#fff",
                    borderRadius: "8px",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": { bgcolor: "#27272a" },
                  }}
                >
                  {mutation.isPending ? "Saving..." : editData ? "Update Quote" : "Add Quote"}
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: "#a1a1aa",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Live Preview
            </Typography>
            <QuoteCard quote={previewQuote} variant="horizontal" />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
