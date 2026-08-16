"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Select, MenuItem, Stack,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, IconButton,
  Switch, Autocomplete, useTheme,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useClasses } from "@/hooks/useClasses";
import {
  useAllGroups, useCreateGroup, useDeleteGroup, useToggleMediaUpload, useMemberOptions,
} from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";

const typeLabel = { CLASS: "Class", TEACHERS: "Teachers", SCHOOL: "School", CUSTOM: "Custom" };

export default function ManageGroupsTab() {
  const { user } = useAuth();
  const { data: classes = [] } = useClasses();
  const { data: groups = [] } = useAllGroups();
  const { data: memberOptions = [] } = useMemberOptions();

  const { mutate: createGroup, isPending: creating } = useCreateGroup();
  const { mutate: deleteGroup } = useDeleteGroup();
  const { mutate: toggleMedia } = useToggleMediaUpload();

  const [form, setForm] = useState({ name: "", type: "CLASS", classId: "", memberIds: [] });

  const handleCreate = () => {
    if (!form.name) return;
    const payload = { name: form.name, type: form.type };
    if (form.type === "CLASS") payload.classId = form.classId;
    if (form.type === "CUSTOM") payload.memberIds = form.memberIds.map((m) => m._id);

    createGroup(payload, {
      onSuccess: () => setForm({ name: "", type: "CLASS", classId: "", memberIds: [] }),
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3, maxWidth: 600 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Create New Group</Typography>
        <Stack spacing={2}>
          <TextField label="Group Name" size="small" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <Select size="small" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <MenuItem value="CLASS">Class Group (auto — students + teachers of a class)</MenuItem>
            <MenuItem value="TEACHERS">All Teachers Group</MenuItem>
            <MenuItem value="SCHOOL">Whole School Group</MenuItem>
            <MenuItem value="CUSTOM">Custom Group (pick specific people)</MenuItem>
          </Select>

          {form.type === "CLASS" && (
            <Select size="small" displayEmpty value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
              <MenuItem value="" disabled>Select Class</MenuItem>
              {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>)}
            </Select>
          )}

          {form.type === "CUSTOM" && (
     <Autocomplete
  multiple
  size="small"
  options={memberOptions}
  getOptionLabel={(o) => `${o.name} (${o.role})`}
  getOptionKey={(o) => o._id}                              // ← ye add karo (unique key)
  isOptionEqualToValue={(option, value) => option._id === value._id}  // ← ye bhi add karo
  value={form.memberIds}
  onChange={(e, val) => setForm({ ...form, memberIds: val })}
  renderInput={(params) => <TextField {...params} label="Select Members" />}
/>
          )}

          <Button variant="contained" onClick={handleCreate} disabled={creating} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {creating ? "Creating..." : "Create Group"}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Media Allowed</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g) => (
              <TableRow key={g._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>
                  {g.name}
                  {g.class && <Typography variant="caption" sx={{ display: "block", color: "#94a3b8" }}>{g.class.className}-{g.class.section}</Typography>}
                </TableCell>
                <TableCell><Chip label={typeLabel[g.type]} size="small" /></TableCell>
                <TableCell>
                  {user?.role === "SUPER_ADMIN" ? (
                    <Switch checked={g.allowMediaUpload} onChange={(e) => toggleMedia({ id: g._id, allowMediaUpload: e.target.checked })} />
                  ) : (
                    <Chip label={g.allowMediaUpload ? "Yes" : "No"} size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => { if (confirm(`Delete "${g.name}"? All messages will be lost.`)) deleteGroup(g._id); }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {groups.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "#94a3b8" }}>No groups created yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}   