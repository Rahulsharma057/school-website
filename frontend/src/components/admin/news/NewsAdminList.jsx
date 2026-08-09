"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

import { useAdminNewsList } from "@/hooks/useNewsAdmin";
import useNewsAdminActions from "@/hooks/useNewsAdmin";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const STATUS_STYLES = {
  draft: { bg: "#f4f4f5", color: "#71717a", label: "Draft" },
  published: { bg: "#dcfce7", color: "#15803d", label: "Published" },
  archived: { bg: "#fee2e2", color: "#b91c1c", label: "Archived" },
};

// One draggable row. useSortable gives us the transform/listeners; the
// drag *handle* is only the grip icon (not the whole row) so clicking
// Edit/Delete/status doesn't accidentally start a drag.
function SortableRow({ item, onEdit, onDelete, onStatusChange }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const statusStyle = STATUS_STYLES[item.status] || STATUS_STYLES.draft;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        bgcolor: "#fff",
        border: "1px solid #e4e4e7",
        borderRadius: 2,
        mb: 1,
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{ cursor: "grab", color: "#a1a1aa", display: "flex", "&:active": { cursor: "grabbing" } }}
      >
        <DragIndicatorIcon />
      </Box>

      {item.coverImage?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverImage.url}
          alt=""
          style={{ width: 56, height: 40, objectFit: "cover", borderRadius: 6 }}
        />
      )}

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }} noWrap>
          {item.title}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>/{item.slug}</Typography>
      </Box>

      <TextField
        select
        size="small"
        value={item.status}
        onChange={(e) => onStatusChange(item._id, e.target.value)}
        sx={{ width: 130 }}
      >
        {Object.entries(STATUS_STYLES).map(([value, s]) => (
          <MenuItem key={value} value={value}>
            {s.label}
          </MenuItem>
        ))}
      </TextField>

      <Chip
        label={STATUS_STYLES[item.status]?.label}
        size="small"
        sx={{ bgcolor: statusStyle.bg, color: statusStyle.color, fontWeight: 600, fontSize: 11 }}
      />

      <IconButton size="small" onClick={() => onEdit(item)}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={() => onDelete(item)}>
        <DeleteIcon fontSize="small" sx={{ color: "#dc2626" }} />
      </IconButton>
    </Box>
  );
}

/**
 * Admin news list — drag rows by the grip handle to reorder (persisted
 * via the reorder API), or edit/delete/change status inline.
 *
 * `onCreateNew` / `onEdit` are passed in by the parent page, which owns
 * navigation to the create/edit form (kept out of this component so it
 * doesn't need to know whether that's a route, a dialog, a drawer, etc.).
 */
export default function NewsAdminList({ onCreateNew, onEdit }) {
  const { data, isLoading, isError } = useAdminNewsList({ limit: 100 });
  const { deleteMutation, reorderMutation, statusMutation } = useNewsAdminActions();

  const [items, setItems] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Sync local (draggable) order whenever fresh server data lands —
  // but not while a drag/reorder is actively pending, so we don't yank
  // the list out from under an in-flight optimistic reorder.
  useEffect(() => {
    if (data?.data?.data && !reorderMutation.isPending) {
      setItems(data.data.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i._id === active.id);
    const newIndex = items.findIndex((i) => i._id === over.id);

    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered); // optimistic UI update

    // Only send the items whose order actually changed, with their new
    // absolute order value (index in the reordered array).
    const payload = reordered.map((item, index) => ({ id: item._id, order: index }));
    reorderMutation.mutate(payload);
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Couldn't load news" description="Please try again." />;

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
          News
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="contained"
          disableElevation
          onClick={onCreateNew}
          sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
        >
          New Article
        </Button>
      </Stack>

      {items.length === 0 ? (
        <EmptyState title="No news yet" description="Create your first article to get started." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableRow
                key={item._id}
                item={item}
                onEdit={onEdit}
                onDelete={setDeleteTarget}
                onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Article"
        message={`"${deleteTarget?.title}" will be permanently deleted, including its images. This cannot be undone.`}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteMutation.mutate(deleteTarget._id, { onSuccess: () => setDeleteTarget(null) })
        }
      />
    </Box>
  );
}
