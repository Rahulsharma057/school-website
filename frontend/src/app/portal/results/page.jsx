"use client";

import PortalGuard from "@/components/PortalGuard";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { DownloadOutlined, EmojiEvents, School } from "@mui/icons-material";
import { useMyResults } from "@/hooks/useResult";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// =====================================================
// CONFIG — apna college ka naam yahin edit karo
// =====================================================

const COLLEGE_NAME = "Your College Name";
const COLLEGE_SUBTITLE = "Student Result Portal";

// =====================================================
// THEME
// =====================================================

const COLORS = {
  primary: "#5B21B6",
  primaryDark: "#4C1D95",
  primaryDeep: "#3B0764",
  accent: "#7C3AED",
  surfaceTint: "#FAF5FF",
  border: "#E9D5FF",
  bgPage: "#F8F7FC",
  textMuted: "#6B7280",
  textDark: "#1E1B2E",
};

// =====================================================
// PDF GENERATION
// =====================================================

function downloadResultPDF(result, studentName) {
  const doc = new jsPDF();

  // College letterhead
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text(COLLEGE_NAME, 14, 16);

  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(COLLEGE_SUBTITLE, 14, 22);

  doc.setDrawColor(91, 33, 182);
  doc.setLineWidth(0.6);
  doc.line(14, 26, 196, 26);

  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text(result.exam?.examName || "Result", 14, 36);

  doc.setFontSize(11);
  doc.setFont(undefined, "normal");
  doc.text(`Student: ${studentName}`, 14, 44);
  doc.text(`Class: ${result.class?.className || ""} - ${result.class?.section || ""}`, 14, 50);

  autoTable(doc, {
    startY: 57,
    head: [["Subject", "Marks Obtained", "Max Marks"]],
    body: result.marks.map((m) => [m.subject, m.marksObtained, m.maxMarks]),
    headStyles: { fillColor: [91, 33, 182] },
  });

  const finalY = doc.lastAutoTable.finalY || 57;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text(`Total: ${result.totalObtained}/${result.totalMax}`, 14, finalY + 10);
  doc.text(`Percentage: ${result.percentage}%`, 14, finalY + 17);

  doc.save(`${(result.exam?.examName || "result").replace(/\s+/g, "_")}.pdf`);
}

// =====================================================
// RESULTS CONTENT
// =====================================================

function ResultsContent() {
  const { data: results = [], isLoading } = useMyResults();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={160} />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (results.length === 0) {
    return (
      <Paper elevation={0} sx={{ ...cardSx, textAlign: "center", py: 6, px: 2 }}>
        <Avatar sx={{ mx: "auto", mb: 1.5, width: 48, height: 48, bgcolor: COLORS.surfaceTint, color: COLORS.primary }}>
          <EmojiEvents fontSize="small" />
        </Avatar>
        <Typography fontWeight={700}>No results published yet</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Check back once your teacher publishes exam results.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      {results.map((r) => (
        <Paper key={r._id} elevation={0} sx={cardSx}>
          {/* PANEL HEADER */}
          <Box
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.25,
              background: `linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primaryDark})`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography fontSize={15} fontWeight={800}>{r.exam?.examName}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.75)" }}>
                {r.class?.className ? `${r.class.className} - ${r.class.section}` : "Result"}
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              startIcon={<DownloadOutlined sx={{ fontSize: 16 }} />}
              onClick={() => downloadResultPDF(r, user?.name || "Student")}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                color: "#fff",
                borderColor: "rgba(255,255,255,.5)",
                "&:hover": { borderColor: "#fff", backgroundColor: "rgba(255,255,255,.08)" },
              }}
            >
              Download PDF
            </Button>
          </Box>

          <Divider />

          {/* MARKS TABLE */}
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 420 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: COLORS.surfaceTint }}>
                  <TableCell sx={headCellSx}>Subject</TableCell>
                  <TableCell sx={headCellSx}>Marks Obtained</TableCell>
                  <TableCell sx={headCellSx}>Max Marks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {r.marks.map((m, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{m.subject}</TableCell>
                    <TableCell>{m.marksObtained}</TableCell>
                    <TableCell>{m.maxMarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider />

          {/* SUMMARY FOOTER */}
          <Box
            sx={{
              px: { xs: 1.5, md: 2 },
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              flexWrap: "wrap",
              backgroundColor: COLORS.surfaceTint,
            }}
          >
            <Typography variant="body2" fontWeight={700}>
              Total: {r.totalObtained}/{r.totalMax}
            </Typography>
            <Chip
              size="small"
              label={`${r.percentage}%`}
              sx={{
                fontWeight: 800,
                color: r.percentage >= 40 ? "#166534" : "#B91C1C",
                backgroundColor: r.percentage >= 40 ? "#DCFCE7" : "#FEE2E2",
              }}
            />
          </Box>
        </Paper>
      ))}
    </Stack>
  );
}

// =====================================================
// PAGE
// =====================================================

export default function MyResultsPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bgPage, px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          {/* COLLEGE HEADER */}
          <Box
            sx={{
              mb: 2.5,
              p: { xs: 1.75, md: 2.25 },
              borderRadius: 2.5,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              boxShadow: "0 6px 18px rgba(91,33,182,0.3)",
            }}
          >
            <Avatar sx={{ width: 46, height: 46, bgcolor: "rgba(255,255,255,.15)", color: "#fff" }}>
              <School fontSize="small" />
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: { xs: 17, sm: 20 }, fontWeight: 800, lineHeight: 1.2 }}>
                {COLLEGE_NAME}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.8)" }}>
                {COLLEGE_SUBTITLE}
              </Typography>
            </Box>
          </Box>

          {/* PAGE TITLE */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: { xs: 19, sm: 22 }, fontWeight: 800, color: COLORS.textDark }}>
              My Results
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.3 }}>
              View and download your published exam results
            </Typography>
          </Box>

          <ResultsContent />
        </Box>
      </Box>
    </PortalGuard>
  );
}

// =====================================================
// SHARED STYLES  ← ye missing tha, isi wajah se error aa raha tha
// =====================================================

const cardSx = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 2.5,
  overflow: "hidden",
  backgroundColor: "#fff",
};

const headCellSx = {
  fontWeight: 800,
  fontSize: 12.5,
  color: COLORS.textDark,
  whiteSpace: "nowrap",
};