"use client";

import { useEffect, useState } from "react";

import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArticleIcon from "@mui/icons-material/Article";
import ImageIcon from "@mui/icons-material/Image";
import CollectionsIcon from "@mui/icons-material/Collections";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import LinkIcon from "@mui/icons-material/Link";
import VisibilityIcon from "@mui/icons-material/Visibility";
import TuneIcon from "@mui/icons-material/Tune";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";

import { useForm, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { createPage, updatePage } from "@/services/customPageService";

import SectionsBuilder from "./SectionsBuilder";
import ImageUploadButtons from "@/components/common/ImageUploadButtons";
import DynamicPageContent from "./DynamicPageContent";

const CONTENT_POSITIONS = [
  "top-left", "top-center", "top-right",
  "center-left", "center", "center-right",
  "bottom-left", "bottom-center", "bottom-right",
];

function FormSection({ icon, title, subtitle, badge, defaultExpanded = true, children }) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      elevation={0}
      sx={{ border: "1px solid #e4e4e7", borderRadius: "10px !important", "&:before": { display: "none" }, overflow: "hidden" }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: "#fafafa", minHeight: 56, "& .MuiAccordionSummary-content": { alignItems: "center" } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1 }}>
          <Box sx={{ color: "#71717a", display: "flex" }}>{icon}</Box>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#18181b" }}>{title}</Typography>
            {subtitle && <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>{subtitle}</Typography>}
          </Box>
          {badge && <Chip label={badge} size="small" sx={{ ml: 1, fontSize: 11, fontWeight: 600, bgcolor: "#f4f4f5", color: "#3f3f46" }} />}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3, borderTop: "1px solid #f4f4f5" }}>{children}</AccordionDetails>
    </Accordion>
  );
}

// ---- draggable gallery thumbnail (page-level gallery, not section gallery) ----
function DraggableGalleryThumb({ id, src, borderColor, onRemove, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <Box ref={setNodeRef} style={style} sx={{ position: "relative" }}>
      <Box {...attributes} {...listeners} sx={{ position: "absolute", top: -8, left: -8, zIndex: 1, cursor: "grab", bgcolor: "#18181b", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <DragIndicatorIcon sx={{ fontSize: 13 }} />
      </Box>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" style={{ width: 110, height: 82, objectFit: "cover", borderRadius: 6, border: `1px solid ${borderColor}` }} />
      <IconButton size="small" onClick={onRemove} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7", p: 0.3, "&:hover": { bgcolor: "#fef2f2" } }}>
        <CloseIcon sx={{ fontSize: 14, color: "#dc2626" }} />
      </IconButton>
      {children}
    </Box>
  );
}

export default function CustomPageForm({ editData, clearEdit, onDirtyChange }) {
  const queryClient = useQueryClient();

  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [removeCoverImage, setRemoveCoverImage] = useState(false);

  // FIX: existing + new gallery images now live in ONE ordered array
  // (each tagged _dndKey + isNew) so drag-and-drop can reorder across
  // both — previously they were two separate, non-reorderable lists.
  const [galleryItems, setGalleryItems] = useState([]); // [{ _dndKey, isNew, file?, url, public_id?, alt, ... }]
  const [removeGalleryIds, setRemoveGalleryIds] = useState([]);

  const [sections, setSections] = useState([]);

  // FIX: NEW — live preview dialog + a lightweight "has anything been
  // touched" flag, reported up to the parent so it can warn before
  // discarding an in-progress edit.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const markTouched = () => setTouched(true);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      title: "", slug: "", route: "", shortDescription: "", content: "",
      buttonText: "", buttonLink: "", seoTitle: "", seoDescription: "", keywords: "",
      pageType: "General", pageWidth: "large",
      showInNavbar: false, navbarOrder: 0, showInFooter: false, footerOrder: 0,
      featured: false, status: true, order: 0,
      coverImageAlt: "", coverImageObjectFit: "cover", coverImagePosition: "center", coverImageBorderRadius: 0,
      galleryObjectFit: "cover", galleryPosition: "center", galleryBorderRadius: 0,
      // Header
      headerEnabled: true,
      headerShowBackground: true,
      headerContentPosition: "bottom-left",
      headerOverlayColor: "#09090b",
      headerOverlayOpacity: 0.55,
      headerMinHeight: 420,
      headerHeadingColor: "#ffffff",
      headerHeadingBackground: "",
    },
  });

  const headerEnabled = watch("headerEnabled");
  const headerShowBackground = watch("headerShowBackground");

  useEffect(() => {
    onDirtyChange?.(isDirty || touched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, touched]);

  useEffect(() => {
    setTouched(false); // fresh session (new editData, or switching to "create") starts clean
    if (!editData) {
      setSections([]);
      setGalleryItems([]);
      setRemoveGalleryIds([]);
      setRemoveCoverImage(false);
      return;
    }

    let keywords = "";
    if (Array.isArray(editData.keywords)) {
      keywords = editData.keywords
        .map((item) => {
          try {
            const data = JSON.parse(item);
            return Array.isArray(data) ? data.join(",") : data;
          } catch {
            return item;
          }
        })
        .join(",");
    }

    reset({
      title: editData.title ?? "",
      slug: editData.slug ?? "",
      route: editData.route ?? "",
      shortDescription: editData.shortDescription ?? "",
      content: editData.content ?? "",
      buttonText: editData.buttonText ?? "",
      buttonLink: editData.buttonLink ?? "",
      seoTitle: editData.seoTitle ?? "",
      seoDescription: editData.seoDescription ?? "",
      keywords,
      pageType: editData.pageType ?? "General",
      pageWidth: editData.pageWidth ?? "large",
      showInNavbar: editData.showInNavbar ?? false,
      navbarOrder: editData.navbarOrder ?? 0,
      showInFooter: editData.showInFooter ?? false,
      footerOrder: editData.footerOrder ?? 0,
      featured: editData.featured ?? false,
      status: editData.status ?? true,
      order: editData.order ?? 0,
      coverImageAlt: editData.coverImage?.alt ?? "",
      coverImageObjectFit: editData.coverImage?.objectFit ?? "cover",
      coverImagePosition: editData.coverImage?.position ?? "center",
      coverImageBorderRadius: editData.coverImage?.borderRadius ?? 0,
      galleryObjectFit: editData.gallery?.[0]?.objectFit ?? "cover",
      galleryPosition: editData.gallery?.[0]?.position ?? "center",
      galleryBorderRadius: editData.gallery?.[0]?.borderRadius ?? 0,
      headerEnabled: editData.header?.enabled ?? true,
      headerShowBackground: editData.header?.showBackground ?? true,
      headerContentPosition: editData.header?.contentPosition ?? "bottom-left",
      headerOverlayColor: editData.header?.overlayColor ?? "#09090b",
      headerOverlayOpacity: editData.header?.overlayOpacity ?? 0.55,
      headerMinHeight: editData.header?.minHeight ?? 420,
      headerHeadingColor: editData.header?.headingColor ?? "#ffffff",
      headerHeadingBackground: editData.header?.headingBackground ?? "",
    });

    setCoverPreview(editData.coverImage?.url || "");
    setCoverImage(null);
    setRemoveCoverImage(false);
    setRemoveGalleryIds([]);

    setGalleryItems(
      (editData.gallery || []).map((img) => ({ ...img, _dndKey: crypto.randomUUID(), isNew: false })),
    );

    setSections(
      (editData.sections || []).map((s) => ({
        _key: s._id || crypto.randomUUID(),
        type: s.type || "text",
        title: s.title || "",
        heading: s.heading || "",
        subheading: s.subheading || "",
        description: s.description || "",
        content: s.content || "",
        videoUrl: s.videoUrl || "",
        image: s.image?.url ? s.image : null,
        image2: s.image2?.url ? s.image2 : null,
        images: s.images || [],
        faqItems: s.faqItems || [],
        cardItems: (s.cardItems || []).map((c) => ({ ...c, subheading: c.subheading || "", button: c.button || { text: "", link: "", style: "primary", openInNewTab: false } })),
        button: s.button || { text: "", link: "", style: "primary", openInNewTab: false },
        layout: s.layout || "left",
        imageSize: s.imageSize || "medium",
        titleAlign: s.titleAlign || "left",
        subtitleAlign: s.subtitleAlign || "left",
        background: s.background || "#ffffff",
        textColor: s.textColor || "#000000",
        borderRadius: s.borderRadius ?? 0,
        padding: s.padding ?? 40,
        columns: s.columns ?? 3,
        cardLayout: s.cardLayout || "grid",
        cardStyle: s.cardStyle || "elevated",
        cardImageShape: s.cardImageShape || "square",
        cardDirection: s.cardDirection || "vertical",
        cardImageSizeMode: s.cardImageSizeMode || "auto",
        cardImageWidth: s.cardImageWidth ?? 200,
        cardImageHeight: s.cardImageHeight ?? 160,
        cardMinWidth: s.cardMinWidth ?? 220,
        showCardHeading: s.showCardHeading ?? true,
        backgroundImage: s.backgroundImage?.url ? s.backgroundImage : null,
        backgroundOverlayColor: s.backgroundOverlayColor || "#000000",
        backgroundOverlayOpacity: s.backgroundOverlayOpacity ?? 0.4,
      })),
    );
  }, [editData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => (editData ? updatePage(editData._id, data) : createPage(data)),
    onSuccess: () => {
      toast.success(editData ? "Page Updated" : "Page Created");
      queryClient.invalidateQueries({ queryKey: ["custom-pages"] });
      reset();
      setCoverImage(null);
      setCoverPreview("");
      setRemoveCoverImage(false);
      setGalleryItems([]);
      setRemoveGalleryIds([]);
      setSections([]);
      setTouched(false);
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const serializeSections = (sections) => {
    const files = [];
    const pushFile = (file) => {
      files.push(file);
      return files.length - 1;
    };

    const mapImage = (img) => {
      if (!img) return img;
      if (img.__pendingFile) {
        const idx = pushFile(img.__pendingFile);
        return { __localFile: idx, alt: img.alt || "", objectFit: img.objectFit || "cover", position: img.position || "center", borderRadius: img.borderRadius || 0 };
      }
      // eslint-disable-next-line no-unused-vars
      const { __pendingFile, _dndKey, ...clean } = img;
      return clean;
    };

    const cleanSections = sections.map(({ _key, ...section }) => {
      const next = { ...section };
      if (next.image) next.image = mapImage(next.image);
      if (next.image2) next.image2 = mapImage(next.image2);
      if (next.backgroundImage) next.backgroundImage = mapImage(next.backgroundImage);
      if (Array.isArray(next.images)) next.images = next.images.map(mapImage);
      if (Array.isArray(next.cardItems)) {
        next.cardItems = next.cardItems.map((c) => {
          // eslint-disable-next-line no-unused-vars
          const { _dndKey, ...cleanCard } = c;
          return { ...cleanCard, image: c.image ? mapImage(c.image) : c.image };
        });
      }
      if (Array.isArray(next.faqItems)) {
        next.faqItems = next.faqItems.map((f) => {
          // eslint-disable-next-line no-unused-vars
          const { _dndKey, ...cleanFaq } = f;
          return cleanFaq;
        });
      }
      return next;
    });

    return { sectionsJson: JSON.stringify(cleanSections), files };
  };

  const HEADER_FIELD_KEYS = [
    "headerEnabled", "headerShowBackground", "headerContentPosition",
    "headerOverlayColor", "headerOverlayOpacity", "headerMinHeight",
    "headerHeadingColor", "headerHeadingBackground",
  ];

  const submit = (values) => {
    if (values.buttonText && !values.buttonLink) {
      toast.error("Button Link is required when Button Text is set");
      return;
    }

    const fd = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key === "keywords") {
        value.split(",").map((x) => x.trim()).filter(Boolean).forEach((k) => fd.append("keywords", k));
      } else if (HEADER_FIELD_KEYS.includes(key)) {
        // collected below into a single `header` JSON blob
      } else {
        fd.append(key, typeof value === "boolean" ? String(value) : (value ?? ""));
      }
    });

    fd.append(
      "header",
      JSON.stringify({
        enabled: values.headerEnabled,
        showBackground: values.headerShowBackground,
        contentPosition: values.headerContentPosition,
        overlayColor: values.headerOverlayColor,
        overlayOpacity: Number(values.headerOverlayOpacity),
        minHeight: Number(values.headerMinHeight),
        headingColor: values.headerHeadingColor,
        headingBackground: values.headerHeadingBackground,
      }),
    );

    if (coverImage) {
      fd.append("coverImage", coverImage);
    } else if (removeCoverImage) {
      fd.append("removeCoverImage", "true");
    }

    // gallery: split the single ordered galleryItems list back into
    // "new files, in order" + "existing images kept, in order" — order
    // itself isn't sent to the backend (gallery has no per-image order
    // field), but new uploads still go out in the order shown.
    galleryItems.filter((g) => g.isNew).forEach((g) => fd.append("gallery", g.file));

    if (removeGalleryIds.length) {
      fd.append("removeGalleryIds", JSON.stringify(removeGalleryIds));
    }

    const { sectionsJson, files } = serializeSections(sections);
    fd.append("sections", sectionsJson);
    files.forEach((file) => fd.append("sectionImages", file));

    mutation.mutate(fd);
  };

  const handleCoverFile = (file) => {
    markTouched();
    setCoverImage(file);
    setCoverPreview(URL.createObjectURL(file));
    setRemoveCoverImage(false);
  };

  const handleRemoveCoverImage = () => {
    markTouched();
    setCoverImage(null);
    setCoverPreview("");
    setRemoveCoverImage(true);
  };

  const addGalleryFiles = (fileList) => {
    markTouched();
    const items = Array.from(fileList || []).map((file) => ({
      _dndKey: crypto.randomUUID(), isNew: true, file, url: URL.createObjectURL(file), alt: "",
    }));
    setGalleryItems((prev) => [...prev, ...items]);
  };

  const removeGalleryItem = (dndKey) => {
    markTouched();
    setGalleryItems((prev) => {
      const target = prev.find((g) => g._dndKey === dndKey);
      if (target && !target.isNew && target.public_id) {
        setRemoveGalleryIds((ids) => [...ids, target.public_id]);
      }
      return prev.filter((g) => g._dndKey !== dndKey);
    });
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const handleGalleryDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    markTouched();
    setGalleryItems((prev) => {
      const oldIndex = prev.findIndex((g) => g._dndKey === active.id);
      const newIndex = prev.findIndex((g) => g._dndKey === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  // Sections come from a child (SectionsBuilder) that only knows how to
  // call setSections — wrap it once here so every section add/edit/
  // remove/reorder also marks the form touched, without threading
  // markTouched through every handler inside SectionsBuilder itself.
  const setSectionsTracked = (updater) => {
    markTouched();
    setSections(updater);
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Custom Page" : "Create Custom Page"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>Fill in the sections below — click any header to expand it.</Typography>
          </Box>
          {editData && <Chip label={`Editing: ${editData.title || editData.slug}`} size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />}
        </Stack>

        <Box component="form" onSubmit={handleSubmit(submit)}>
          <Stack spacing={2}>
            {/* ================= BASIC INFO ================= */}
            <FormSection icon={<ArticleIcon />} title="Basic Information" subtitle="Title, URL, and page content">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size="small" label="Title" required {...register("title", { required: true })} error={!!errors.title} helperText={errors.title ? "Title is required" : ""} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size="small" label="Slug" placeholder="about-our-school" helperText="Leave empty to auto-generate from title" {...register("slug")} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth size="small" label="Route" placeholder="/about" {...register("route")} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField fullWidth size="small" type="number" label="Display Order" {...register("order", { valueAsNumber: true })} />
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Controller
                    name="pageWidth"
                    control={control}
                    render={({ field }) => (
                      <TextField select fullWidth size="small" label="Page Width" value={field.value || "large"} onChange={field.onChange}>
                        <MenuItem value="small">Small (article-style)</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large (default)</MenuItem>
                        <MenuItem value="full">Full width</MenuItem>
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth multiline rows={3} size="small" label="Short Description" {...register("shortDescription")} />
                </Grid>
                <Grid size={12}>
                  <TextField fullWidth multiline rows={4} size="small" label="Legacy Content" helperText="Optional — prefer using Page Sections below for new pages" {...register("content")} />
                </Grid>
              </Grid>
            </FormSection>

            {/* ================= HEADER / HERO STYLE ================= */}
            <FormSection
              icon={<TuneIcon />}
              title="Header Style"
              subtitle="The banner at the top of the page — can be turned off entirely, or shown without a background photo"
              badge={headerEnabled ? (headerShowBackground ? "Photo header" : "Text-only header") : "Hidden"}
            >
              <Stack spacing={2.5}>
                <Stack direction="row" flexWrap="wrap" columnGap={4} rowGap={0.5}>
                  <Controller
                    name="headerEnabled"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                        label="Show Header"
                      />
                    )}
                  />
                  <Controller
                    name="headerShowBackground"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        disabled={!headerEnabled}
                        control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                        label="Show Cover Photo / Overlay"
                      />
                    )}
                  />
                </Stack>

                {headerEnabled && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Controller
                        name="headerContentPosition"
                        control={control}
                        render={({ field }) => (
                          <TextField select fullWidth size="small" label="Text Position" value={field.value} onChange={field.onChange} disabled={!headerShowBackground}>
                            {CONTENT_POSITIONS.map((pos) => (
                              <MenuItem key={pos} value={pos}>{pos.replace("-", " ")}</MenuItem>
                            ))}
                          </TextField>
                        )}
                      />
                    </Grid>

                    <Grid size={{ xs: 6, md: 2.5 }}>
                      <TextField fullWidth size="small" type="color" label="Heading Color" {...register("headerHeadingColor")} sx={{ "& input": { height: 28 } }} />
                    </Grid>

                    <Grid size={{ xs: 6, md: 3.5 }}>
                      <TextField
                        fullWidth size="small" label="Heading Background (optional highlight box)"
                        placeholder="e.g. #18181b, or leave blank for none"
                        {...register("headerHeadingBackground")}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField fullWidth size="small" type="number" label="Min Height (px)" {...register("headerMinHeight", { valueAsNumber: true })} />
                    </Grid>

                    {headerShowBackground && (
                      <>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <TextField fullWidth size="small" type="color" label="Overlay Color" {...register("headerOverlayColor")} sx={{ "& input": { height: 28 } }} />
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <TextField fullWidth size="small" type="number" label="Overlay Opacity" inputProps={{ min: 0, max: 1, step: 0.05 }} {...register("headerOverlayOpacity", { valueAsNumber: true })} />
                        </Grid>
                      </>
                    )}
                  </Grid>
                )}
              </Stack>
            </FormSection>

            {/* ================= COVER IMAGE ================= */}
            <FormSection icon={<ImageIcon />} title="Cover Image" subtitle="Used as the header's background photo (when enabled above)" badge={coverPreview ? "Set" : "Empty"}>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" rowGap={2}>
                  {coverPreview && (
                    <Box sx={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={coverPreview} alt="" style={{ width: 220, height: 130, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                      <IconButton size="small" onClick={handleRemoveCoverImage} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7", "&:hover": { bgcolor: "#fef2f2" } }}>
                        <CloseIcon fontSize="small" sx={{ color: "#dc2626" }} />
                      </IconButton>
                    </Box>
                  )}

                  <ImageUploadButtons aspect={21 / 9} onFile={handleCoverFile} label={coverPreview ? "Replace Cover Image" : "Upload Cover Image"} />
                </Stack>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth size="small" label="Alt Text" {...register("coverImageAlt")} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                    <Controller name="coverImageObjectFit" control={control} render={({ field }) => (
                      <TextField select fullWidth size="small" label="Object Fit" value={field.value || "cover"} onChange={field.onChange}>
                        <MenuItem value="cover">Cover</MenuItem><MenuItem value="contain">Contain</MenuItem><MenuItem value="fill">Fill</MenuItem>
                      </TextField>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                    <Controller name="coverImagePosition" control={control} render={({ field }) => (
                      <TextField select fullWidth size="small" label="Position" value={field.value || "center"} onChange={field.onChange}>
                        <MenuItem value="center">Center</MenuItem><MenuItem value="top">Top</MenuItem><MenuItem value="bottom">Bottom</MenuItem>
                        <MenuItem value="left">Left</MenuItem><MenuItem value="right">Right</MenuItem>
                      </TextField>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Border Radius" {...register("coverImageBorderRadius", { valueAsNumber: true })} />
                  </Grid>
                </Grid>
              </Stack>
            </FormSection>

            {/* ================= GALLERY (now drag-to-reorder) ================= */}
            <FormSection icon={<CollectionsIcon />} title="Gallery" subtitle="Extra images shown below the page content — drag to reorder" badge={`${galleryItems.length} image${galleryItems.length === 1 ? "" : "s"}`}>
              <Stack spacing={2.5}>
                <Box>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGalleryDragEnd}>
                    <SortableContext items={galleryItems.map((g) => g._dndKey)} strategy={horizontalListSortingStrategy}>
                      <Stack direction="row" flexWrap="wrap" gap={1.5} mb={galleryItems.length ? 2 : 0}>
                        {galleryItems.map((g) => (
                          <DraggableGalleryThumb
                            key={g._dndKey}
                            id={g._dndKey}
                            src={g.url}
                            borderColor={g.isNew ? "#16a34a" : "#e4e4e7"}
                            onRemove={() => removeGalleryItem(g._dndKey)}
                          />
                        ))}
                      </Stack>
                    </SortableContext>
                  </DndContext>

                  <ImageUploadButtons aspect={4 / 3} multiple onFile={(file) => addGalleryFiles([file])} label="Add Gallery Images" />
                </Box>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                    <Controller name="galleryObjectFit" control={control} render={({ field }) => (
                      <TextField select fullWidth size="small" label="Object Fit" value={field.value || "cover"} onChange={field.onChange}>
                        <MenuItem value="cover">Cover</MenuItem><MenuItem value="contain">Contain</MenuItem><MenuItem value="fill">Fill</MenuItem>
                      </TextField>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
                    <Controller name="galleryPosition" control={control} render={({ field }) => (
                      <TextField select fullWidth size="small" label="Position" value={field.value || "center"} onChange={field.onChange}>
                        <MenuItem value="center">Center</MenuItem><MenuItem value="top">Top</MenuItem><MenuItem value="bottom">Bottom</MenuItem>
                        <MenuItem value="left">Left</MenuItem><MenuItem value="right">Right</MenuItem>
                      </TextField>
                    )} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <TextField fullWidth size="small" type="number" label="Border Radius" {...register("galleryBorderRadius", { valueAsNumber: true })} />
                  </Grid>
                </Grid>
              </Stack>
            </FormSection>

            {/* ================= SECTIONS BUILDER ================= */}
            <FormSection icon={<ViewModuleIcon />} title="Page Sections" subtitle="Build the page body — hero, cards, FAQ, gallery, image+text blocks, and more" badge={`${sections.length} section${sections.length === 1 ? "" : "s"}`}>
              <SectionsBuilder sections={sections} setSections={setSectionsTracked} />
            </FormSection>

            {/* ================= BUTTON & SEO ================= */}
            <FormSection icon={<LinkIcon />} title="Button, SEO & Category" subtitle="Call-to-action link, search metadata, and page type">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="Button Text" {...register("buttonText")} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="Button Link" {...register("buttonLink")} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="SEO Title" {...register("seoTitle")} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="SEO Description" {...register("seoDescription")} /></Grid>
                <Grid size={{ xs: 12, md: 8 }}><TextField fullWidth size="small" label="Keywords" placeholder="school, education, admission" {...register("keywords")} /></Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Controller name="pageType" control={control} render={({ field }) => (
                    <TextField select fullWidth size="small" label="Page Type" value={field.value || "General"} onChange={field.onChange}>
                      <MenuItem value="General">General</MenuItem><MenuItem value="About">About</MenuItem><MenuItem value="Founder">Founder</MenuItem>
                      <MenuItem value="Chairman">Chairman</MenuItem><MenuItem value="Principal">Principal</MenuItem><MenuItem value="Director">Director</MenuItem>
                      <MenuItem value="Trust">Trust</MenuItem><MenuItem value="Infrastructure">Infrastructure</MenuItem><MenuItem value="Facilities">Facilities</MenuItem>
                      <MenuItem value="Admission">Admission</MenuItem><MenuItem value="Gallery">Gallery</MenuItem><MenuItem value="Contact">Contact</MenuItem>
                    </TextField>
                  )} />
                </Grid>
              </Grid>
            </FormSection>

            {/* ================= VISIBILITY ================= */}
            <FormSection icon={<VisibilityIcon />} title="Navigation & Visibility" subtitle="Where this page appears, and whether it's live">
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" type="number" label="Navbar Order" {...register("navbarOrder", { valueAsNumber: true })} /></Grid>
                <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" type="number" label="Footer Order" {...register("footerOrder", { valueAsNumber: true })} /></Grid>
                <Grid size={12}>
                  <Stack direction="row" flexWrap="wrap" columnGap={4} rowGap={0.5}>
                    <Controller name="showInNavbar" control={control} render={({ field }) => (
                      <FormControlLabel control={<Switch checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />} label="Show In Navbar" />
                    )} />
                    <Controller name="showInFooter" control={control} render={({ field }) => (
                      <FormControlLabel control={<Switch checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />} label="Show In Footer" />
                    )} />
                    <Controller name="featured" control={control} render={({ field }) => (
                      <FormControlLabel control={<Switch checked={field.value ?? false} onChange={(e) => field.onChange(e.target.checked)} />} label="Featured" />
                    )} />
                    <Controller name="status" control={control} render={({ field }) => (
                      <FormControlLabel control={<Switch checked={field.value ?? true} onChange={(e) => field.onChange(e.target.checked)} />} label="Active" />
                    )} />
                  </Stack>
                </Grid>
              </Grid>
            </FormSection>
          </Stack>

          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<RemoveRedEyeIcon />}
              onClick={() => setPreviewOpen(true)}
              sx={{ px: 3, py: 1.4, borderRadius: "8px", fontWeight: 600, textTransform: "none", borderColor: "#e4e4e7", color: "#18181b" }}
            >
              Preview
            </Button>

            <Button
              sx={{ px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
              disableElevation
              type="submit"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : editData ? "Update Page" : "Save Page"}
            </Button>
          </Stack>
        </Box>
      </CardContent>

      {/* FIX: NEW — live preview, built entirely from in-progress form
          state (no save required first). Uses the exact same renderer
          the public site uses, so what you see here is what goes live. */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth={false} fullWidth sx={{ "& .MuiDialog-paper": { width: "100%", maxWidth: 1200, borderRadius: 3 } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5" }}>
          <Stack>
            <Typography sx={{ fontWeight: 700, fontSize: 16 }}>Preview</Typography>
            <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Unsaved changes included — this is not yet live.</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {previewOpen && (
            <DynamicPageContent
              page={{
                title: getValues("title"),
                shortDescription: getValues("shortDescription"),
                content: getValues("content"),
                pageType: getValues("pageType"),
                pageWidth: getValues("pageWidth"),
                buttonText: getValues("buttonText"),
                buttonLink: getValues("buttonLink"),
                coverImage: coverPreview
                  ? {
                      url: coverPreview,
                      alt: getValues("coverImageAlt"),
                      objectFit: getValues("coverImageObjectFit"),
                      position: getValues("coverImagePosition"),
                      borderRadius: getValues("coverImageBorderRadius"),
                    }
                  : null,
                gallery: galleryItems.map((g) => ({
                  url: g.url,
                  public_id: g.public_id || g._dndKey,
                  alt: g.alt || "",
                  objectFit: getValues("galleryObjectFit"),
                  position: getValues("galleryPosition"),
                  borderRadius: getValues("galleryBorderRadius"),
                })),
                sections,
                header: {
                  enabled: getValues("headerEnabled"),
                  showBackground: getValues("headerShowBackground"),
                  contentPosition: getValues("headerContentPosition"),
                  overlayColor: getValues("headerOverlayColor"),
                  overlayOpacity: getValues("headerOverlayOpacity"),
                  minHeight: getValues("headerMinHeight"),
                  headingColor: getValues("headerHeadingColor"),
                  headingBackground: getValues("headerHeadingBackground"),
                },
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
