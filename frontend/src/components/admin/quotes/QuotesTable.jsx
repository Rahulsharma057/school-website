"use client";

import { useState } from "react";

import {
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import useQuotes from "@/hooks/useQuotes";
import { deleteQuote, reorderQuotes, toggleQuoteStatus } from "@/services/quoteService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

function SortableRow({ quote, onEdit, onDelete, onToggleStatus, dragDisabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quote?._id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

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
      }}
    >
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        disabled={dragDisabled}
        sx={{
          cursor: dragDisabled ? "not-allowed" : isDragging ? "grabbing" : "grab",
          touchAction: "none",
          color: "#a1a1aa",
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <Avatar src={quote.authorImage?.url || undefined} sx={{ width: 40, height: 40, bgcolor: "#f4f4f5" }}>
        {quote.authorName?.[0]?.toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#18181b" }} noWrap>
          {quote.authorName}
          {quote.authorTitle && (
            <Typography component="span" sx={{ fontSize: 12, color: "#a1a1aa", ml: 0.75 }}>
              · {quote.authorTitle}
            </Typography>
          )}
        </Typography>
        <Typography sx={{ fontSize: 12.5, color: "#71717a" }} noWrap>
          {quote.quoteText}
        </Typography>
      </Box>

      {quote.category && (
        <Chip
          label={quote.category}
          size="small"
          sx={{ fontSize: 11, bgcolor: "#f4f4f5", color: "#52525b", display: { xs: "none", sm: "inline-flex" } }}
        />
      )}

      <Tooltip title={quote.status ? "Visible on public wall" : "Hidden from public wall"}>
        <Switch size="small" checked={quote.status} onChange={() => onToggleStatus(quote)} />
      </Tooltip>

      <Tooltip title="Edit">
        <IconButton size="small" onClick={() => onEdit(quote)} sx={{ color: "#18181b" }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title="Delete">
        <IconButton size="small" onClick={() => onDelete(quote)} sx={{ color: "#dc2626" }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function QuotesTable({ onEdit }) {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [limit, setLimit] = useState(50);
  const [deleteTarget, setDeleteTarget] = useState(null);
  // optimistic order shown immediately while a drag's reorder request
  // is in flight, so the row doesn't snap back before the server responds
  const [localOrder, setLocalOrder] = useState(null);

  const { data, isLoading, isError } = useQuotes({ search: searchInput, limit });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["quotes"] });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteQuote(id),
    onSuccess: () => {
      toast.success("Quote deleted");
      invalidate();
      setDeleteTarget(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Delete failed"),
  });

  const statusMutation = useMutation({
    mutationFn: (id) => toggleQuoteStatus(id),
    onSuccess: invalidate,
    onError: (err) => toast.error(err?.response?.data?.message || "Could not update status"),
  });

  const reorderMutation = useMutation({
    mutationFn: (order) => reorderQuotes(order),
    onSuccess: () => {
      setLocalOrder(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Could not save order");
      setLocalOrder(null);
    },
  });

  const serverQuotes = data?.data?.data || [];
  const total = data?.data?.total ?? 0;
  const quotes = localOrder || serverQuotes;

  // Reordering only makes sense against the full, unfiltered list —
  // disable drag while a search is active rather than let a drag silently
  // reorder within a filtered subset (which would scramble the real order).
  const dragDisabled = Boolean(searchInput.trim());

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const oldIndex = quotes.findIndex((q) => q?._id === active.id);
    const newIndex = quotes.findIndex((q) => q?._id === over.id);
    const next = arrayMove(quotes, oldIndex, newIndex);

    setLocalOrder(next);
    reorderMutation.mutate(next.map((q, i) => ({ id: q?._id, order: i })));
  };

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load quotes" />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" rowGap={1}>
        <TextField
          size="small"
          placeholder="Search quotes or author..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ width: { xs: "100%", sm: 300 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} />
              </InputAdornment>
            ),
          }}
        />
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>
          {quotes.length} of {total} quotes
        </Typography>
      </Stack>

      {dragDisabled && (
        <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1.5 }}>
          Clear the search box to reorder quotes by drag-and-drop.
        </Typography>
      )}

      {quotes.length === 0 ? (
        <EmptyState
          title={searchInput ? "No quotes match your search" : "No quotes yet"}
          description={searchInput ? "Try a different keyword." : "Add your first quote above."}
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={quotes.map((q) => q?._id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1.25}>
              {quotes.map((quote) => (
                <SortableRow
                  key={quote?._id}
                  quote={quote}
                  dragDisabled={dragDisabled}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                  onToggleStatus={(q) => statusMutation.mutate(q._id)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      )}

      {quotes.length < total && (
        <Stack direction="row" justifyContent="center" mt={2.5}>
          <Chip
            label={`Load more (${total - quotes.length} remaining)`}
            clickable
            onClick={() => setLimit((l) => l + 50)}
            sx={{ bgcolor: "#f4f4f5", color: "#3f3f46", fontWeight: 600 }}
          />
        </Stack>
      )}

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title="Delete Quote"
        message={`This will permanently delete the quote from ${deleteTarget?.authorName || "this author"}.`}
        loading={deleteMutation.isPending}
        confirmText="Delete"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?._id)}
      />
    </Box>
  );
}
