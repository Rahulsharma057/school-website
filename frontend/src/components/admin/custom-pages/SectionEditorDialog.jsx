"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloseIcon from "@mui/icons-material/Close";

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
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import ImageUploadButtons from "@/components/common/ImageUploadButtons";

const SECTION_TYPES = ["hero", "text", "imageText", "gallery", "cards", "video", "cta", "faq", "contact"];

const toPendingImage = (file) => ({
  __pendingFile: file,
  url: URL.createObjectURL(file),
  alt: "",
  objectFit: "cover",
  position: "center",
  borderRadius: 0,
});

const emptyButton = () => ({ text: "", link: "", style: "primary", openInNewTab: false });

export const emptySection = () => ({
  _key: crypto.randomUUID(),
  type: "text",
  title: "",
  heading: "",
  subheading: "",
  description: "",
  content: "",
  videoUrl: "",
  image: null,
  image2: null,
  images: [],
  faqItems: [],
  cardItems: [],
  button: emptyButton(),
  layout: "left",
  imageSize: "medium",
  titleAlign: "left",
  subtitleAlign: "left",
  background: "#ffffff",
  textColor: "#000000",
  borderRadius: 0,
  padding: 40,
  columns: 3,
  cardLayout: "grid",
  cardStyle: "elevated",
  cardImageShape: "square",
  cardDirection: "vertical",
  cardImageSizeMode: "auto",
  cardImageWidth: 200,
  cardImageHeight: 160,
  cardMinWidth: 220,
  showCardHeading: true,
  backgroundImage: null,
  backgroundOverlayColor: "#000000",
  backgroundOverlayOpacity: 0.4,
});

// ---- small draggable row helpers (gallery images / cards) ----

function DraggableThumb({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <Box ref={setNodeRef} style={style} sx={{ position: "relative" }}>
      <Box
        {...attributes}
        {...listeners}
        sx={{
          position: "absolute", top: -8, left: -8, zIndex: 1, cursor: "grab",
          bgcolor: "#18181b", color: "#fff", borderRadius: "50%", width: 20, height: 20,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <DragIndicatorIcon sx={{ fontSize: 13 }} />
      </Box>
      {children}
    </Box>
  );
}

export default function SectionEditorDialog({ open, section, onClose, onSave }) {
  const [draft, setDraft] = useState(section || emptySection());

  useEffect(() => {
    if (open) {
      // ensure nested arrays have stable dnd-kit ids for this editing session
      const withKeys = section || emptySection();
      setDraft({
        ...withKeys,
        images: (withKeys.images || []).map((img) => ({ ...img, _dndKey: img._dndKey || crypto.randomUUID() })),
        cardItems: (withKeys.cardItems || []).map((c) => ({ ...c, _dndKey: c._dndKey || crypto.randomUUID(), button: c.button || emptyButton() })),
        faqItems: (withKeys.faqItems || []).map((f) => ({ ...f, _dndKey: f._dndKey || crypto.randomUUID() })),
        button: withKeys.button || emptyButton(),
        backgroundImage: withKeys.backgroundImage || null,
      });
    }
  }, [open, section]);

  const patch = (fields) => setDraft((prev) => ({ ...prev, ...fields }));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // FIX (bug): this used to be `draft.type === "cards"`, which hid the
  // entire card sizing/layout config for any section that had cardItems
  // but a different declared type (e.g. a "text" section with a heading,
  // paragraph, AND a row of cards underneath — a very normal thing to
  // want). The config is only meaningful when cards actually exist, so
  // gate on that instead of the section's type label.
  const isCardsType = draft.cardItems.length > 0;
  const isHeroType = draft.type === "hero";

  // ---- gallery images ----
  const addImages = (files) => {
    const items = files.map((f) => ({ ...toPendingImage(f), _dndKey: crypto.randomUUID() }));
    patch({ images: [...draft.images, ...items] });
  };
  const removeImageAt = (i) => patch({ images: draft.images.filter((_, idx) => idx !== i) });
  const patchImageAt = (i, fields) => patch({ images: draft.images.map((img, idx) => (idx === i ? { ...img, ...fields } : img)) });
  const handleGalleryDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = draft.images.findIndex((i) => i._dndKey === active.id);
    const newIndex = draft.images.findIndex((i) => i._dndKey === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    patch({ images: arrayMove(draft.images, oldIndex, newIndex) });
  };

  // ---- cards ----
  const addCard = () =>
    patch({ cardItems: [...draft.cardItems, { _dndKey: crypto.randomUUID(), title: "", subheading: "", description: "", icon: "", image: null, button: emptyButton() }] });
  const removeCardAt = (i) => patch({ cardItems: draft.cardItems.filter((_, idx) => idx !== i) });
  const patchCardAt = (i, fields) => patch({ cardItems: draft.cardItems.map((c, idx) => (idx === i ? { ...c, ...fields } : c)) });
  const handleCardsDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = draft.cardItems.findIndex((c) => c._dndKey === active.id);
    const newIndex = draft.cardItems.findIndex((c) => c._dndKey === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    patch({ cardItems: arrayMove(draft.cardItems, oldIndex, newIndex) });
  };

  // ---- faq ----
  const addFaq = () => patch({ faqItems: [...draft.faqItems, { _dndKey: crypto.randomUUID(), question: "", answer: "" }] });
  const removeFaqAt = (i) => patch({ faqItems: draft.faqItems.filter((_, idx) => idx !== i) });
  const patchFaqAt = (i, fields) => patch({ faqItems: draft.faqItems.map((f, idx) => (idx === i ? { ...f, ...fields } : f)) });
  const handleFaqDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = draft.faqItems.findIndex((f) => f._dndKey === active.id);
    const newIndex = draft.faqItems.findIndex((f) => f._dndKey === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    patch({ faqItems: arrayMove(draft.faqItems, oldIndex, newIndex) });
  };

  const handleSave = () => onSave(draft);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #f4f4f5" }}>
        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{section?._key ? "Edit Section" : "Add Section"}</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          {/* ---- type + internal label ---- */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth size="small" label="Section Type" value={draft.type} onChange={(e) => patch({ type: e.target.value })}>
              {SECTION_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Internal Label (optional, admin-only)" value={draft.title} onChange={(e) => patch({ title: e.target.value })} />
          </Grid>

          <Grid size={12}><Divider /></Grid>

          {/* ---- text content ---- */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Heading" value={draft.heading} onChange={(e) => patch({ heading: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Subheading" value={draft.subheading} onChange={(e) => patch({ subheading: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField select fullWidth size="small" label="Title Align" value={draft.titleAlign} onChange={(e) => patch({ titleAlign: e.target.value })}>
              <MenuItem value="left">Left</MenuItem><MenuItem value="center">Center</MenuItem><MenuItem value="right">Right</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField select fullWidth size="small" label="Subtitle Align" value={draft.subtitleAlign} onChange={(e) => patch({ subtitleAlign: e.target.value })}>
              <MenuItem value="left">Left</MenuItem><MenuItem value="center">Center</MenuItem><MenuItem value="right">Right</MenuItem>
            </TextField>
          </Grid>

          <Grid size={12}>
            <TextField fullWidth multiline rows={2} size="small" label="Description" value={draft.description} onChange={(e) => patch({ description: e.target.value })} />
          </Grid>
          <Grid size={12}>
            <TextField fullWidth multiline rows={4} size="small" label="Content" value={draft.content} onChange={(e) => patch({ content: e.target.value })} />
          </Grid>

          <Grid size={12}>
            <TextField fullWidth size="small" label="Video URL (YouTube / Vimeo embed link)" placeholder="https://www.youtube.com/embed/..." value={draft.videoUrl} onChange={(e) => patch({ videoUrl: e.target.value })} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth size="small" label="Image Position" value={draft.layout} onChange={(e) => patch({ layout: e.target.value })}>
              <MenuItem value="left">Image Left</MenuItem><MenuItem value="right">Image Right</MenuItem>
              <MenuItem value="top">Image Top</MenuItem><MenuItem value="bottom">Image Bottom</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth size="small" label="Image Size" value={draft.imageSize} onChange={(e) => patch({ imageSize: e.target.value })}>
              <MenuItem value="small">Small</MenuItem><MenuItem value="medium">Medium</MenuItem><MenuItem value="large">Large</MenuItem>
            </TextField>
          </Grid>

          <Grid size={12}><Divider /></Grid>

          {/* ---- primary image + image2 ---- */}
          <Grid size={12}>
            <Typography fontSize={13} fontWeight={600} mb={1}>Image</Typography>
            {draft.image?.url ? (
              <Box sx={{ position: "relative", width: 200, mb: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.image.url} alt="" style={{ width: 200, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <IconButton size="small" onClick={() => patch({ image: null })} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7" }}>
                  <CloseIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                </IconButton>
              </Box>
            ) : null}
            <ImageUploadButtons aspect={16 / 9} onFile={(file) => patch({ image: toPendingImage(file) })} label={draft.image?.url ? "Replace Image" : "Upload Image"} />
          </Grid>

          <Grid size={12}>
            <Typography fontSize={13} fontWeight={600} mb={1}>Image 2 (optional — pairs with Image for a 2-image layout)</Typography>
            {draft.image2?.url ? (
              <Box sx={{ position: "relative", width: 200, mb: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.image2.url} alt="" style={{ width: 200, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <IconButton size="small" onClick={() => patch({ image2: null })} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7" }}>
                  <CloseIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                </IconButton>
              </Box>
            ) : null}
            <ImageUploadButtons aspect={16 / 9} onFile={(file) => patch({ image2: toPendingImage(file) })} label={draft.image2?.url ? "Replace Image 2" : "Upload Image 2"} />
          </Grid>

          {/* ---- section background image (any type — a hero-style banner behind the whole section) ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={12}>
            <Typography fontSize={13} fontWeight={600} mb={0.5}>
              Section Background Image {isHeroType && "(this is what makes a Hero section look like a banner)"}
            </Typography>
            <Typography fontSize={12} color="#a1a1aa" mb={1}>
              Optional — a full-width photo behind this section's text, with its own dark overlay.
            </Typography>
            {draft.backgroundImage?.url ? (
              <Box sx={{ position: "relative", width: 240, mb: 1 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draft.backgroundImage.url} alt="" style={{ width: 240, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                <IconButton size="small" onClick={() => patch({ backgroundImage: null })} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7" }}>
                  <CloseIcon sx={{ fontSize: 14, color: "#dc2626" }} />
                </IconButton>
              </Box>
            ) : null}
            <ImageUploadButtons aspect={21 / 9} onFile={(file) => patch({ backgroundImage: toPendingImage(file) })} label={draft.backgroundImage?.url ? "Replace Background" : "Upload Background Image"} />

            {draft.backgroundImage?.url && (
              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth size="small" type="color" label="Overlay Color" value={draft.backgroundOverlayColor} onChange={(e) => patch({ backgroundOverlayColor: e.target.value })} sx={{ "& input": { height: 28 } }} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth size="small" type="number" label="Overlay Opacity" inputProps={{ min: 0, max: 1, step: 0.05 }} value={draft.backgroundOverlayOpacity} onChange={(e) => patch({ backgroundOverlayOpacity: Number(e.target.value) })} />
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* ---- gallery images (draggable) ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={12}>
            <Typography fontSize={13} fontWeight={600} mb={1}>Gallery Images ({draft.images.length}) — drag to reorder</Typography>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGalleryDragEnd}>
              <SortableContext items={draft.images.map((i) => i._dndKey)} strategy={horizontalListSortingStrategy}>
                <Stack direction="row" flexWrap="wrap" gap={1.5} mb={1.5}>
                  {draft.images.map((img, i) => (
                    <DraggableThumb key={img._dndKey} id={img._dndKey}>
                      <Box sx={{ width: 130 }}>
                        <Box sx={{ position: "relative" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt="" style={{ width: 130, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                          <IconButton size="small" onClick={() => removeImageAt(i)} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7", p: 0.3 }}>
                            <CloseIcon sx={{ fontSize: 13, color: "#dc2626" }} />
                          </IconButton>
                        </Box>
                        <TextField
                          size="small" placeholder="Alt text" value={img.alt || ""}
                          onChange={(e) => patchImageAt(i, { alt: e.target.value })}
                          sx={{ mt: 0.5, width: "100%" }}
                        />
                      </Box>
                    </DraggableThumb>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>

            <ImageUploadButtons aspect={4 / 3} multiple onFile={(file) => addImages([file])} label="Add Gallery Images" />
          </Grid>

          {/* ---- cards (draggable) ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontSize={13} fontWeight={600}>Cards ({draft.cardItems.length})</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addCard} sx={{ textTransform: "none" }}>Add Card</Button>
            </Stack>

            {isCardsType && (
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField fullWidth size="small" type="number" label="Cards Per Row" inputProps={{ min: 1, max: 6 }} value={draft.columns} onChange={(e) => patch({ columns: Number(e.target.value) })} />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Layout" value={draft.cardLayout} onChange={(e) => patch({ cardLayout: e.target.value })}>
                    <MenuItem value="grid">Grid (wraps to new rows)</MenuItem>
                    <MenuItem value="row">Horizontal scroll (slider)</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Card Style" value={draft.cardStyle} onChange={(e) => patch({ cardStyle: e.target.value })}>
                    <MenuItem value="elevated">Elevated</MenuItem>
                    <MenuItem value="outlined">Outlined</MenuItem>
                    <MenuItem value="flat">Flat</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Image Shape" value={draft.cardImageShape} onChange={(e) => patch({ cardImageShape: e.target.value })}>
                    <MenuItem value="square">Square</MenuItem>
                    <MenuItem value="rounded">Rounded</MenuItem>
                    <MenuItem value="circle">Circle</MenuItem>
                    <MenuItem value="wide">Wide (16:9)</MenuItem>
                  </TextField>
                </Grid>

                {/* FIX: NEW — card internal direction (image top vs image left) */}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField select fullWidth size="small" label="Card Direction" value={draft.cardDirection || "vertical"} onChange={(e) => patch({ cardDirection: e.target.value })}>
                    <MenuItem value="vertical">Vertical (image on top)</MenuItem>
                    <MenuItem value="horizontal">Horizontal (image on left)</MenuItem>
                  </TextField>
                </Grid>

                {/* FIX: NEW — auto (image stretches to fit) vs custom fixed width/height */}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    select fullWidth size="small" label="Image Size Mode"
                    value={draft.cardImageSizeMode || "auto"}
                    onChange={(e) => patch({ cardImageSizeMode: e.target.value })}
                  >
                    <MenuItem value="auto">Auto (fills card width)</MenuItem>
                    <MenuItem value="custom">Custom (fixed size)</MenuItem>
                  </TextField>
                </Grid>

                {draft.cardImageSizeMode === "custom" && (
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth size="small" type="number" label="Image Width (px)"
                      inputProps={{ min: 40, max: 500 }}
                      value={draft.cardImageWidth ?? 200}
                      onChange={(e) => patch({ cardImageWidth: Number(e.target.value) })}
                    />
                  </Grid>
                )}

                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth size="small" type="number" label="Image Height (px)"
                    inputProps={{ min: 60, max: 500 }}
                    value={draft.cardImageHeight ?? 160}
                    onChange={(e) => patch({ cardImageHeight: Number(e.target.value) })}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth size="small" type="number" label="Min Card Width (px)"
                    inputProps={{ min: 120, max: 600 }}
                    value={draft.cardMinWidth ?? 220}
                    onChange={(e) => patch({ cardMinWidth: Number(e.target.value) })}
                    helperText="Cards won't shrink below this width"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }} sx={{ display: "flex", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={draft.showCardHeading ?? true}
                      onChange={(e) => patch({ showCardHeading: e.target.checked })}
                    />
                    <Typography fontSize={13.5}>Show card title/heading text</Typography>
                  </label>
                </Grid>
              </Grid>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCardsDragEnd}>
              <SortableContext items={draft.cardItems.map((c) => c._dndKey)} strategy={verticalListSortingStrategy}>
                <Stack spacing={1.5}>
                  {draft.cardItems.map((card, i) => (
                    <DraggableThumb key={card._dndKey} id={card._dndKey}>
                      <Box sx={{ p: 2, pl: 3.5, border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={2}>
                          <Box sx={{ width: 90 }}>
                            {card.image?.url ? (
                              <Box sx={{ position: "relative" }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={card.image.url} alt="" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #e4e4e7" }} />
                                <IconButton size="small" onClick={() => patchCardAt(i, { image: null })} sx={{ position: "absolute", top: -8, right: -8, bgcolor: "#fff", border: "1px solid #e4e4e7", p: 0.3 }}>
                                  <CloseIcon sx={{ fontSize: 12, color: "#dc2626" }} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ width: 90, height: 90, borderRadius: 1.5, border: "1px dashed #d4d4d8" }} />
                            )}
                            <Box sx={{ mt: 0.5 }}>
                              <ImageUploadButtons aspect={1} onFile={(file) => patchCardAt(i, { image: toPendingImage(file) })} label="Image" />
                            </Box>
                          </Box>

                          <Stack spacing={1} sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1}>
                              <TextField size="small" fullWidth label="Card Title" value={card.title} onChange={(e) => patchCardAt(i, { title: e.target.value })} />
                              <TextField size="small" label="Icon" placeholder="e.g. school" value={card.icon} onChange={(e) => patchCardAt(i, { icon: e.target.value })} sx={{ width: 110 }} />
                              <IconButton size="small" sx={{ color: "#dc2626" }} onClick={() => removeCardAt(i)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>

                            <TextField size="small" fullWidth label="Card Subheading (optional)" value={card.subheading || ""} onChange={(e) => patchCardAt(i, { subheading: e.target.value })} />

                            <TextField size="small" fullWidth multiline rows={2} label="Card Description" value={card.description} onChange={(e) => patchCardAt(i, { description: e.target.value })} />

                            <Stack direction="row" spacing={1}>
                              <TextField size="small" fullWidth label="Card Button Text (optional)" value={card.button?.text || ""} onChange={(e) => patchCardAt(i, { button: { ...card.button, text: e.target.value } })} />
                              <TextField size="small" fullWidth label="Card Button Link" value={card.button?.link || ""} onChange={(e) => patchCardAt(i, { button: { ...card.button, link: e.target.value } })} />
                              <TextField select size="small" label="Style" value={card.button?.style || "primary"} onChange={(e) => patchCardAt(i, { button: { ...card.button, style: e.target.value } })} sx={{ width: 120 }}>
                                <MenuItem value="primary">Primary</MenuItem>
                                <MenuItem value="secondary">Secondary</MenuItem>
                                <MenuItem value="outline">Outline</MenuItem>
                              </TextField>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Box>
                    </DraggableThumb>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </Grid>

          {/* ---- faq (draggable) ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={12}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontSize={13} fontWeight={600}>FAQs ({draft.faqItems.length}) — drag to reorder</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addFaq} sx={{ textTransform: "none" }}>Add FAQ</Button>
            </Stack>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFaqDragEnd}>
              <SortableContext items={draft.faqItems.map((f) => f._dndKey)} strategy={verticalListSortingStrategy}>
                <Stack spacing={1.5}>
                  {draft.faqItems.map((faq, i) => (
                    <DraggableThumb key={faq._dndKey} id={faq._dndKey}>
                      <Stack spacing={1} sx={{ p: 2, pl: 3.5, border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
                        <Stack direction="row" spacing={1}>
                          <TextField size="small" fullWidth label="Question" value={faq.question} onChange={(e) => patchFaqAt(i, { question: e.target.value })} />
                          <IconButton size="small" sx={{ color: "#dc2626" }} onClick={() => removeFaqAt(i)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                        <TextField size="small" fullWidth multiline rows={2} label="Answer" value={faq.answer} onChange={(e) => patchFaqAt(i, { answer: e.target.value })} />
                      </Stack>
                    </DraggableThumb>
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
          </Grid>

          {/* ---- section-level button ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Button Text" value={draft.button.text} onChange={(e) => patch({ button: { ...draft.button, text: e.target.value } })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Button Link" value={draft.button.link} onChange={(e) => patch({ button: { ...draft.button, link: e.target.value } })} />
          </Grid>
          <Grid size={{ xs: 8, sm: 2 }}>
            <TextField select fullWidth size="small" label="Style" value={draft.button.style} onChange={(e) => patch({ button: { ...draft.button, style: e.target.value } })}>
              <MenuItem value="primary">Primary</MenuItem><MenuItem value="secondary">Secondary</MenuItem><MenuItem value="outline">Outline</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 4, sm: 2 }}>
            <TextField select fullWidth size="small" label="Open" value={draft.button.openInNewTab ? "new" : "same"} onChange={(e) => patch({ button: { ...draft.button, openInNewTab: e.target.value === "new" } })}>
              <MenuItem value="same">Same Tab</MenuItem><MenuItem value="new">New Tab</MenuItem>
            </TextField>
          </Grid>

          {/* ---- style ---- */}
          <Grid size={12}><Divider /></Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField fullWidth size="small" type="color" label="Background" value={draft.background} onChange={(e) => patch({ background: e.target.value })} sx={{ "& input": { height: 28 } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField fullWidth size="small" type="color" label="Text Color" value={draft.textColor} onChange={(e) => patch({ textColor: e.target.value })} sx={{ "& input": { height: 28 } }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField fullWidth size="small" type="number" label="Border Radius (px)" value={draft.borderRadius ?? 0} onChange={(e) => patch({ borderRadius: Number(e.target.value) })} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField fullWidth size="small" type="number" label="Padding (px)" value={draft.padding} onChange={(e) => patch({ padding: Number(e.target.value) })} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, borderTop: "1px solid #f4f4f5" }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#71717a" }}>Cancel</Button>
        <Button variant="contained" disableElevation onClick={handleSave} sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}>
          Save Section
        </Button>
      </DialogActions>
    </Dialog>
  );
}
