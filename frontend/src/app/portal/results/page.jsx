"use client";

import PortalGuard from "@/components/PortalGuard";
import {
  Avatar, Box, Chip, Divider, Paper, Skeleton, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";

import { EmojiEvents, School } from "@mui/icons-material";

import { useMyResults } from "@/hooks/useResult";

const COLORS = {
  primary: "#5B21B6", primaryDark: "#4C1D95", primaryDeep: "#3B0764", accent: "#7C3AED",
  surfaceTint: "#FAF5FF", border: "#E9D5FF", bgPage: "#F8F7FC", textMuted: "#6B7280", textDark: "#1E1B2E",
};

function ResultsContent() {
  const { data: results = [], isLoading } = useMyResults();

  const getSubjectName = (subject) => {
  if (!subject) return "Subject";

  if (typeof subject === "object") {
    return subject.name || subject.code || "Subject";
  }

  return String(subject);
};

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={180} />
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
          <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.25, background: `linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primaryDark})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap" }}>
            <Box>
              <Typography fontSize={15} fontWeight={800}>{r.exam?.examName || "Exam"}</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,.75)" }}>
                {r.class?.className ? `${r.class.className} - ${r.class.section}` : "Result"}
              </Typography>
            </Box>
            <Chip
              size="small"
              icon={<School sx={{ fontSize: 16 }} />}
              label={r.status}
              sx={{
                fontWeight: 800,
                color: r.status === "PASS" ? "#166534" : "#B91C1C",
                backgroundColor: r.status === "PASS" ? "#DCFCE7" : "#FEE2E2",
              }}
            />
          </Box>

          <Divider />

          {r.marks.map((subjectMark, i) => (
            <Box key={i}>
              <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1, backgroundColor: COLORS.surfaceTint, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
<Typography variant="body2" fontWeight={700}>
  {typeof subjectMark.subject === "object"
    ? subjectMark.subject?.name || "Subject"
    : subjectMark.subject || "Subject"}
</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {subjectMark.marksObtained}/{subjectMark.maxMarks} ({subjectMark.percentage}%)
                  </Typography>
                  <Chip
                    size="small"
                    label={subjectMark.status}
                    sx={{
                      fontWeight: 700,
                      color: subjectMark.status === "PASS" ? "#166534" : "#B91C1C",
                      backgroundColor: subjectMark.status === "PASS" ? "#DCFCE7" : "#FEE2E2",
                    }}
                  />
                </Stack>
              </Box>

              {subjectMark.components?.length > 0 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted }}>Component</TableCell>
                        <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted }}>Marks Obtained</TableCell>
                        <TableCell sx={{ fontSize: 11.5, fontWeight: 700, color: COLORS.textMuted }}>Max Marks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subjectMark.components.map((comp, ci) => (
                        <TableRow key={ci}>
            <TableCell sx={{ fontSize: 13 }}>
  {typeof comp.component === "object"
    ? comp.component?.name || comp.component?.code || "Component"
    : comp.component || "Component"}
</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{comp.marksObtained}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{comp.maxMarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              <Divider />
            </Box>
          ))}

          <Box sx={{ px: { xs: 1.5, md: 2 }, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, flexWrap: "wrap", backgroundColor: COLORS.surfaceTint }}>
            <Typography variant="body2" fontWeight={700}>Total: {r.totalObtained}/{r.totalMax}</Typography>
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

export default function MyResultsPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT","TEACHER"]}>
      <Box sx={{ minHeight: "100vh", backgroundColor: COLORS.bgPage, px: { xs: 1.5, sm: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
        <Box sx={{ maxWidth: 900, mx: "auto" }}>
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: { xs: 19, sm: 22 }, fontWeight: 800, color: COLORS.textDark }}>My Results</Typography>
            <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 0.3 }}>View your exam results, subject-wise</Typography>
          </Box>
          <ResultsContent />
        </Box>
      </Box>
    </PortalGuard>
  );
}

const cardSx = { border: `1px solid ${COLORS.border}`, borderRadius: 2.5, overflow: "hidden", backgroundColor: "#fff" };