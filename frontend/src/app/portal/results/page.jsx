"use client";

import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from "@mui/material";
import { useMyResults } from "@/hooks/useResult";

function ResultsContent() {
  const { data: results = [], isLoading } = useMyResults();
  if (isLoading) return <CircularProgress />;

  if (results.length === 0) return <Typography>No results published yet.</Typography>;

  return results.map((r) => (
    <Paper key={r._id} sx={{ p: 3, mb: 2 }}>
      <Typography variant="h6">{r.exam?.examName}</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Subject</TableCell>
            <TableCell>Marks Obtained</TableCell>
            <TableCell>Max Marks</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {r.marks.map((m, i) => (
            <TableRow key={i}>
              <TableCell>{m.subject}</TableCell>
              <TableCell>{m.marksObtained}</TableCell>
              <TableCell>{m.maxMarks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography sx={{ mt: 1 }}>
        Total: {r.totalObtained}/{r.totalMax} | Percentage: {r.percentage}%
      </Typography>
    </Paper>
  ));
}

export default function MyResultsPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>My Results</Typography>
        <ResultsContent />
      </Box>
    </PortalGuard>
  );
}