"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, RadioGroup, Radio, FormControlLabel, TextField, Button, Stack, CircularProgress } from "@mui/material";
import { useAssessmentById, useSubmitAssessment } from "@/hooks/useAssessment";

function TakeContent() {
  const { id } = useParams();
  const router = useRouter();
  const { data: assessment, isLoading } = useAssessmentById(id);
  const { mutate: submit, isPending } = useSubmitAssessment();

  const [answers, setAnswers] = useState({});

  if (isLoading) return <CircularProgress />;
  if (!assessment) return <Typography>Not found</Typography>;

  const handleSubmit = () => {
    if (!confirm("Submit this assessment? You cannot change answers after submitting.")) return;

    const payload = assessment.questions.map((q, i) => ({
      questionIndex: i,
      selectedOptionIndex: q.type === "MCQ" ? answers[i] ?? null : null,
      textAnswer: q.type !== "MCQ" ? answers[i] || "" : "",
    }));

    submit(
      { id, data: { answers: payload } },
      { onSuccess: () => router.push(`/portal/my-assessments/${id}/result`) }
    );
  };

  return (
    <Box>
      <Typography variant="h4" mb={1}>{assessment.title}</Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>{assessment.subject} — {assessment.totalMarks} marks — {assessment.durationMinutes} min</Typography>

      <Stack spacing={2}>
        {assessment.questions.map((q, i) => (
          <Paper key={i} elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 700, mb: 2 }}>Q{i + 1}. {q.text} <Typography component="span" variant="caption" sx={{ color: "#94a3b8" }}>({q.marks} marks)</Typography></Typography>

            {q.type === "MCQ" ? (
              <RadioGroup value={answers[i] ?? ""} onChange={(e) => setAnswers({ ...answers, [i]: Number(e.target.value) })}>
                {q.options.map((opt, oi) => (
                  <FormControlLabel key={oi} value={oi} control={<Radio size="small" />} label={opt.text} />
                ))}
              </RadioGroup>
            ) : (
              <TextField
                fullWidth multiline rows={q.type === "LONG_ANSWER" ? 5 : 2} size="small"
                placeholder="Type your answer..."
                value={answers[i] || ""} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })}
              />
            )}
          </Paper>
        ))}
      </Stack>

      <Button variant="contained" onClick={handleSubmit} disabled={isPending} sx={{ mt: 3, textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
        {isPending ? "Submitting..." : "Submit Assessment"}
      </Button>
    </Box>
  );
}

export default function TakeAssessmentPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ p: 3 }}><TakeContent /></Box>
    </PortalGuard>
  );
}