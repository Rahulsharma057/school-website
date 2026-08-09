"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createGallery, updateGallery } from "@/services/galleryService";

const LAYOUT_OPTIONS = [
  { value: "grid", label: "Grid (equal tiles)" },
  { value: "masonry", label: "Masonry (Pinterest-style)" },
  { value: "carousel", label: "Carousel (horizontal scroll)" },
];

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

export default function GalleryBuilder({ editData, clearEdit }) {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [heading, setHeading] = useState("");
  const [subheading, setSubheading] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);

  const [layoutType, setLayoutType] = useState("grid");
  const [columns, setColumns] = useState(4);
  const [gap, setGap] = useState(12);
  const [rounded, setRounded] = useState(true);

  const [previewCount, setPreviewCount] = useState(8);
  const [viewAllEnabled, setViewAllEnabled] = useState(true);

  useEffect(() => {
    if (!editData) {
      setTitle("");
      setSlug("");
      setHeading("");
      setSubheading("");
      setDescription("");
      setStatus(true);
      setLayoutType("grid");
      setColumns(4);
      setGap(12);
      setRounded(true);
      setPreviewCount(8);
      setViewAllEnabled(true);
      return;
    }

    setTitle(editData.title || "");
    setSlug(editData.slug || "");
    setHeading(editData.heading || "");
    setSubheading(editData.subheading || "");
    setDescription(editData.description || "");
    setStatus(editData.status ?? true);
    setLayoutType(editData.layout?.type || "grid");
    setColumns(editData.layout?.columns || 4);
    setGap(editData.layout?.gap ?? 12);
    setRounded(editData.layout?.rounded ?? true);
    setPreviewCount(editData.previewCount || 8);
    setViewAllEnabled(editData.viewAllEnabled ?? true);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateGallery(editData._id, payload) : createGallery(payload),
    onSuccess: () => {
      toast.success(editData ? "Gallery updated" : "Gallery created");
      queryClient.invalidateQueries({ queryKey: ["galleries"] });
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const previewSlug = slugify(slug || title) || "your-gallery-title";

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    mutation.mutate({
      title,
      slug,
      heading,
      subheading,
      description,
      status,
      previewCount,
      viewAllEnabled,
      layout: { type: layoutType, columns, gap, rounded },
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Gallery" : "Create Gallery"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Title, layout, and route — photos are managed separately once the gallery exists.
            </Typography>
          </Box>

          {editData && (
            <Chip
              label={`Editing: ${editData.title}`}
              size="small"
              sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }}
            />
          )}
        </Stack>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Gallery Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Slug"
              placeholder="school-annual-day"
              helperText={`Will be available at /gallery/${previewSlug}`}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Heading" placeholder="Annual Day 2026" value={heading} onChange={(e) => setHeading(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField fullWidth size="small" label="Subheading" placeholder="Moments from our biggest celebration" value={subheading} onChange={(e) => setSubheading(e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth size="small" multiline rows={2} label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active (visible on site)" />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={2}>Layout</Typography>

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField select fullWidth size="small" label="Layout Type" value={layoutType} onChange={(e) => setLayoutType(e.target.value)}>
              {LAYOUT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {layoutType !== "carousel" && (
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Columns" value={columns} onChange={(e) => setColumns(Number(e.target.value))}>
                {[2, 3, 4, 5, 6].map((c) => (
                  <MenuItem key={c} value={c}>{c} columns</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          <Grid item xs={12} md={4}>
            <FormControlLabel control={<Switch checked={rounded} onChange={(e) => setRounded(e.target.checked)} />} label="Rounded corners" />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Gap between images: {gap}px</Typography>
            <Slider size="small" value={gap} min={0} max={32} step={2} onChange={(_, v) => setGap(v)} sx={{ color: "#18181b" }} />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography fontWeight={700} mb={2}>Preview & "View All"</Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Images shown before "View All": {previewCount}
            </Typography>
            <Slider size="small" value={previewCount} min={1} max={24} onChange={(_, v) => setPreviewCount(v)} sx={{ color: "#18181b" }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={<Switch checked={viewAllEnabled} onChange={(e) => setViewAllEnabled(e.target.checked)} />}
              label='Show "View All" button when there are more photos'
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Button
          sx={{
            px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px",
            fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" },
          }}
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : editData ? "Update Gallery" : "Save Gallery"}
        </Button>
      </CardContent>
    </Card>
  );
}
