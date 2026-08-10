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
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import RestartAltIcon from "@mui/icons-material/RestartAlt";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createSection, updateSection } from "@/services/newsSectionService";

const WIDTH_OPTIONS = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large (default)" },
  { value: "xl", label: "Extra Large" },
  { value: "full", label: "Full Width" },
];

const CARD_STYLE_OPTIONS = [
  { value: "bordered", label: "Bordered (default)" },
  { value: "plain", label: "Plain" },
  { value: "minimal", label: "Minimal" },
];

const slugify = (text = "") =>
  text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

const DEFAULTS = {
  title: "",
  slug: "",
  description: "",
  pageSize: 6,
  status: true,
  filter: { category: "", tag: "", featuredOnly: false },
  layout: {
    columns: 3,
    mobileColumns: 1,
    displayStyle: "grid",
    cardStyle: "bordered",
    width: "lg",
    primaryColor: "#18181b",
  },
  button: { enabled: true, label: "View All News", url: "/news" },
};

export default function NewsSectionForm({ editData, clearEdit }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(DEFAULTS);
  const [slugTouched, setSlugTouched] = useState(false);

  const resetToDefaults = () => {
    setForm(DEFAULTS);
    setSlugTouched(false);
  };

  useEffect(() => {
    if (!editData) {
      resetToDefaults();
      return;
    }

    setForm({
      title: editData.title || "",
      slug: editData.slug || "",
      description: editData.description || "",
      pageSize: editData.pageSize || 6,
      status: editData.status ?? true,
      filter: { ...DEFAULTS.filter, ...(editData.filter || {}) },
      layout: { ...DEFAULTS.layout, ...(editData.layout || {}) },
      button: { ...DEFAULTS.button, ...(editData.button || {}) },
    });
    setSlugTouched(true);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateSection(editData._id, payload) : createSection(payload),
    onSuccess: () => {
      toast.success(editData ? "Section updated" : "Section created");
      queryClient.invalidateQueries({ queryKey: ["news-sections"] });
      if (editData) clearEdit?.();
      else resetToDefaults();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const setFilter = (patch) => setForm((p) => ({ ...p, filter: { ...p.filter, ...patch } }));
  const setLayout = (patch) => setForm((p) => ({ ...p, layout: { ...p.layout, ...patch } }));
  const setButton = (patch) => setForm((p) => ({ ...p, button: { ...p.button, ...patch } }));

  const previewSlug = slugify(form.slug || form.title) || "your-section-title";

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error("Title is required");

    mutation.mutate({
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      pageSize: Number(form.pageSize) || 6,
      status: form.status,
      filter: form.filter,
      layout: form.layout,
      button: form.button,
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" rowGap={1}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update News Section" : "Create a News Section"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              A filtered, styled, routable news widget — e.g. "Sports News" showing only
              sports-tagged articles, with its own layout and route.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            {editData && (
              <Chip
                label={`Editing: ${editData.title}`}
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

        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Section Title"
                placeholder="Sports News"
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((p) => ({ ...p, title, slug: slugTouched ? p.slug : slugify(title) }));
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Route"
                placeholder="sports-news"
                helperText={`Will be live at /news/collections/${previewSlug}`}
                value={form.slug}
                onChange={(e) => {
                  setForm((p) => ({ ...p, slug: e.target.value }));
                  setSlugTouched(true);
                }}
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Articles per load"
                value={form.pageSize}
                onChange={(e) =>
                  setForm((p) => ({ ...p, pageSize: Math.min(24, Math.max(3, Number(e.target.value) || 6)) }))
                }
                inputProps={{ min: 3, max: 24 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch checked={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked }))} />
                }
                label="Published (visible at its route)"
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
            Which Articles{" "}
            <Typography component="span" sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 400 }}>
              — leave all empty to show every published article
            </Typography>
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Category"
                placeholder="e.g. sports"
                value={form.filter.category}
                onChange={(e) => setFilter({ category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                label="Tag"
                placeholder="e.g. admissions"
                value={form.filter.tag}
                onChange={(e) => setFilter({ tag: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.filter.featuredOnly}
                    onChange={(e) => setFilter({ featuredOnly: e.target.checked })}
                  />
                }
                label="Featured only"
              />
            </Grid>
          </Grid>

          <Divider />

          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>Layout</Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: "#52525b" }}>
                Display Style
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.layout.displayStyle}
                onChange={(_, v) => v && setLayout({ displayStyle: v })}
                sx={{ width: "100%" }}
              >
                <ToggleButton value="grid" sx={{ flex: 1, textTransform: "none" }}>
                  Grid (cards)
                </ToggleButton>
                <ToggleButton value="list" sx={{ flex: 1, textTransform: "none" }}>
                  List (wide rows)
                </ToggleButton>
                <ToggleButton value="slider" sx={{ flex: 1, textTransform: "none" }}>
                  Slider (carousel)
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: "#52525b" }}>
                Columns (desktop)
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.layout.columns}
                onChange={(_, v) => v && setLayout({ columns: v })}
                sx={{ width: "100%" }}
              >
                {[1, 2, 3, 4].map((c) => (
                  <ToggleButton key={c} value={c} sx={{ flex: 1, textTransform: "none" }}>
                    {c}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: "#52525b" }}>
                Columns (mobile)
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={form.layout.mobileColumns}
                onChange={(_, v) => v && setLayout({ mobileColumns: v })}
                sx={{ width: "100%" }}
              >
                {[1, 2].map((c) => (
                  <ToggleButton key={c} value={c} sx={{ flex: 1, textTransform: "none" }}>
                    {c}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Card Style"
                value={form.layout.cardStyle}
                onChange={(e) => setLayout({ cardStyle: e.target.value })}
              >
                {CARD_STYLE_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Section Width"
                value={form.layout.width}
                onChange={(e) => setLayout({ width: e.target.value })}
              >
                {WIDTH_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Accent Color"
                type="color"
                value={form.layout.primaryColor}
                onChange={(e) => setLayout({ primaryColor: e.target.value })}
                sx={{ "& input": { height: 28, cursor: "pointer" } }}
              />
            </Grid>
          </Grid>

          <Divider />

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
                "View All" Button
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
                Shown below this section, linking to the full listing (or anywhere else).
              </Typography>
            </Box>
            <Switch checked={form.button.enabled} onChange={(e) => setButton({ enabled: e.target.checked })} />
          </Stack>

          {form.button.enabled && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Button Label"
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
                  placeholder="/news or /news/collections/sports-news"
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
              {mutation.isPending ? "Saving..." : editData ? "Update Section" : "Create Section"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
