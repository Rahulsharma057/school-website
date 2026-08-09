"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
} from "@mui/material";

import { useState, useEffect } from "react";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import useAddMenu from "@/hooks/navbar/useAddMenu";
import useUpdateMenu from "@/hooks/navbar/useUpdateMenu";

const roles = [
  "SUPER_ADMIN",
  "ADMIN",
  "PRINCIPAL",
  "TEACHER",
  "ACCOUNTANT",
  "STUDENT",
  "PARENT",
];

export default function MenuDialog({
  open,

  setOpen,

  editData,
}) {
  const [form, setForm] = useState({
    title: "",

    url: "/",

    icon: "",

    target: "_self",

    order: 0,

    visible: true,

    isMegaMenu: false,

    roles: [],

    children: [],
  });

  const { mutate: addMenu } = useAddMenu();

  const { mutate: updateMenu } = useUpdateMenu();

  useEffect(() => {
    if (editData) {
      setForm({
        title: editData.title || "",

        url: editData.url || "",

        icon: editData.icon || "",

        target: editData.target || "_self",

        order: editData.order || 0,

        visible: editData.visible ?? true,

        isMegaMenu: editData.isMegaMenu ?? false,

        roles: editData.roles || [],

        children:
          editData.children?.map((child) => ({
            title: child.title || "",

            url: child.url || "",

            icon: child.icon || "",

            target: child.target || "_self",

            order: child.order || 0,

            visible: child.visible ?? true,

            roles: child.roles || [],
          })) || [],
      });
    } else {
      setForm({
        title: "",

        url: "/",

        icon: "",

        target: "_self",

        order: 0,

        visible: true,

        isMegaMenu: false,

        roles: [],

        children: [],
      });
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;

    setForm({
      ...form,

      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Parent Roles

  const handleRoles = (e) => {
    setForm({
      ...form,

      roles: e.target.value,
    });
  };

  // Add Child

  const addChild = () => {
    setForm({
      ...form,

      children: [
        ...form.children,

        {
          title: "",

          url: "/",

          icon: "",

          target: "_self",

          order: 0,

          visible: true,

          roles: [],
        },
      ],
    });
  };

  // Child Update

  const updateChild = (index, key, value) => {
    const children = [...form.children];

    children[index][key] = value;

    setForm({
      ...form,

      children,
    });
  };

  // Delete Child

  const deleteChild = (index) => {
    const children = form.children.filter((_, i) => i !== index);

    setForm({
      ...form,

      children,
    });
  };

  const submit = () => {
 console.log("EDIT DATA =>", editData);

  console.log("FINAL FORM =>", form);

  if (!form.title) {
    alert("Menu title required");
    return;
  }

    if (editData) {
      updateMenu(
        {
          index: editData.index,
          data: form,
        },
        {
          onSuccess: () => {
            console.log("UPDATE SUCCESS");
            setOpen(false);
          },

          onError: (error) => {
            console.log("UPDATE ERROR", error);
          },
        },
      );
    } else {
      addMenu(form, {
        onSuccess: () => {
          console.log("ADD SUCCESS");
          setOpen(false);
        },

        onError: (error) => {
          console.log("ADD ERROR", error);
        },
      });
    }
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle>{editData ? "Edit Menu" : "Add Menu"}</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Menu Title"
          name="title"
          value={form.title}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="URL"
          name="url"
          value={form.url}
          onChange={handleChange}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Icon"
          name="icon"
          value={form.icon}
          onChange={handleChange}
        />

        <TextField
          select
          fullWidth
          margin="normal"
          label="Target"
          name="target"
          value={form.target}
          onChange={handleChange}
        >
          <MenuItem value="_self">Same Tab</MenuItem>

          <MenuItem value="_blank">New Tab</MenuItem>
        </TextField>

        <TextField
          fullWidth
          type="number"
          margin="normal"
          label="Order"
          name="order"
          value={form.order}
          onChange={handleChange}
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.visible}
              name="visible"
              onChange={handleChange}
            />
          }
          label="Visible"
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.isMegaMenu}
              name="isMegaMenu"
              onChange={handleChange}
            />
          }
          label="Mega Menu"
        />

        <TextField
          select
          SelectProps={{
            multiple: true,
          }}
          fullWidth
          margin="normal"
          label="Roles"
          value={form.roles}
          onChange={handleRoles}
        >
          {roles.map((role) => (
            <MenuItem key={role} value={role}>
              {role}
            </MenuItem>
          ))}
        </TextField>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>Child Menus</Typography>

          <Button startIcon={<AddIcon />} onClick={addChild}>
            Add Child
          </Button>
        </Box>

        {form.children.map((child, index) => (
          <Box
            key={index}
            sx={{
              border: "1px solid #ddd",

              borderRadius: 2,

              p: 2,

              mt: 2,
            }}
          >
            <Box display="flex" justifyContent="space-between">
              <Typography>Child {index + 1}</Typography>

              <IconButton color="error" onClick={() => deleteChild(index)}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              margin="normal"
              label="Child Title"
              value={child.title}
              onChange={(e) =>
                updateChild(
                  index,

                  "title",

                  e.target.value,
                )
              }
            />

            <TextField
              fullWidth
              margin="normal"
              label="Child URL"
              value={child.url}
              onChange={(e) =>
                updateChild(
                  index,

                  "url",

                  e.target.value,
                )
              }
            />

            <TextField
              fullWidth
              margin="normal"
              label="Child Icon"
              value={child.icon}
              onChange={(e) =>
                updateChild(
                  index,

                  "icon",

                  e.target.value,
                )
              }
            />

            <TextField
              select
              fullWidth
              margin="normal"
              label="Child Target"
              value={child.target}
              onChange={(e) =>
                updateChild(
                  index,

                  "target",

                  e.target.value,
                )
              }
            >
              <MenuItem value="_self">Same Tab</MenuItem>

              <MenuItem value="_blank">New Tab</MenuItem>
            </TextField>

            <TextField
              fullWidth
              type="number"
              margin="normal"
              label="Child Order"
              value={child.order}
              onChange={(e) =>
                updateChild(
                  index,

                  "order",

                  Number(e.target.value),
                )
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={child.visible}
                  onChange={(e) =>
                    updateChild(
                      index,

                      "visible",

                      e.target.checked,
                    )
                  }
                />
              }
              label="Child Visible"
            />

            <TextField
              select
              SelectProps={{
                multiple: true,
              }}
              fullWidth
              margin="normal"
              label="Child Roles"
              value={child.roles || []}
              onChange={(e) => updateChild(index, "roles", e.target.value)}
            >
              {roles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        ))}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>

        <Button variant="contained" onClick={submit}>
          Save Menu
        </Button>
      </DialogActions>
    </Dialog>
  );
}
