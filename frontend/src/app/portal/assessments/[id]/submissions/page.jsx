"use client";

import { useParams, useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button } from "@mui/material";
import { useSubmissionsForAssessment } from "@/hooks/useAssessment";

const statusColor = { SUBMITTED: "warning", CHECKED: "success", IN_PROGRESS: "default" };

function SubmissionsContent() {
  const { id } = useParams();
  const router = useRouter();
  const { data: submissions = [] } = useSubmissionsForAssessment(id);

  return (
    <Box>
      <Typography variant="h4" mb={3}>Submissions</Typography>
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Student</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s._id} hover>
                <TableCell>{s.student?.name}</TableCell>
                <TableCell>{s.totalScore}</TableCell>
                <TableCell><Chip label={s.status} size="small" color={statusColor[s.status]} /></TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" onClick={() => router.push(`/portal/assessments/submissions/${s._id}`)} sx={{ textTransform: "none" }}>
                    {s.status === "CHECKED" ? "View" : "Grade"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: "#94a3b8" }}>No submissions yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default function SubmissionsPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}><SubmissionsContent /></Box>
    </PortalGuard>
  );
}