"use client";

import { useEffect, useState } from "react";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";

import RestartAltIcon from "@mui/icons-material/RestartAlt";
import AlignHorizontalLeftIcon from "@mui/icons-material/AlignHorizontalLeft";
import AlignHorizontalRightIcon from "@mui/icons-material/AlignHorizontalRight";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import useQuotes from "@/hooks/useQuotes";
import useQuoteSection from "@/hooks/useQuoteSection";
import { createSection, updateSection } from "@/services/quoteSectionService";
import QuoteCard from "@/components/website/quotes/QuoteCard";

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

const SIZE_OPTIONS = [
  { value: "sm", label: "S" },
  { value: "md", label: "M" },
  { value: "lg", label: "L" },
  { value: "xl", label: "XL" },
];

const slugify = (text = "") =>
  text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

const DEFAULTS = {
  title: "",
  slug: "",
  description: "",
  pageSize: 9,
  status: true,
  layout: {
    columns: 2,
    mobileColumns: 1,
    displayStyle: "grid",
    imagePosition: "right",
    cardStyle: "bordered",
    width: "lg",
    primaryColor: "#18181b",
    photoSize: "md",
    photoShape: "round",
    imageDisplay: "avatar", // "avatar" (small headshot) | "full" (larger, featured photo)
    fontSize: "md",
    mobilePhotoPosition: null, // null = auto (follow imagePosition)
  },
  button: {
    enabled: false,
    label: "View All",
    url: "",
  },
};

const EMPTY_OVERRIDES = {
  imagePosition: null,
  photoSize: null,
  photoShape: null,
  imageDisplay: null,
  fontSize: null,
  mobilePhotoPosition: null,
};

// Small "S/M/L/XL" (or any option set) picker shared by the page-wide
// defaults and the per-quote override panel, so both look/behave
// identically. `value === null` renders as nothing selected — used by
// the per-quote panel to mean "inherit the page default".
function SizeToggle({ label, value, onChange, options = SIZE_OPTIONS, allowNone, size = "small" }) {
  return (
    <Box>
      {label && (
        <Typography sx={{ fontSize: 11.5, fontWeight: 600, mb: 0.5, color: "#71717a" }}>
          {label}
        </Typography>
      )}
      <ToggleButtonGroup
        exclusive
        size={size}
        value={value ?? "__inherit"}
        onChange={(_, v) => {
          if (v === null) return; // clicking the already-selected button
          onChange(v === "__inherit" ? null : v);
        }}
      >
        {allowNone && (
          <ToggleButton value="__inherit" sx={{ px: 1, fontSize: 10.5, textTransform: "none" }}>
            Default
          </ToggleButton>
        )}
        {options.map((o) => (
          <ToggleButton key={o.value} value={o.value} sx={{ px: 1.25, fontSize: 12 }}>
            {o.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}

// ---- one row in the "quotes on this page" sortable list ----
function SelectedQuoteRow({ item, onRemove, onPatch }) {
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.quote,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const hasOverrides = Object.values(item.overrides).some((v) => v !== null);

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ bgcolor: "#fff", border: "1px solid #e4e4e7", borderRadius: 2, overflow: "hidden" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1.25 }}>
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Avatar
          src={item.quoteData?.authorImage?.url || undefined}
          sx={{ width: 36, height: 36, bgcolor: "#f4f4f5" }}
        >
          {item.quoteData?.authorName?.[0]?.toUpperCase()}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "#18181b" }} noWrap>
            {item.quoteData?.authorName || "Unknown author"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#71717a" }} noWrap>
            {item.quoteData?.quoteText}
          </Typography>
        </Box>

        <Tooltip title="Customize this quote (position, size, shape, font)">
          <IconButton
            size="small"
            onClick={() => setExpanded((e) => !e)}
            sx={{ color: hasOverrides ? "#18181b" : "#a1a1aa" }}
          >
            <TuneIcon fontSize="small" />
            {expanded ? (
              <ExpandLessIcon sx={{ fontSize: 16, ml: 0.25 }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 16, ml: 0.25 }} />
            )}
          </IconButton>
        </Tooltip>

        <IconButton size="small" onClick={onRemove} sx={{ color: "#dc2626" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 0.5, bgcolor: "#fafafa", borderTop: "1px solid #f0f0f1" }}>
          <Typography sx={{ fontSize: 11, color: "#a1a1aa", mb: 1.25 }}>
            Overrides for this quote only — anything left on "Default" follows the page
            layout settings above.
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={2}>
            <Box>
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, mb: 0.5, color: "#71717a" }}>
                Photo Position
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={item.overrides.imagePosition ?? "__inherit"}
                onChange={(_, v) =>
                  v && onPatch({ imagePosition: v === "__inherit" ? null : v })
                }
              >
                <ToggleButton value="__inherit" sx={{ px: 1, fontSize: 10.5, textTransform: "none" }}>
                  Default
                </ToggleButton>
                <ToggleButton value="left" sx={{ px: 1 }}>
                  <AlignHorizontalLeftIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
                <ToggleButton value="right" sx={{ px: 1 }}>
                  <AlignHorizontalRightIcon sx={{ fontSize: 16 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <SizeToggle
              label="Photo Size"
              value={item.overrides.photoSize}
              onChange={(v) => onPatch({ photoSize: v })}
              allowNone
            />

            <SizeToggle
              label="Photo Shape"
              value={item.overrides.photoShape}
              onChange={(v) => onPatch({ photoShape: v })}
              options={[{ value: "round", label: "Round" }, { value: "square", label: "Square" }]}
              allowNone
            />

            <SizeToggle
              label="Image Display"
              value={item.overrides.imageDisplay}
              onChange={(v) => onPatch({ imageDisplay: v })}
              options={[{ value: "avatar", label: "Avatar" }, { value: "full", label: "Full" }]}
              allowNone
            />

            <SizeToggle
              label="Quote Font Size"
              value={item.overrides.fontSize}
              onChange={(v) => onPatch({ fontSize: v })}
              allowNone
            />

            <SizeToggle
              label="Photo on Mobile"
              value={item.overrides.mobilePhotoPosition}
              onChange={(v) => onPatch({ mobilePhotoPosition: v })}
              options={[{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }]}
              allowNone
            />
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

// ---- one row in the "available quotes to add" list ----
function AvailableQuoteRow({ quote, onAdd }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        p: 1,
        borderRadius: 1.5,
        "&:hover": { bgcolor: "#fafafa" },
      }}
    >
      <Avatar src={quote.authorImage?.url || undefined} sx={{ width: 32, height: 32, bgcolor: "#f4f4f5" }}>
        {quote.authorName?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "#18181b" }} noWrap>
          {quote.authorName}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }} noWrap>
          {quote.quoteText}
        </Typography>
      </Box>
      <Tooltip title="Add to this page">
        <IconButton size="small" onClick={onAdd} sx={{ color: "#18181b" }}>
          <AddCircleOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function QuoteSectionForm({ editData, clearEdit }) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState(DEFAULTS);
  const [slugTouched, setSlugTouched] = useState(false);

  // [{ quote: id, overrides: {imagePosition, photoSize, photoShape, fontSize, mobilePhotoPosition}, quoteData }]
  const [pageQuotes, setPageQuotes] = useState([]);
  const [quoteSearch, setQuoteSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Full quote catalog to pick from — quotes already on this page are
  // filtered out of the "available" list below.
  const { data: allQuotesData } = useQuotes({ limit: 200 });
  const allQuotes = allQuotesData?.data?.data || [];

  // FIX: the row handed to us by QuoteSectionsTable comes from the list
  // endpoint (getSections), which deliberately omits `quotes` to keep
  // the table light — it only carries `quoteCount`. THIS was why editing
  // a page always showed an empty "Quotes on this page" list even for
  // pages that already had quotes. Re-fetch the full, populated detail
  // by id here instead, and use THAT for the picker.
  const editId = editData?._id;
  const { data: fullSectionData, isFetching: loadingFullSection } = useQuoteSection(editId);
  const fullSection = fullSectionData?.data;

  const resetToDefaults = () => {
    setForm(DEFAULTS);
    setSlugTouched(false);
    setPageQuotes([]);
    setQuoteSearch("");
  };

  // Basic fields populate immediately from whatever was clicked (list
  // row or full object — both carry title/slug/description/layout/etc).
  useEffect(() => {
    if (!editData) {
      resetToDefaults();
      return;
    }

    setForm({
      title: editData.title || "",
      slug: editData.slug || "",
      description: editData.description || "",
      pageSize: editData.pageSize || 9,
      status: editData.status ?? true,
      layout: { ...DEFAULTS.layout, ...(editData.layout || {}) },
      button: { ...DEFAULTS.button, ...(editData.button || {}) },
    });
    setSlugTouched(true);
  }, [editData]);

  // Quote picker populates separately, only once the full populated
  // detail for this section has actually arrived from useQuoteSection.
  useEffect(() => {
    if (!editData) return;
    if (!fullSection) return;

    setPageQuotes(
      (fullSection.quotes || []).map((item) => ({
        quote: item.quote?._id || item.quote,
        overrides: {
          imagePosition: item.imagePosition || null,
          photoSize: item.photoSize || null,
          photoShape: item.photoShape || null,
          imageDisplay: item.imageDisplay || null,
          fontSize: item.fontSize || null,
          mobilePhotoPosition: item.mobilePhotoPosition || null,
        },
        quoteData: typeof item.quote === "object" ? item.quote : null,
      })),
    );
  }, [editData, fullSection]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateSection(editData._id, payload) : createSection(payload),
    onSuccess: () => {
      toast.success(editData ? "Page updated" : "Page created");
      queryClient.invalidateQueries({ queryKey: ["quote-sections"] });
      if (editData) clearEdit?.();
      else resetToDefaults();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const setLayout = (patch) => setForm((p) => ({ ...p, layout: { ...p.layout, ...patch } }));
  const setButton = (patch) => setForm((p) => ({ ...p, button: { ...p.button, ...patch } }));

  const selectedIds = new Set(pageQuotes.map((q) => q.quote));

  const availableQuotes = allQuotes.filter((q) => {
    if (selectedIds.has(q._id)) return false;
    if (!quoteSearch.trim()) return true;
    const term = quoteSearch.toLowerCase();
    return (
      q.authorName?.toLowerCase().includes(term) || q.quoteText?.toLowerCase().includes(term)
    );
  });

  const addQuote = (quote) =>
    setPageQuotes((prev) => [
      ...prev,
      { quote: quote._id, overrides: { ...EMPTY_OVERRIDES }, quoteData: quote },
    ]);

  const removeQuote = (id) => setPageQuotes((prev) => prev.filter((q) => q.quote !== id));

  const patchQuoteOverrides = (id, patch) =>
    setPageQuotes((prev) =>
      prev.map((q) => (q.quote === id ? { ...q, overrides: { ...q.overrides, ...patch } } : q)),
    );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    setPageQuotes((prev) => {
      const oldIndex = prev.findIndex((q) => q.quote === active.id);
      const newIndex = prev.findIndex((q) => q.quote === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const previewSlug = slugify(form.slug || form.title) || "your-page-title";

  const handleSubmit = () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!pageQuotes.length) {
      toast.error("Add at least one quote to this page");
      return;
    }

    mutation.mutate({
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      pageSize: Number(form.pageSize) || 9,
      status: form.status,
      layout: form.layout,
      button: form.button,
      quotes: pageQuotes.map(({ quote, overrides }) => ({ quote, ...overrides })),
    });
  };

  // Live preview shows the first quote on the page with its own
  // resolved settings (its overrides, or the page defaults) — a true
  // "what will actually render" preview.
  const firstQuote = pageQuotes[0];
  const previewQuote = firstQuote?.quoteData || {
    quoteText: "Add a quote below to preview it here.",
    authorName: "Author Name",
    authorTitle: "",
  };
  const resolved = (key) => firstQuote?.overrides?.[key] || form.layout[key];

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2.5} flexWrap="wrap" rowGap={1}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Quote Page" : "Create a Quote Page"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Pick exactly which quotes go on this page, in what order, and customize
              each one's photo/font — or leave them on the page default.
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

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Stack spacing={2.5}>
              {/* ---- Title & Route ---- */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Page Title"
                    placeholder="What Parents Say"
                    value={form.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setForm((p) => ({
                        ...p,
                        title,
                        slug: slugTouched ? p.slug : slugify(title),
                      }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Route"
                    placeholder="parent-testimonials"
                    helperText={`Will be live at /quotes/${previewSlug}`}
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
                placeholder="A short line shown under the page title"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Quotes shown per load"
                    value={form.pageSize}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        pageSize: Math.min(30, Math.max(3, Number(e.target.value) || 9)),
                      }))
                    }
                    inputProps={{ min: 3, max: 30 }}
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
                    label="Published (visible at its route)"
                  />
                </Grid>
              </Grid>

              <Divider />

              {/* ---- Page-wide layout defaults ---- */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
                Page Layout{" "}
                <Typography component="span" sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 400 }}>
                  — the default every quote below follows unless it's customized individually
                </Typography>
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: "#52525b" }}>
                    Photo position (desktop)
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={form.layout.imagePosition}
                    onChange={(_, v) => v && setLayout({ imagePosition: v })}
                    sx={{ width: "100%" }}
                  >
                    <ToggleButton value="left" sx={{ flex: 1, textTransform: "none" }}>
                      <AlignHorizontalLeftIcon sx={{ fontSize: 18, mr: 0.75 }} /> Left
                    </ToggleButton>
                    <ToggleButton value="right" sx={{ flex: 1, textTransform: "none" }}>
                      <AlignHorizontalRightIcon sx={{ fontSize: 18, mr: 0.75 }} /> Right
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.75, color: "#52525b" }}>
                    Photo position (mobile)
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={form.layout.mobilePhotoPosition ?? "__auto"}
                    onChange={(_, v) =>
                      v && setLayout({ mobilePhotoPosition: v === "__auto" ? null : v })
                    }
                    sx={{ width: "100%" }}
                  >
                    <ToggleButton value="__auto" sx={{ flex: 1, fontSize: 11.5, textTransform: "none" }}>
                      Auto
                    </ToggleButton>
                    <ToggleButton value="top" sx={{ flex: 1, textTransform: "none" }}>
                      Top
                    </ToggleButton>
                    <ToggleButton value="bottom" sx={{ flex: 1, textTransform: "none" }}>
                      Bottom
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Typography sx={{ fontSize: 11, color: "#a1a1aa", mt: 0.5 }}>
                    Auto = matches the desktop position (Left → Top, Right → Bottom).
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <SizeToggle
                    label="Photo Size"
                    value={form.layout.photoSize}
                    onChange={(v) => setLayout({ photoSize: v || "md" })}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <SizeToggle
                    label="Photo Shape"
                    value={form.layout.photoShape}
                    onChange={(v) => setLayout({ photoShape: v || "round" })}
                    options={[{ value: "round", label: "Round" }, { value: "square", label: "Square" }]}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <SizeToggle
                    label="Image Display"
                    value={form.layout.imageDisplay}
                    onChange={(v) => setLayout({ imageDisplay: v || "avatar" })}
                    options={[{ value: "avatar", label: "Avatar" }, { value: "full", label: "Full" }]}
                  />
                  <Typography sx={{ fontSize: 11, color: "#a1a1aa", mt: 0.5 }}>
                    Full shows a larger, more prominent photo instead of a small headshot.
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <SizeToggle
                    label="Quote Font Size"
                    value={form.layout.fontSize}
                    onChange={(v) => setLayout({ fontSize: v || "md" })}
                  />
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
                    {[1, 2, 3].map((c) => (
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
                  <Typography sx={{ fontSize: 11, color: "#a1a1aa", mt: 0.5 }}>
                    Independent of desktop columns — a 2-column grid can still show
                    1-per-row on phones.
                  </Typography>
                </Grid>

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
                      List (long strips)
                    </ToggleButton>
                    <ToggleButton value="slider" sx={{ flex: 1, textTransform: "none" }}>
                      Slider (carousel)
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Typography sx={{ fontSize: 11, color: "#a1a1aa", mt: 0.5 }}>
                    List ignores the columns above — one full-width quote per row. Slider shows
                    Columns (desktop) / Columns (mobile) cards at a time, with prev/next arrows,
                    instead of "Load more".
                  </Typography>
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
                    label="Page Width"
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

              {/* ---- Optional CTA button shown below the quotes ---- */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
                    Call-to-Action Button
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
                    Optional — e.g. "View All Testimonials" linking somewhere else.
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
                      placeholder="View All"
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
                      placeholder="/quotes/parent-testimonials or https://..."
                      helperText="Internal route (starts with /) opens in the same tab; anything else opens in a new tab"
                      value={form.button.url}
                      onChange={(e) => setButton({ url: e.target.value })}
                    />
                  </Grid>
                </Grid>
              )}

              <Divider />

              {/* ---- Quote picker: which quotes, in what order, with per-quote overrides ---- */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#18181b" }}>
                Quotes on this page{" "}
                <Typography component="span" sx={{ fontSize: 12, color: "#a1a1aa", fontWeight: 400 }}>
                  ({pageQuotes.length} added) — click the tune icon on any quote to override
                  its photo/font just for that one
                </Typography>
              </Typography>

              {editData && loadingFullSection && pageQuotes.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed #d4d4d8",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    color: "#a1a1aa",
                  }}
                >
                  <Typography fontSize={13}>Loading this page's quotes...</Typography>
                </Box>
              ) : pageQuotes.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed #d4d4d8",
                    borderRadius: 2,
                    p: 3,
                    textAlign: "center",
                    color: "#a1a1aa",
                  }}
                >
                  <Typography fontSize={13}>No quotes added yet — pick some below.</Typography>
                </Box>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={pageQuotes.map((q) => q.quote)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1}>
                      {pageQuotes.map((item) => (
                        <SelectedQuoteRow
                          key={item.quote}
                          item={item}
                          onRemove={() => removeQuote(item.quote)}
                          onPatch={(patch) => patchQuoteOverrides(item.quote, patch)}
                        />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              )}

              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 1, color: "#52525b" }}>
                  Add a quote
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search your quotes by author or text..."
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  sx={{ mb: 1, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box
                  sx={{
                    maxHeight: 260,
                    overflowY: "auto",
                    border: "1px solid #e4e4e7",
                    borderRadius: 2,
                    p: 0.5,
                  }}
                >
                  {availableQuotes.length === 0 ? (
                    <Typography sx={{ fontSize: 12.5, color: "#a1a1aa", p: 1.5, textAlign: "center" }}>
                      {allQuotes.length === 0
                        ? "No quotes yet — add some in the Quotes tab first."
                        : "No matching quotes (or all have been added already)."}
                    </Typography>
                  ) : (
                    availableQuotes.map((quote) => (
                      <AvailableQuoteRow key={quote._id} quote={quote} onAdd={() => addQuote(quote)} />
                    ))
                  )}
                </Box>
              </Box>

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
                  {mutation.isPending ? "Saving..." : editData ? "Update Page" : "Create Page"}
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
              Live Preview {firstQuote && "— first quote on this page"}
            </Typography>
            <QuoteCard
              quote={previewQuote}
              variant="horizontal"
              imagePosition={resolved("imagePosition")}
              mobilePhotoPosition={resolved("mobilePhotoPosition")}
              photoSize={resolved("photoSize")}
              photoShape={resolved("photoShape")}
              imageDisplay={resolved("imageDisplay")}
              fontSize={resolved("fontSize")}
              cardStyle={form.layout.cardStyle}
              primaryColor={form.layout.primaryColor}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
