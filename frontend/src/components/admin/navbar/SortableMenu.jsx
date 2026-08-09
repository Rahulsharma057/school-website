"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { useState } from "react";

import SortableMenuItem from "./SortableMenuItem";

export default function SortableMenu({
  menu = [],

  onChange,

  onEdit,

  onDelete,
}) {
  const [items, setItems] = useState(menu);

  const handleDragEnd = (event) => {
    const {
      active,

      over,
    } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item._id === active.id);

    const newIndex = items.findIndex((item) => item._id === over.id);

    const updated = arrayMove(items, oldIndex, newIndex);

    setItems(updated);

    onChange(updated);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map((item) => item._id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item, index) => (
     <SortableMenuItem
            key={item._id}
            item={item}
            index={index}
            onEdit={onEdit}
            onDelete={() => onDelete(index)}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
