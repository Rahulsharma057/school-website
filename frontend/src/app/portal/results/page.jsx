"use client";

import PortalGuard from "@/components/PortalGuard";
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow,
  TableCell, CircularProgress, Button, Stack,
} from "@mui/material";
import { DownloadOutlined } from "@mui/icons-material";
import { useMyResults } from "@/hooks/useResult";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function downloadResultPDF(result, studentName) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(result.exam?.examName || "Result", 14, 18);

  doc.setFontSize(11);
  doc.text(`Student: ${studentName}`, 14, 27);
  doc.text(`Class: ${result.class?.className || ""} - ${result.class?.section || ""}`, 14, 33);

  autoTable(doc, {
    startY: 40,
    head: [["Subject", "Marks Obtained", "Max Marks"]],
    body: result.marks.map((m) => [m.subject, m.marksObtained, m.maxMarks]),
  });

  const finalY = doc.lastAutoTable.finalY || 40;
  doc.setFontSize(12);
  doc.text(`Total: ${result.totalObtained}/${result.totalMax}`, 14, finalY + 10);
  doc.text(`Percentage: ${result.percentage}%`, 14, finalY + 17);

  doc.save(`${(result.exam?.examName || "result").replace(/\s+/g, "_")}.pdf`);
}

function ResultsContent() {
  const { data: results = [], isLoading } = useMyResults();
  const { user } = useAuth();

  if (isLoading) return <CircularProgress />;

  if (results.length === 0) return <Typography>No results published yet.</Typography>;

  return results.map((r) => (
    <Paper key={r._id} elevation={0} sx={{ p: 3, mb: 2, border: "1px solid #e2e8f0", borderRadius: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">{r.exam?.examName}</Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={() => downloadResultPDF(r, user?.name || "Student")}
          sx={{ textTransform: "none" }}
        >
          Download PDF
        </Button>
      </Stack>

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