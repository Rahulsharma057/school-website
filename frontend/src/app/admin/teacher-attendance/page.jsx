"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, TextField, Button, Table, TableHead,
  TableBody, TableRow, TableCell, RadioGroup, Radio, FormControlLabel,
  Stack, Avatar,
} from "@mui/material";
import { FactCheck } from "@mui/icons-material";
import { useAllTeachers } from "@/hooks/useTeacher";
import { useMarkTeacherAttendance } from "@/hooks/useTeacherAttendance";

export default function TeacherAttendancePage() {
  const { data: teachers = [] } = useAllTeachers();
  const { mutate: markAttendance, isPending } = useMarkTeacherAttendance();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    const map = {};
    teachers.forEach((t) => (map[t._id] = "PRESENT"));
    setStatusMap(map);
  }, [teachers]);

  const handleStatusChange = (teacherId, status) => {
    setStatusMap({ ...statusMap, [teacherId]: status });
  };

  const handleSubmit = () => {
    const records = Object.entries(statusMap).map(([teacher, status]) => ({ teacher, status }));
    markAttendance({ date, records });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#e0f2fe", color: "#0284c7", width: 44, height: 44 }}>
          <FactCheck />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Teacher Attendance
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Mark daily attendance — used for salary calculation
          </Typography>
        </Box>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <TextField
          type="date"
          size="small"
          label="Date"
          InputLabelProps={{ shrink: true }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Paper>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Teacher</TableCell>
              <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell>{t.name} <Typography component="span" variant="caption" sx={{ color: "#94a3b8" }}>({t.email})</Typography></TableCell>
                <TableCell>
              <RadioGroup
  row
  value={statusMap[t._id] || "PRESENT"}
  onChange={(e) => handleStatusChange(t._id, e.target.value)}
>
  <FormControlLabel value="PRESENT" control={<Radio size="small" />} label="Present" />
  <FormControlLabel value="ABSENT" control={<Radio size="small" />} label="Absent" />
  <FormControlLabel value="HALF_DAY" control={<Radio size="small" />} label="Half Day" />
  <FormControlLabel value="LEAVE" control={<Radio size="small" />} label="Leave" />
</RadioGroup>
                </TableCell>
              </TableRow>
            ))}
            {teachers.length === 0 && (
              <TableRow><TableCell colSpan={2} align="center" sx={{ py: 4, color: "#94a3b8" }}>No teachers found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {teachers.length > 0 && (
        <Button
          variant="contained"
          sx={{ mt: 2, textTransform: "none", fontWeight: 600, borderRadius: 2 }}
          onClick={handleSubmit}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save Attendance"}
        </Button>
      )}
    </Box>
  );
}