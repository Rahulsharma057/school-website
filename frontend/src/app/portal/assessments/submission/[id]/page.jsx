"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, TextField, Button, Chip, Stack, CircularProgress } from "@mui/material";
import { useSubmissionById, useGradeSubmission } from "@/hooks/useAssessment";

function GradeContent() {
  const { id } = useParams();
  const { data: submission, isLoading } = useSubmissionById(id);
  const { mutate: gradeSubmission, isPending } = useGradeSubmission();
  const [marks, setMarks] = useState({});

  useEffect(() => {
    if (submission) {
      const initial = {};
      submission.answers.forEach((a) => { initial[a.questionIndex] = a.marksAwarded; });
      setMarks(initial);
    }
  }, [submission]);

  if (isLoading) return <CircularProgress />;
  if (!submission) return <Typography>Not found</Typography>;

  const assessment = submission.assessment;

  const handleSave = () => {
    const grades = Object.entries(marks).map(([questionIndex, marksAwarded]) => ({
      questionIndex: Number(questionIndex),
      marksAwarded: Number(marksAwarded),
    }));
    gradeSubmission({ id, data: { grades } });
  };

  return (
    <Box>
      <Typography variant="h4" mb={1}>Grade Submission</Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>{submission.student?.name} — {assessment.title}</Typography>

      <Stack spacing={2}>
        {assessment.questions.map((q, i) => {
          const answer = submission.answers.find((a) => a.questionIndex === i);
          return (
            <Paper key={i} elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Q{i + 1}. {q.text}</Typography>

              {q.type === "MCQ" ? (
                <>
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    Student answered: {q.options[answer?.selectedOptionIndex]?.text || "—"}
                  </Typography>
                  <Chip
                    label={answer?.isCorrect ? "Correct — auto-graded" : "Incorrect — auto-graded"}
                    size="small"
                    color={answer?.isCorrect ? "success" : "error"}
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: "#f8fafc" }}>
                    <Typography variant="body2">{answer?.textAnswer || "(No answer given)"}</Typography>
                  </Paper>
                  <TextField
                    label={`Marks (out of ${q.marks})`}
                    size="small" type="number"
                    value={marks[i] ?? 0}
                    onChange={(e) => setMarks({ ...marks, [i]: e.target.value })}
                    sx={{ width: 180 }}
                  />
                </>
              )}
            </Paper>
          );
        })}
      </Stack>

      <Button variant="contained" onClick={handleSave} disabled={isPending} sx={{ mt: 3, textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
        {isPending ? "Saving..." : "Save Grades"}
      </Button>
    </Box>
  );
}

export default function GradeSubmissionPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}><GradeContent /></Box>
    </PortalGuard>
  );
}