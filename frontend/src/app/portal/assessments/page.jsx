"use client";

import { useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button, Stack } from "@mui/material";
import { useMyAssessments, useUpdateAssessmentStatus } from "@/hooks/useAssessment";

const statusColor = { DRAFT: "default", PUBLISHED: "success", CLOSED: "error" };

function ListContent() {
  const router = useRouter();
  const { data: assessments = [] } = useMyAssessments();
  const { mutate: updateStatus } = useUpdateAssessmentStatus();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Assessments</Typography>
        <Button variant="contained" onClick={() => router.push("/portal/assessments/create")} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
          + Create Assessment
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Title</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Questions</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.map((a) => (
              <TableRow key={a._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{a.title}</TableCell>
                <TableCell>{a.class?.className}-{a.class?.section}</TableCell>
                <TableCell>{a.subject}</TableCell>
                <TableCell>{a.questions.length} ({a.totalMarks} marks)</TableCell>
                <TableCell><Chip label={a.status} size="small" color={statusColor[a.status]} /></TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    {a.status === "DRAFT" && (
                      <Button size="small" variant="outlined" onClick={() => updateStatus({ id: a._id, status: "PUBLISHED" })} sx={{ textTransform: "none" }}>Publish</Button>
                    )}
                    {a.status === "PUBLISHED" && (
                      <Button size="small" variant="outlined" color="error" onClick={() => updateStatus({ id: a._id, status: "CLOSED" })} sx={{ textTransform: "none" }}>Close</Button>
                    )}
                    <Button size="small" variant="outlined" onClick={() => router.push(`/portal/assessments/${a._id}/submissions`)} sx={{ textTransform: "none" }}>
                      View Submissions
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {assessments.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "#94a3b8" }}>No assessments created yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default function MyAssessmentsPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}><ListContent /></Box>
    </PortalGuard>
  );
}