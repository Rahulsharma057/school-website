"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { Assessment, DoneAll, PublishedWithChanges } from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";
import { useSchoolExams } from "@/hooks/useExam";
import { useGenerateFinalResults, useClassFinalResults, usePublishFinalResults } from "@/hooks/useFinalResult";

const PURPLE = "#7c3aed";

export default function FinalResultsPage() {
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState(
    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
  );
  const [selectedExamIds, setSelectedExamIds] = useState([]);

  const { data: classes = [], isLoading: classesLoading } = useClasses();

  const { data: examsData, isLoading: examsLoading } = useSchoolExams(classId, { academicYear });
  const exams = useMemo(() => examsData?.data || examsData?.exams || [], [examsData]);

  // Sirf wo exams jo result mein count hote hain
  const contributingExams = exams.filter((e) => e.resultContribution !== false);

  const { mutate: generateFinalResults, isPending: isGenerating } = useGenerateFinalResults();
  const { mutate: publishFinalResults, isPending: isPublishing } = usePublishFinalResults();

  const {
    data: finalResults = [],
    isLoading: finalResultsLoading,
  } = useClassFinalResults({ classId, academicYear });

  const toggleExam = (examId) => {
    setSelectedExamIds((prev) => (prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]));
  };

  const totalWeightage = contributingExams
    .filter((e) => selectedExamIds.includes(e._id))
    .reduce((sum, e) => sum + Number(e.weightage || 0), 0);

  const handleGenerate = () => {
    if (!classId || !academicYear || !selectedExamIds.length) return;

    generateFinalResults({
      classId,
      academicYear,
      examIds: selectedExamIds,
    });
  };

  const handlePublish = () => {
    if (!classId || !academicYear) return;
    const confirmed = window.confirm("Publish final results? Students will be able to see them.");
    if (!confirmed) return;

    publishFinalResults({ classId, academicYear });
  };

  const publishedCount = finalResults.filter((r) => r.isPublished).length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", p: { xs: 1.5, sm: 2.5, md: 3, lg: 4 } }}>
      {/* HEADER */}
      <Card elevation={0} sx={{ mb: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 46, height: 46, bgcolor: PURPLE }}>
              <Assessment />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#172033">
                Final Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Combine Half Yearly + Annual exams into a final report card.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Card>

      {/* FILTERS */}
      <Card elevation={0} sx={{ mb: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
        <Box sx={{ px: 2.5, py: 1.5, bgcolor: "#faf5ff", borderBottom: "1px solid #ede9fe" }}>
          <Typography fontWeight={800} fontSize={14}>
            Select Class & Academic Year
          </Typography>
        </Box>

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField
              select
              size="small"
              label="Class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSelectedExamIds([]);
              }}
              disabled={classesLoading}
              sx={{ minWidth: { sm: 220 } }}
            >
              <MenuItem value="" disabled>
                {classesLoading ? "Loading classes..." : "Select Class"}
              </MenuItem>
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.className} - {c.section}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Academic Year"
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setSelectedExamIds([]);
              }}
              sx={{ minWidth: { sm: 180 } }}
            />
          </Stack>
        </Box>
      </Card>

      {!classId && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
          Select a class and academic year to see available exams.
        </Alert>
      )}

      {/* EXAM SELECTION */}
      {classId && (
        <Card elevation={0} sx={{ mb: 2.5, border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography fontWeight={800} fontSize={14}>
                Select Contributing Exams
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Only exams marked as "contributes to final result" appear here.
              </Typography>
            </Box>

            {selectedExamIds.length > 0 && (
              <Chip
                size="small"
                label={`Total weightage: ${totalWeightage}%`}
                sx={{
                  fontWeight: 700,
                  bgcolor: totalWeightage === 100 ? "#dcfce7" : "#fef3c7",
                  color: totalWeightage === 100 ? "#166534" : "#92400e",
                }}
              />
            )}
          </Box>

          <Divider />

          {examsLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: PURPLE }} />
            </Box>
          ) : contributingExams.length === 0 ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography color="text.secondary">No contributing exams found for this class/year.</Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {contributingExams.map((exam) => (
                <Box
                  key={exam._id}
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    "&:hover": { bgcolor: "#faf5ff" },
                  }}
                >
                  <Checkbox
                    checked={selectedExamIds.includes(exam._id)}
                    onChange={() => toggleExam(exam._id)}
                    sx={{ color: PURPLE, "&.Mui-checked": { color: PURPLE } }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {exam.examName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {exam.examCategory} • Weightage: {exam.weightage}%
                    </Typography>
                  </Box>
                  {exam.isFinal && <Chip size="small" label="Final Exam" color="secondary" />}
                  <Chip size="small" label={exam.status} variant="outlined" />
                </Box>
              ))}
            </Stack>
          )}

          <Divider />

          <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              startIcon={isGenerating ? <CircularProgress size={17} color="inherit" /> : <DoneAll />}
              onClick={handleGenerate}
              disabled={isGenerating || !selectedExamIds.length}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: PURPLE,
                boxShadow: "none",
                "&:hover": { bgcolor: "#6d28d9", boxShadow: "none" },
              }}
            >
              {isGenerating ? "Generating..." : "Generate Final Results"}
            </Button>
          </Box>
        </Card>
      )}

      {/* GENERATED RESULTS */}
      {classId && (
        <Card elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 2.5, bgcolor: "#fff", overflow: "hidden" }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Box>
              <Typography fontWeight={800} fontSize={14}>
                Generated Final Results
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {finalResults.length} result{finalResults.length !== 1 ? "s" : ""} — {publishedCount} published
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={isPublishing ? <CircularProgress size={17} /> : <PublishedWithChanges />}
              onClick={handlePublish}
              disabled={isPublishing || finalResults.length === 0}
              sx={{ textTransform: "none", fontWeight: 700, borderColor: PURPLE, color: PURPLE }}
            >
              {isPublishing ? "Publishing..." : "Publish All"}
            </Button>
          </Box>

          <Divider />

          {finalResultsLoading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: PURPLE }} />
            </Box>
          ) : finalResults.length === 0 ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <Typography color="text.secondary">No final results generated yet.</Typography>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table sx={{ minWidth: 560 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#faf5ff" }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Percentage</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Grade</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Published</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalResults.map((result) => (
                    <TableRow key={result._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{result.student?.name || "Unknown"}</TableCell>
                      <TableCell>
                        {result.totalObtained}/{result.totalMax}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${result.percentage}%`}
                          sx={{
                            fontWeight: 700,
                            color: result.percentage >= 40 ? "#166534" : "#B91C1C",
                            backgroundColor: result.percentage >= 40 ? "#DCFCE7" : "#FEE2E2",
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={result.overallGrade || "-"} variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={result.status}
                          color={result.status === "PASS" ? "success" : "error"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {result.isPublished ? (
                          <Chip size="small" label="Published" color="success" />
                        ) : (
                          <Chip size="small" label="Draft" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}
    </Box>
  );
}