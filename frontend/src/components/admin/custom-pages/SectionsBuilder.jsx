"use client";

import { useState } from "react";

import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";

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

import SectionEditorDialog, { emptySection } from "./SectionEditorDialog";

const TYPE_LABELS = {
  hero: "Hero / Banner",
  text: "Text",
  imageText: "Image + Text",
  gallery: "Gallery",
  cards: "Cards",
  video: "Video",
  cta: "Call to Action",
  faq: "FAQ",
  contact: "Contact",
};

function summaryLine(section) {
  const bits = [];
  if (section.type === "cards") bits.push(`${section.cardItems?.length || 0} card(s)`);
  if (section.type === "gallery") bits.push(`${section.images?.length || 0} image(s)`);
  if (section.type === "faq") bits.push(`${section.faqItems?.length || 0} question(s)`);
  if (section.image?.url || section.backgroundImage?.url) bits.push("has image");
  return bits.join(" · ") || "Not configured yet";
}

function SortableSectionRow({ section, index, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section._key });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1, zIndex: isDragging ? 1 : "auto" };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex", alignItems: "center", gap: 1.5, p: 1.75,
        border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff",
      }}
    >
      <Box {...attributes} {...listeners} sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa", display: "flex" }}>
        <DragIndicatorIcon fontSize="small" />
      </Box>

      <Chip label={`#${index + 1}`} size="small" sx={{ fontWeight: 700, bgcolor: "#18181b", color: "#fff" }} />
      <Chip label={TYPE_LABELS[section.type] || section.type} size="small" sx={{ fontWeight: 600, bgcolor: "#f4f4f5", color: "#3f3f46" }} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }} noWrap>
          {section.title || section.heading || "Untitled section"}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#a1a1aa" }} noWrap>
          {summaryLine(section)}
        </Typography>
      </Box>

      <Tooltip title="Edit Section">
        <IconButton size="small" onClick={() => onEdit(section)} sx={{ color: "#18181b" }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete Section">
        <IconButton size="small" onClick={() => onDelete(section._key)} sx={{ color: "#dc2626" }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/**
 * Compact, professional section list. "Add Section" opens a blank
 * SectionEditorDialog; clicking Edit on any row reopens the same dialog
 * pre-filled. This keeps the page (which can easily have 10+ sections)
 * scannable instead of a huge wall of always-open forms.
 */
export default function SectionsBuilder({ sections, setSections }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // null = adding new

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openAdd = () => {
    setEditingSection(emptySection());
    setEditorOpen(true);
  };

  const openEdit = (section) => {
    setEditingSection(section);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingSection(null);
  };

  const handleSave = (draft) => {
    setSections((prev) => {
      const exists = prev.some((s) => s._key === draft._key);
      return exists ? prev.map((s) => (s._key === draft._key ? draft : s)) : [...prev, draft];
    });
    closeEditor();
  };

  const removeSection = (key) => {
    setSections((prev) => prev.filter((s) => s._key !== key));
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setSections((prev) => {
      const oldIndex = prev.findIndex((s) => s._key === active.id);
      const newIndex = prev.findIndex((s) => s._key === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontWeight={700}>
          Page Sections{" "}
          <Typography component="span" sx={{ color: "#a1a1aa", fontSize: 13 }}>
            ({sections.length})
          </Typography>
        </Typography>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={openAdd}
          variant="contained"
          disableElevation
          sx={{ bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
        >
          Add Section
        </Button>
      </Stack>

      {sections.length === 0 && (
        <Box sx={{ border: "1px dashed #d4d4d8", borderRadius: 2, p: 4, textAlign: "center", color: "#a1a1aa" }}>
          <Typography fontSize={14}>No sections yet. Click &quot;Add Section&quot; to start building this page.</Typography>
        </Box>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s._key)} strategy={verticalListSortingStrategy}>
          <Stack spacing={1.25}>
            {sections.map((section, index) => (
              <SortableSectionRow key={section._key} section={section} index={index} onEdit={openEdit} onDelete={removeSection} />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      <SectionEditorDialog open={editorOpen} section={editingSection} onClose={closeEditor} onSave={handleSave} />
    </Box>
  );
}
