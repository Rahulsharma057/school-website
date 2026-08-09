"use client";

import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Box,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import MenuDialog from "./MenuDialog";
import DeleteMenuDialog from "./DeleteMenuDialog";
import SortableMenu from "./SortableMenu";

import useMenuOrder from "@/hooks/navbar/useMenuOrder";

export default function MenuBuilder({ navbar }) {
  const [open, setOpen] = useState(false);

  const [editData, setEditData] = useState(null);

  const [deleteIndex, setDeleteIndex] = useState(null);

  const [menu, setMenu] = useState(navbar?.menu || []);

  const { mutate: updateOrder } = useMenuOrder();

  useEffect(() => {
    setMenu(navbar?.menu || []);
  }, [navbar]);

  const handleOrderChange = (newMenu) => {
    setMenu(newMenu);

    updateOrder(newMenu);
  };

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Menu Builder
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Drag & Drop to reorder menus
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditData(null);
              setOpen(true);
            }}
          >
            Add Menu
          </Button>
        </Stack>

        {menu.length > 0 ? (
          <SortableMenu
            menu={menu}
            onChange={handleOrderChange}
            onEdit={(item, index) => {
              setEditData({
                ...item,
                index,
              });

              setOpen(true);
            }}
            onDelete={(index) => {
              setDeleteIndex(index);
            }}
          />
        ) : (
          <Box
            sx={{
              textAlign: "center",
              py: 5,
              border: "1px dashed #ccc",
              borderRadius: 2,
            }}
          >
            <Typography color="text.secondary" mb={2}>
              No Menu Added
            </Typography>

            <Typography variant="body2">
              Click Add Menu button to create navigation items
            </Typography>
          </Box>
        )}

        <MenuDialog
          open={open}
          setOpen={setOpen}
          editData={editData}
        />

        <DeleteMenuDialog
          open={deleteIndex !== null}
          index={deleteIndex}
          onClose={() => setDeleteIndex(null)}
        />
      </CardContent>
    </Card>
  );
}