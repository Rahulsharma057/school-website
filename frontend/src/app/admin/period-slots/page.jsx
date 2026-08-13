"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Table, TableHead, TableBody,
  TableRow, TableCell, IconButton, Stack, Avatar, Switch, FormControlLabel,
} from "@mui/material";
import { Delete, ScheduleOutlined } from "@mui/icons-material";
import AdminGuard from "@/components/admin/AdminGuard";
import {
  usePeriodSlots, useCreatePeriodSlot, useDeletePeriodSlot,
} from "@/hooks/usePeriodSlot";

function PeriodSlotsContent() {
  const { data: slots = [] } = usePeriodSlots();
  const { mutate: createSlot, isPending } = useCreatePeriodSlot();
  const { mutate: deleteSlot } = useDeletePeriodSlot();

  const [form, setForm] = useState({
    periodNumber: "", label: "", startTime: "", endTime: "", isBreak: false,
  });

  const handleCreate = () => {
    if (!form.periodNumber || !form.startTime || !form.endTime) return;
    createSlot(
      { ...form, periodNumber: Number(form.periodNumber) },
      { onSuccess: () => setForm({ periodNumber: "", label: "", startTime: "", endTime: "", isBreak: false }) }
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#ede9fe", color: "#7c3aed", width: 44, height: 44 }}>
          <ScheduleOutlined />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Period Slots</Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Define how many periods your school has and their timing — used across all class timetables
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 2 }}>Add Period</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} flexWrap="wrap" rowGap={2}>
          <TextField label="Period No." size="small" type="number" value={form.periodNumber} onChange={(e) => setForm({ ...form, periodNumber: e.target.value })} sx={{ width: 120 }} />
          <TextField label="Label (optional)" size="small" placeholder="e.g. Lunch Break" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} sx={{ width: 180 }} />
          <TextField label="Start Time" size="small" type="time" InputLabelProps={{ shrink: true }} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <TextField label="End Time" size="small" type="time" InputLabelProps={{ shrink: true }} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <FormControlLabel
            control={<Switch checked={form.isBreak} onChange={(e) => setForm({ ...form, isBreak: e.target.checked })} />}
            label="Break/Recess"
          />
          <Button variant="contained" onClick={handleCreate} disabled={isPending} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {isPending ? "Adding..." : "Add Period"}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Label</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Time</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slots.map((s) => (
              <TableRow key={s._id} hover>
                <TableCell>Period {s.periodNumber}</TableCell>
                <TableCell>{s.label || "—"}</TableCell>
                <TableCell>{s.startTime} - {s.endTime}</TableCell>
                <TableCell>{s.isBreak ? "Break" : "Class"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => deleteSlot(s._id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {slots.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>No periods defined yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default function PeriodSlotsPage() {
  return (
    <AdminGuard>
      <PeriodSlotsContent />
    </AdminGuard>
  );
}