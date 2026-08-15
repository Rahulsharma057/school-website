"use client";

import { useParams } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Chip, CircularProgress } from "@mui/material";
import { useMySubmission } from "@/hooks/useAssessment";

function ResultContent() {
  const { id } = useParams();
  const { data: submission, isLoading, isError } = useMySubmission(id);

  if (isLoading) return <CircularProgress />;
  if (isError || !submission) return <Typography>You haven't submitted this assessment yet.</Typography>;

  const assessment = submission.assessment;

  return (
    <Box>
      <Typography variant="h4" mb={1}>{assessment.title}</Typography>
      <Chip
        label={submission.status === "CHECKED" ? `Score: ${submission.totalScore} / ${assessment.totalMarks}` : "Waiting for teacher to check"}
        color={submission.status === "CHECKED" ? "success" : "warning"}
        sx={{ mb: 3, fontWeight: 600 }}
      />

      {submission.status === "CHECKED" && (
        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
          {assessment.questions.map((q, i) => {
            const a = submission.answers.find((x) => x.questionIndex === i);
            return (
              <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: "1px solid #f1f5f9" }}>
                <Typography sx={{ fontWeight: 600 }}>Q{i + 1}. {q.text}</Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Marks awarded: {a?.marksAwarded ?? 0} / {q.marks}
                </Typography>
              </Box>
            );
          })}
        </Paper>
      )}
    </Box>
  );
}

export default function ResultPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ p: 3 }}><ResultContent /></Box>
    </PortalGuard>
  );
}