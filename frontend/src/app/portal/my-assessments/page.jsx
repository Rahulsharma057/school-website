"use client";

import { useRouter } from "next/navigation";
import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, Button } from "@mui/material";
import { useMyClassAssessments } from "@/hooks/useAssessment";

function ListContent() {
  const router = useRouter();
  const { data: assessments = [] } = useMyClassAssessments();

  return (
    <Box>
      <Typography variant="h4" mb={3}>My Assessments</Typography>
      <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell>Title</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assessments.map((a) => (
              <TableRow key={a._id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{a.title}</TableCell>
                <TableCell>{a.subject}</TableCell>
                <TableCell>{a.totalMarks}</TableCell>
                <TableCell>
                  {a.mySubmission ? (
                    <Chip label={a.mySubmission.status === "CHECKED" ? `Scored: ${a.mySubmission.totalScore}` : "Submitted"} size="small" color="success" />
                  ) : (
                    <Chip label="Not attempted" size="small" />
                  )}
                </TableCell>
                <TableCell align="right">
                  {!a.mySubmission && a.status === "PUBLISHED" ? (
                    <Button size="small" variant="contained" onClick={() => router.push(`/portal/my-assessments/${a._id}/take`)} sx={{ textTransform: "none" }}>
                      Attempt
                    </Button>
                  ) : (
                    <Button size="small" variant="outlined" onClick={() => router.push(`/portal/my-assessments/${a._id}/result`)} sx={{ textTransform: "none" }}>
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {assessments.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>No assessments yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default function MyAssessmentsPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ p: 3 }}><ListContent /></Box>
    </PortalGuard>
  );
}