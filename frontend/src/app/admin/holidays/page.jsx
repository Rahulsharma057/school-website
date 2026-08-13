"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton,
  Chip, Stack, Avatar,
} from "@mui/material";
import { Delete, EventAvailable } from "@mui/icons-material";
import { useHolidaysByYear, useAddHoliday, useDeleteHoliday } from "@/hooks/useHoliday";

const currentYear = new Date().getFullYear();

export default function HolidaysPage() {
  const [year, setYear] = useState(currentYear);
  const { data: holidays = [], isLoading } = useHolidaysByYear(year);
  const { mutate: addHoliday, isPending } = useAddHoliday();
  const { mutate: deleteHoliday } = useDeleteHoliday();

  const [form, setForm] = useState({ title: "", date: "", type: "SCHOOL" });

  const handleAdd = () => {
    if (!form.title || !form.date) return;
    addHoliday(form, { onSuccess: () => setForm({ title: "", date: "", type: "SCHOOL" }) });
  };

  const handleDelete = (id) => {
    if (confirm("Delete this holiday?")) deleteHoliday(id);
  };

  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#fef3c7", color: "#d97706", width: 44, height: 44 }}>
          <EventAvailable />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Holiday Calendar
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage yearly holidays — used automatically in salary calculation
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 2 }}>
          Add Holiday
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          <TextField
            label="Title"
            size="small"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            sx={{ minWidth: 200 }}
          />
          <TextField
            type="date"
            size="small"
            label="Date"
            InputLabelProps={{ shrink: true }}
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
          <Select
            size="small"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="NATIONAL">National</MenuItem>
            <MenuItem value="SCHOOL">School</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
          <Button variant="contained" onClick={handleAdd} disabled={isPending} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {isPending ? "Adding..." : "Add Holiday"}
          </Button>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #e2e8f0", borderRadius: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#475569" }}>Year:</Typography>
        <Select size="small" value={year} onChange={(e) => setYear(e.target.value)}>
          {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </Select>
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {holidays.map((h) => (
              <TableRow key={h._id} hover>
                <TableCell>{h.title}</TableCell>
                <TableCell>{new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                <TableCell>
                  <Chip
                    label={h.type}
                    size="small"
                    color={h.type === "NATIONAL" ? "primary" : "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="error" onClick={() => handleDelete(h._id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && holidays.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "#94a3b8" }}>No holidays added for {year}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}