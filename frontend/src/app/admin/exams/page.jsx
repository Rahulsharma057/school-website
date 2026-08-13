"use client";

import { useState } from "react";
import {
  Box, Button, Typography, TextField, Paper, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useClasses } from "@/hooks/useClasses";
import { useCreateExam, useExamsByClass } from "@/hooks/useExam";

export default function ExamsPage() {
  const { data: classes = [] } = useClasses();
  const [classId, setClassId] = useState("");
  const { data: exams = [] } = useExamsByClass(classId);
  const { mutate: createExam, isPending } = useCreateExam();

  const [examName, setExamName] = useState("");
  const [subjects, setSubjects] = useState([{ subject: "", maxMarks: "" }]);

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const addSubjectRow = () => setSubjects([...subjects, { subject: "", maxMarks: "" }]);

  const removeSubjectRow = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!examName || !classId) return;

    const validSubjects = subjects
      .filter((s) => s.subject && s.maxMarks)
      .map((s) => ({ subject: s.subject, maxMarks: Number(s.maxMarks) }));

    if (validSubjects.length === 0) return;

    createExam(
      { examName, classId, subjects: validSubjects },
      {
        onSuccess: () => {
          setExamName("");
          setSubjects([{ subject: "", maxMarks: "" }]);
        },
      }
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>Exams</Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 600 }}>
        <Select
          fullWidth
          displayEmpty
          sx={{ mb: 2 }}
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <MenuItem value="" disabled>Select Class</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c?._id} value={c?._id}>{c.className} - {c.section}</MenuItem>
          ))}
        </Select>

        <TextField
          fullWidth
          label="Exam Name"
          sx={{ mb: 2 }}
          value={examName}
          onChange={(e) => setExamName(e.target.value)}
        />

        <Typography variant="subtitle2" mb={1}>Subjects</Typography>
        {subjects.map((s, i) => (
          <Box key={i} sx={{ display: "flex", gap: 1, mb: 1 }}>
            <TextField
              label="Subject"
              value={s.subject}
              onChange={(e) => handleSubjectChange(i, "subject", e.target.value)}
            />
            <TextField
              label="Max Marks"
              type="number"
              value={s.maxMarks}
              onChange={(e) => handleSubjectChange(i, "maxMarks", e.target.value)}
            />
            <IconButton color="error" onClick={() => removeSubjectRow(i)}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        ))}

        <Button onClick={addSubjectRow} sx={{ mb: 2 }}>+ Add Subject</Button>

        <Box>
          <Button variant="contained" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Creating..." : "Create Exam"}
          </Button>
        </Box>
      </Paper>

      {classId && (
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam Name</TableCell>
                <TableCell>Subjects</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{e.examName}</TableCell>
                  <TableCell>
                    {e.subjects.map((s) => `${s.subject} (${s.maxMarks})`).join(", ")}
                  </TableCell>
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow><TableCell colSpan={2} align="center">No exams yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}