"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, Select, MenuItem, Table, TableHead, TableBody,
  TableRow, TableCell, Button, Stack, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Chip, IconButton, Alert,
  FormControlLabel, Checkbox,
} from "@mui/material";
import { CalendarMonthOutlined, Delete, Warning } from "@mui/icons-material";
import AdminGuard from "@/components/admin/AdminGuard";
import { useClasses } from "@/hooks/useClasses";
import { useAllTeachers } from "@/hooks/useTeacher";
import { usePeriodSlots } from "@/hooks/usePeriodSlot";
import {
  useClassTimetable, useCreateTimetableEntry, useDeleteTimetableEntry,
} from "@/hooks/useTimetable";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function TimetableContent() {
  const { data: classes = [] } = useClasses();
  const { data: teachers = [] } = useAllTeachers();
  const { data: periods = [] } = usePeriodSlots();

  const [classId, setClassId] = useState("");
  const { data: entries = [] } = useClassTimetable(classId);
  const { mutate: createEntry, isPending: creating } = useCreateTimetableEntry();
  const { mutate: deleteEntry } = useDeleteTimetableEntry();

  // dialog state
  const [cellDialog, setCellDialog] = useState(null); // { day, periodId }
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [allowOverride, setAllowOverride] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);

  const teachingPeriods = periods.filter((p) => !p.isBreak);

  const findEntry = (day, periodId) =>
    entries.find((e) => e.day === day && (e.period?._id || e.period) === periodId);

  const openCell = (day, periodId) => {
    setCellDialog({ day, periodId });
    setSubject("");
    setTeacherId("");
    setAllowOverride(false);
    setConflictInfo(null);
  };

  const handleSubmit = () => {
    if (!cellDialog || !subject || !teacherId) return;

    createEntry(
      {
        classId,
        day: cellDialog.day,
        periodId: cellDialog.periodId,
        subject,
        teacherId,
        allowOverride,
      },
      {
        onSuccess: () => {
          setCellDialog(null);
          setConflictInfo(null);
        },
        onError: (err) => {
          const res = err.response?.data;
          if (err.response?.status === 409 && res?.data?.conflictType === "TEACHER_DOUBLE_BOOKED") {
            setConflictInfo(res.data.conflictWith);
          } else {
            // class-level conflict ya koi aur error
            setConflictInfo({ generic: res?.message || "Something went wrong" });
          }
        },
      }
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#fef3c7", color: "#d97706", width: 44, height: 44 }}>
          <CalendarMonthOutlined />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>Class Timetable</Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>Assign subjects and teachers to each period, day-wise</Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Select size="small" displayEmpty value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ minWidth: 250 }}>
          <MenuItem value="" disabled>Select Class</MenuItem>
          {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>)}
        </Select>
      </Paper>

      {classId && teachingPeriods.length > 0 && (
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "auto" }}>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Period</TableCell>
                {DAYS.map((d) => (
                  <TableCell key={d} sx={{ fontWeight: 700, color: "#475569" }}>{DAY_LABELS[d]}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {teachingPeriods.map((p) => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    P{p.periodNumber}
                    <Typography variant="caption" sx={{ display: "block", color: "#94a3b8" }}>{p.startTime}-{p.endTime}</Typography>
                  </TableCell>
                  {DAYS.map((day) => {
                    const entry = findEntry(day, p._id);
                    return (
                      <TableCell key={day} sx={{ minWidth: 140 }}>
                        {entry ? (
                          <Box sx={{ position: "relative" }}>
                            <Chip
                              label={`${entry.subject} — ${entry.teacher?.name}`}
                              size="small"
                              color={entry.hasConflict ? "warning" : "primary"}
                              variant={entry.hasConflict ? "filled" : "outlined"}
                              icon={entry.hasConflict ? <Warning fontSize="small" /> : undefined}
                              onDelete={() => deleteEntry(entry._id)}
                              deleteIcon={<Delete fontSize="small" />}
                              sx={{ maxWidth: "100%" }}
                            />
                          </Box>
                        ) : (
                          <Button size="small" onClick={() => openCell(day, p._id)} sx={{ textTransform: "none", color: "#94a3b8" }}>
                            + Add
                          </Button>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {classId && teachingPeriods.length === 0 && (
        <Typography sx={{ color: "#94a3b8" }}>No period slots defined yet — set them up first in Period Slots.</Typography>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={!!cellDialog} onClose={() => setCellDialog(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 380 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Period — {cellDialog && DAY_LABELS[cellDialog.day]}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField label="Subject" size="small" value={subject} onChange={(e) => setSubject(e.target.value)} />

          <Select size="small" displayEmpty value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <MenuItem value="" disabled>Select Teacher</MenuItem>
            {teachers.map((t) => <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>)}
          </Select>

          {conflictInfo && (
            <Alert severity="warning">
              {conflictInfo.generic ? (
                conflictInfo.generic
              ) : (
                <>
                  Teacher already assigned to <b>{conflictInfo.class}</b> ({conflictInfo.subject}) at this time.
                  <FormControlLabel
                    sx={{ display: "block", mt: 1 }}
                    control={<Checkbox checked={allowOverride} onChange={(e) => setAllowOverride(e.target.checked)} />}
                    label="Allow anyway (double-book this teacher)"
                  />
                </>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setCellDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={creating} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {creating ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function TimetablePage() {
  return (
    <AdminGuard>
      <TimetableContent />
    </AdminGuard>
  );
}