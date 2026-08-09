"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Card,
  Checkbox,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import LockIcon from "@mui/icons-material/Lock";

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
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useGalleryImagesInfinite } from "@/hooks/useGalleryImages";
import {
  uploadGalleryImages,
  reorderGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
  bulkDeleteGalleryImages,
} from "@/services/galleryImageService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const PAGE_SIZE = 24;

// Shared tile visuals — the sortable and static variants below both use this.
function TileBody({ image, selected, onToggleSelect, onCaptionChange, onDelete, dragHandleProps, dragging }) {
  return (
    <>
      <Box sx={{ position: "relative" }}>
        <Box
          component="img"
          src={image.url}
          alt={image.altText || image.caption || "Gallery image"}
          sx={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
          loading="lazy"
        />

        <Checkbox
          checked={selected}
          onChange={() => onToggleSelect(image._id)}
          size="small"
          sx={{
            position: "absolute", top: 4, left: 4,
            bgcolor: "rgba(255,255,255,0.85)", borderRadius: 1, p: 0.3,
            "&:hover": { bgcolor: "#fff" },
          }}
        />

        {dragHandleProps ? (
          <Tooltip title="Drag to reorder">
            <IconButton
              size="small"
              {...dragHandleProps}
              sx={{
                position: "absolute", top: 4, right: 34,
                bgcolor: "rgba(255,255,255,0.85)", cursor: dragging ? "grabbing" : "grab",
                touchAction: "none", "&:hover": { bgcolor: "#fff" },
              }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Load all photos to enable reordering">
            <Box sx={{ position: "absolute", top: 4, right: 34, bgcolor: "rgba(255,255,255,0.85)", borderRadius: 1, p: 0.5, display: "flex" }}>
              <LockIcon fontSize="small" sx={{ color: "#a1a1aa" }} />
            </Box>
          </Tooltip>
        )}

        <Tooltip title="Delete">
          <IconButton
            size="small"
            onClick={() => onDelete(image._id)}
            sx={{
              position: "absolute", top: 4, right: 4,
              bgcolor: "rgba(255,255,255,0.85)", color: "#dc2626", "&:hover": { bgcolor: "#fff" },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ p: 1 }}>
        <TextField
          fullWidth
          size="small"
          variant="standard"
          placeholder="Caption (optional)"
          defaultValue={image.caption}
          onBlur={(e) => {
            if (e.target.value !== image.caption) onCaptionChange(image._id, e.target.value);
          }}
          InputProps={{ disableUnderline: true, sx: { fontSize: 12.5 } }}
        />
      </Box>
    </>
  );
}

// Draggable variant — only rendered once every photo is loaded, inside DndContext.
function SortableImageTile(props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.image._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e4e4e7", overflow: "hidden" }}>
      <TileBody {...props} dragHandleProps={{ ...attributes, ...listeners }} dragging={isDragging} />
    </Card>
  );
}

// Static variant — used while more pages are still unloaded, so a drag
// can't silently overwrite `order` values belonging to photos not yet
// fetched into the browser.
function StaticImageTile(props) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e4e4e7", overflow: "hidden" }}>
      <TileBody {...props} dragHandleProps={null} />
    </Card>
  );
}

export default function GalleryImageManager({ gallery }) {
  const queryClient = useQueryClient();
  const galleryId = gallery?._id;

  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id } | { bulk: true }
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [localOrder, setLocalOrder] = useState(null); // optimistic order right after a drag

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGalleryImagesInfinite(galleryId, PAGE_SIZE);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["gallery-images"] });

  const uploadMutation = useMutation({
    mutationFn: (files) => uploadGalleryImages(galleryId, files),
    onSuccess: (res) => {
      toast.success(`${res.data?.data?.length || 0} photo(s) uploaded`);
      invalidate();
    },
    onError: () => toast.error("Upload failed"),
    onSettled: () => setUploading(false),
  });

  const reorderMutation = useMutation({
    mutationFn: (order) => reorderGalleryImages(galleryId, order),
    onError: () => {
      toast.error("Could not save new order");
      setLocalOrder(null);
      invalidate();
    },
  });

  const captionMutation = useMutation({
    mutationFn: ({ id, caption }) => updateGalleryImage(id, { caption }),
    onSuccess: () => toast.success("Caption saved"),
    onError: () => toast.error("Could not save caption"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteGalleryImage(id),
    onSuccess: () => {
      toast.success("Photo deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteGalleryImages(ids),
    onSuccess: () => {
      toast.success("Photos deleted");
      invalidate();
      setSelectedIds([]);
      setDeleteTarget(null);
    },
    onError: () => toast.error("Delete failed"),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const images = localOrder || data?.pages?.flatMap((p) => p.data) || [];
  const total = data?.pages?.[0]?.total ?? 0;
  const canReorder = !hasNextPage; // every photo is loaded — safe to reorder

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setUploading(true);
    uploadMutation.mutate(files);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img._id === active.id);
    const newIndex = images.findIndex((img) => img._id === over.id);
    const reordered = arrayMove(images, oldIndex, newIndex);

    setLocalOrder(reordered);
    reorderMutation.mutate(reordered.map((img, index) => ({ id: img._id, order: index })));
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (!galleryId) return <EmptyState title="Select a gallery to manage its photos" />;
  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load photos" />;

  const tileProps = (image) => ({
    image,
    selected: selectedIds.includes(image._id),
    onToggleSelect: toggleSelect,
    onCaptionChange: (id, caption) => captionMutation.mutate({ id, caption }),
    onDelete: (id) => setDeleteTarget({ id }),
  });

  return (
    <Box>
      <Box mb={2.5}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
          {gallery.title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>
          {total} photo{total === 1 ? "" : "s"}
          {canReorder ? " · drag tiles to reorder" : " · load all photos below to enable reordering"}
        </Typography>
      </Box>

      {/* Upload dropzone */}
      <Box
        component="label"
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "2px dashed",
          borderColor: dragOver ? "#18181b" : "#d4d4d8",
          borderRadius: 2,
          p: 4,
          mb: 3,
          cursor: "pointer",
          bgcolor: dragOver ? "#fafafa" : "#fff",
          transition: "all 0.15s",
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 32, color: "#a1a1aa", mb: 1 }} />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>
          Drag photos here, or click to browse
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>
          JPG, PNG, WEBP — multiple files supported
        </Typography>
        <input hidden type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
      </Box>

      {uploading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {selectedIds.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ mb: 2, p: 1.5, border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fafafa" }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{selectedIds.length} selected</Typography>
          <Button size="small" onClick={() => setDeleteTarget({ bulk: true })} sx={{ textTransform: "none", color: "#dc2626" }}>
            Delete selected
          </Button>
          <Button size="small" onClick={() => setSelectedIds([])} sx={{ textTransform: "none", color: "#71717a" }}>
            Clear selection
          </Button>
        </Stack>
      )}

      {images.length === 0 ? (
        <EmptyState title="No photos yet" description="Upload some above to get started." />
      ) : canReorder ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={images.map((img) => img._id)} strategy={rectSortingStrategy}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {images.map((image) => (
                <SortableImageTile key={image._id} {...tileProps(image)} />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2,
          }}
        >
          {images.map((image) => (
            <StaticImageTile key={image._id} {...tileProps(image)} />
          ))}
        </Box>
      )}

      {hasNextPage && (
        <Stack alignItems="center" mt={3}>
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7", px: 3 }}
          >
            {isFetchingNextPage ? "Loading..." : "Load more photos"}
          </Button>
        </Stack>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Photo"
        message={
          deleteTarget?.bulk
            ? `This will permanently delete ${selectedIds.length} photo(s).`
            : "This will permanently delete this photo."
        }
        loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget?.bulk
            ? bulkDeleteMutation.mutate(selectedIds)
            : deleteMutation.mutate(deleteTarget.id)
        }
      />
    </Box>
  );
}
