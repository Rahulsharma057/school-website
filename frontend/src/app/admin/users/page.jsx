"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Typography,
  MenuItem,
  Select,
  Switch,
  TextField,
  Paper,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";

import useUsers from "@/hooks/useUsers";

import {
  changeUserRole,
  changeUserStatus,
  deleteUser,
} from "@/services/userManagementService";

import { toast } from "react-toastify";

export default function UsersPage() {
  const [search, setSearch] = useState("");

  const { data: users = [], refetch } = useUsers({
    search,
  });

  // CHANGE ROLE

  const handleRoleChange = async (id, role) => {
    try {
      await changeUserRole(id, role);

      toast.success("Role updated");

      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Role update failed");
    }
  };

  // STATUS

  const handleStatus = async (id, status) => {
    try {
      await changeUserStatus(id, status);

      toast.success("Status updated");

      refetch();
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  // DELETE

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);

      toast.success("User deleted");

      refetch();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
    },

    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },

    {
      field: "role",
      headerName: "Role",
      flex: 1,

      renderCell: (params) => (
        <Select
          size="small"
          value={params.row.role}
          disabled={params.row.role === "SUPER_ADMIN"}
          onChange={(e) => handleRoleChange(params.row._id, e.target.value)}
        >
          <MenuItem value="ADMIN">Admin</MenuItem>

          <MenuItem value="PRINCIPAL">Principal</MenuItem>

          <MenuItem value="TEACHER">Teacher</MenuItem>

          <MenuItem value="ACCOUNTANT">Accountant</MenuItem>

          <MenuItem value="STUDENT">Student</MenuItem>

          <MenuItem value="PARENT">Parent</MenuItem>
        </Select>
      ),
    },

    {
      field: "isActive",
      headerName: "Status",
      flex: 1,

      renderCell: (params) => (
        <Switch
          checked={params.row.isActive}
          disabled={params.row.role === "SUPER_ADMIN"}
          onChange={(e) =>
            handleStatus(
              params.row._id,

              e.target.checked,
            )
          }
        />
      ),
    },

    {
      field: "action",
      headerName: "Action",
      flex: 1,

      renderCell: (params) => (
        <Button
          color="error"
          variant="contained"
          disabled={params.row.role === "SUPER_ADMIN"}
          onClick={() => handleDelete(params.row._id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
      }}
    >
      <Typography variant="h4" mb={3}>
        User Management
      </Typography>

      <TextField
        label="Search User"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{
          mb: 3,
        }}
      />

      <Paper
        sx={{
          height: 600,
        }}
      >
        <DataGrid
          rows={users}
          columns={columns}
          getRowId={(row) => row._id}
          pageSizeOptions={[10, 25, 50]}
        />
      </Paper>
    </Box>
  );
}
