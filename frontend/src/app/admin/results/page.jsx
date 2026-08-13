"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Select, MenuItem, TextField, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
} from "@mui/material";
import { useClasses } from "@/hooks/useClasses";
import { useExamsByClass } from "@/hooks/useExam";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useEnterResult, useClassResults } from "@/hooks/useResult";

export default function ResultsPage() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");

  const { data: exams = [] } = useExamsByClass(classId);
  const { data: students = [] } = useStudentsByClass(classId);
  const { data: results = [] } = useClassResults(examId);
  const { mutate: enterResult, isPending } = useEnterResult();

  const selectedExam = exams.find((e) => e._id === examId);
  const [marksForm, setMarksForm] = useState({}); // { studentId: { subject: marks } }

  useEffect(() => {
    setMarksForm({});
  }, [examId]);

  const handleMarkChange = (studentId, subject, value) => {
    setMarksForm({
      ...marksForm,
      [studentId]: { ...marksForm[studentId], [subject]: value },
    });
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>Enter Results</Typography>

      <Paper sx={{ p: 3, mb: 3, display: "flex", gap: 2 }}>
        <Select displayEmpty value={classId} onChange={(e) => { setClassId(e.target.value); setExamId(""); }} sx={{ minWidth: 200 }}>
          <MenuItem value="" disabled>Select Class</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
          ))}
        </Select>

        <Select displayEmpty value={examId} onChange={(e) => setExamId(e.target.value)} sx={{ minWidth: 200 }}>
          <MenuItem value="" disabled>Select Exam</MenuItem>
          {exams.map((e) => (
            <MenuItem key={e._id} value={e._id}>{e.examName}</MenuItem>
          ))}
        </Select>
      </Paper>

      {selectedExam && students.length > 0 && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                {selectedExam.subjects.map((s) => (
                  <TableCell key={s.subject}>{s.subject} (max {s.maxMarks})</TableCell>
                ))}
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((stu) => {
                const studentId = stu.user._id;
                const existingResult = results.find((r) => r.student._id === studentId);

                return (
                  <TableRow key={studentId}>
                    <TableCell>{stu.user?.name}</TableCell>
                    {selectedExam.subjects.map((s) => {
                      const existingMark = existingResult?.marks.find((m) => m.subject === s.subject);
                      return (
                        <TableCell key={s.subject}>
                          <TextField
                            size="small"
                            type="number"
                            defaultValue={existingMark?.marksObtained ?? ""}
                            onChange={(e) => handleMarkChange(studentId, s.subject, e.target.value)}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <Button size="small" variant="contained" onClick={() => handleSave(studentId)} disabled={isPending}>
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
    </Box>
  );
}