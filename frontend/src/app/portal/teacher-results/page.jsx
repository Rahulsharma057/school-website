"use client";

import { useState, useEffect, useMemo } from "react";
import PortalGuard from "@/components/PortalGuard";
import {
  Box, Typography, Paper, Select, MenuItem, TextField, Button,
  Table, TableHead, TableBody, TableRow, TableCell, Stack, Chip,
} from "@mui/material";
import { useMyAssignments } from "@/hooks/useTeacherAssignments";
import { useExamsByClass } from "@/hooks/useExam";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useEnterResult, useClassResults } from "@/hooks/useResult";

function ResultsEntryContent() {
  const { data: assignments = [] } = useMyAssignments();

  // teacher ki unique classes (ek teacher multiple subject/class assignments rakh sakta hai)
  const myClasses = useMemo(() => {
    const map = new Map();
    assignments.forEach((a) => {
      if (a.class?._id) map.set(a.class._id, a.class);
    });
    return [...map.values()];
  }, [assignments]);

  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const { data: exams = [] } = useExamsByClass(classId);
  const { data: students = [] } = useStudentsByClass(classId);
  const { data: results = [] } = useClassResults(examId);
  const { mutate: enterResult, isPending } = useEnterResult();

  const selectedExam = exams.find((e) => e._id === examId);
  const [marksForm, setMarksForm] = useState({});

  useEffect(() => setMarksForm({}), [examId]);

  const handleMarkChange = (studentId, subject, value) => {
    setMarksForm({ ...marksForm, [studentId]: { ...marksForm[studentId], [subject]: value } });
  };

  const handleSave = (studentId) => {
    if (!selectedExam) return;
    const marks = selectedExam.subjects.map((s) => ({
      subject: s.subject,
      marksObtained: Number(marksForm[studentId]?.[s.subject] || 0),
    }));
    enterResult({ examId, studentId, marks });
  };

  return (
    <Box>
      <Typography variant="h4" mb={1}>Enter Results</Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
        Enter marks for your assigned classes
      </Typography>

      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Select
          displayEmpty size="small" value={classId}
          onChange={(e) => { setClassId(e.target.value); setExamId(""); }}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="" disabled>Select Class</MenuItem>
          {myClasses.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
          ))}
        </Select>

        <Select displayEmpty size="small" value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ minWidth: 200 }} disabled={!classId}>
          <MenuItem value="" disabled>Select Exam</MenuItem>
          {exams.map((e) => (
            <MenuItem key={e._id} value={e._id}>{e.examName}</MenuItem>
          ))}
        </Select>
      </Paper>

      {myClasses.length === 0 && (
        <Typography sx={{ color: "#94a3b8" }}>You are not assigned to any class yet.</Typography>
      )}

      {selectedExam && students.length > 0 && (
        <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "auto" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                {selectedExam.subjects.map((s) => (
                  <TableCell key={s.subject} sx={{ fontWeight: 700 }}>{s.subject} (max {s.maxMarks})</TableCell>
                ))}
                <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((stu) => {
                const studentId = stu.user._id;
                const existingResult = results.find((r) => r.student._id === studentId);

                return (
                  <TableRow key={studentId} hover>
                    <TableCell>{stu.user?.name}</TableCell>
                    {selectedExam.subjects.map((s) => {
                      const existingMark = existingResult?.marks.find((m) => m.subject === s.subject);
                      return (
                        <TableCell key={s.subject}>
                          <TextField
                            size="small" type="number"
                            defaultValue={existingMark?.marksObtained ?? ""}
                            onChange={(e) => handleMarkChange(studentId, s.subject, e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell align="right">
                      <Button size="small" variant="contained" onClick={() => handleSave(studentId)} disabled={isPending} sx={{ textTransform: "none" }}>
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {selectedExam && results.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Class Result Summary</Typography>
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>{r.student?.name}</TableCell>
                    <TableCell>{r.totalObtained}/{r.totalMax}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${r.percentage}%`}
                        size="small"
                        color={r.percentage >= 40 ? "success" : "error"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Box>
      )}
    </Box>
  );
}

export default function TeacherResultsPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}>
        <ResultsEntryContent />
      </Box>
    </PortalGuard>
  );
}