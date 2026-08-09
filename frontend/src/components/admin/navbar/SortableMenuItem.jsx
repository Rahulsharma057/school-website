"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  Paper,
  Stack,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";

import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function SortableMenuItem({
  item,
  index,
  onEdit,
  onDelete,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: item._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 2,
        mb: 2,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton
            {...attributes}
            {...listeners}
          >
            <DragIndicatorIcon />
          </IconButton>

          <Stack>
            <Typography fontWeight={700}>
              {item.title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              {item.url}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
        >
          <Chip
            label={
              item.visible
                ? "Active"
                : "Hidden"
            }
            color={
              item.visible
                ? "success"
                : "default"
            }
          />

          <IconButton
            color="primary"
            onClick={() =>
              onEdit(item, index)
            }
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={onDelete}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}