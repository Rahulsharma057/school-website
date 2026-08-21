"use client";

import { useMemo, useState } from "react";

import PortalGuard from "@/components/PortalGuard";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
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

import { Download, Print } from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";
import { useMyAssignments } from "@/hooks/useTeacherAssignments";
import { useClassResults } from "@/hooks/useResult";
import { useClassFinalResults } from "@/hooks/useFinalResult";

/* =====================================================
   COLORS
===================================================== */

const COLORS = {
  primary: "#5B21B6",
  primaryDark: "#4C1D95",
  primaryDeep: "#3B0764",
  border: "#D1D5DB",
  light: "#F8FAFC",
  text: "#111827",
  muted: "#6B7280",
  success: "#166534",
  successBg: "#DCFCE7",
  danger: "#B91C1C",
};

/* =====================================================
   HELPERS
===================================================== */

// FIX: pehle isme `item?.exam?.examCategory === category` bhi check
// hota tha — lekin getClassResults() (backend) `exam` field ko
// populate hi nahi karta, isliye examCategory hamesha undefined aata
// tha aur match kabhi hota hi nahi tha (marks columns khaali rehte
// the). Hum yahan pehle se HALF_YEARLY / ANNUAL exam ID se alag-alag
// fetch kar chuke hain (useClassResults(halfYearlyExamId) /
// useClassResults(annualExamId)), isliye har array me already sirf
// usi exam ke results hain — sirf studentId se match karna kaafi hai.
function getStudentExamResult(classResults = [], studentId) {
  return (
    classResults.find(
      (item) => String(item?.student?._id || item?.student) === String(studentId)
    ) || null
  );
}

function getSubjectMark(examResult, subjectId) {
  if (!examResult?.marks) return null;

  return (
    examResult.marks.find(
      (item) => String(item?.subject?._id || item?.subject) === String(subjectId)
    ) || null
  );
}

function formatMarks(obtained, max) {
  return `${obtained ?? 0} / ${max ?? 0}`;
}

function getStudentName(finalResult) {
  return (
    finalResult?.studentName ||
    finalResult?.student?.name ||
    finalResult?.student?.user?.name ||
    "Student"
  );
}

// FIX: getClassFinalResults (backend) abhi attachStudentDetails() call
// nahi karta, isliye finalResult.fatherName/rollNo khaali aate hain.
// Jab tak wo backend fix nahi hota, halfYearly/annual Result se bhi
// fallback try karte hain — naye resultController.getClassResults()
// student object me rollNumber/fatherName already attach karke bhejta
// hai (StudentProfile se), to wahan se mil jayega.
function getFatherName(finalResult, halfYearly, annual) {
  return (
    finalResult?.fatherName ||
    finalResult?.student?.fatherName ||
    finalResult?.student?.user?.fatherName ||
    halfYearly?.student?.fatherName ||
    annual?.student?.fatherName ||
    "—"
  );
}

function getRollNo(finalResult, halfYearly, annual) {
  return (
    finalResult?.rollNo ??
    finalResult?.rollNumber ??
    finalResult?.student?.rollNo ??
    finalResult?.student?.rollNumber ??
    halfYearly?.student?.rollNumber ??
    annual?.student?.rollNumber ??
    "—"
  );
}

function getClassName(finalResult, fallbackClass) {
  return (
    finalResult?.class?.className ||
    finalResult?.class?.name ||
    finalResult?.student?.class?.className ||
    fallbackClass?.className ||
    "—"
  );
}

function getSection(finalResult, fallbackClass) {
  return (
    finalResult?.class?.section ||
    finalResult?.student?.class?.section ||
    fallbackClass?.section ||
    "—"
  );
}

function getAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 3 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/* =====================================================
   REPORT CARD (same layout as the student PDF page)
===================================================== */

function ReportCard({ finalResult, halfYearly, annual, fallbackClass }) {
  const subjects = finalResult?.subjects || [];

  const halfYearlyWeightage =
    finalResult?.sourceExams?.find((exam) => exam.examCategory === "HALF_YEARLY")?.weightage ?? 50;

  const annualWeightage =
    finalResult?.sourceExams?.find((exam) => exam.examCategory === "ANNUAL")?.weightage ?? 50;

  const studentName = getStudentName(finalResult);
  const fatherName = getFatherName(finalResult, halfYearly, annual);
  const rollNo = getRollNo(finalResult, halfYearly, annual);
  const className = getClassName(finalResult, fallbackClass);
  const section = getSection(finalResult, fallbackClass);

  const classDisplay = className !== "—" ? `${className} - ${section}` : "—";

  return (
    <Box className="report-card">
      {/* SCHOOL HEADER */}
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography sx={{ fontSize: 22, fontWeight: 900, color: COLORS.primaryDeep, letterSpacing: 0.5 }}>
          Smt Sheela Gautam Inter College (Aligarh)
        </Typography>

        <Typography sx={{ fontSize: 18, fontWeight: 900, color: COLORS.text, mt: 0.3 }}>
          ANNUAL FINAL REPORT CARD
        </Typography>

        <Typography sx={{ fontSize: 12, color: COLORS.muted, mt: 0.4 }}>
          Session: {finalResult?.academicYear || "—"}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2, borderColor: COLORS.primary, borderWidth: 1 }} />

      {/* STUDENT DETAILS */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 5, rowGap: 1, mb: 2 }}>
        <StudentInfo label="Student Name" value={studentName} />
        <StudentInfo label="Class" value={classDisplay} />
        <StudentInfo label="Father Name" value={fatherName} />
        <StudentInfo label="Roll No" value={rollNo} />
      </Box>

      {/* MARKS TABLE */}
      <TableContainer>
        <Table size="small" sx={{ border: `1px solid ${COLORS.border}`, borderCollapse: "collapse" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#F3F4F6" }}>
              <TableCell rowSpan={2} sx={headCell}>Subject</TableCell>
              <TableCell align="center" sx={headCell}>
                Half Yearly
                <Typography component="span" display="block" fontSize={9} color={COLORS.muted}>
                  Obt / Max
                </Typography>
              </TableCell>
              <TableCell align="center" sx={headCell}>
                Annual
                <Typography component="span" display="block" fontSize={9} color={COLORS.muted}>
                  Obt / Max
                </Typography>
              </TableCell>
              <TableCell align="center" sx={headCell}>
                Final Total
                <Typography component="span" display="block" fontSize={9} color={COLORS.muted}>
                  Obt / Max
                </Typography>
              </TableCell>
              <TableCell align="center" sx={headCell}>Grade</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subjects.map((subject, index) => {
              const subjectId = subject?.subject;
              const halfMark = getSubjectMark(halfYearly, subjectId);
              const annualMark = getSubjectMark(annual, subjectId);

              return (
                <TableRow key={subjectId || index}>
                  <TableCell sx={{ ...bodyCell, fontWeight: 700 }}>
                    {subject?.subjectName || subject?.subjectDetails?.name || "—"}
                  </TableCell>
                  <TableCell align="center" sx={bodyCell}>
                    {formatMarks(halfMark?.marksObtained, halfMark?.maxMarks)}
                  </TableCell>
                  <TableCell align="center" sx={bodyCell}>
                    {formatMarks(annualMark?.marksObtained, annualMark?.maxMarks)}
                  </TableCell>
                  <TableCell align="center" sx={{ ...bodyCell, fontWeight: 800 }}>
                    {formatMarks(subject?.marksObtained, subject?.maxMarks)}
                  </TableCell>
                  <TableCell align="center" sx={bodyCell}>
                    <Chip size="small" label={subject?.grade || "-"} sx={{ height: 23, fontSize: 11, fontWeight: 800 }} />
                  </TableCell>
                </TableRow>
              );
            })}

            {/* TOTAL */}
            <TableRow sx={{ backgroundColor: "#F3F4F6" }}>
              <TableCell sx={{ ...bodyCell, fontWeight: 900 }}>TOTAL</TableCell>
              <TableCell align="center" sx={{ ...bodyCell, fontWeight: 900 }}>
                {formatMarks(halfYearly?.totalObtained, halfYearly?.totalMax)}
              </TableCell>
              <TableCell align="center" sx={{ ...bodyCell, fontWeight: 900 }}>
                {formatMarks(annual?.totalObtained, annual?.totalMax)}
              </TableCell>
              <TableCell align="center" sx={{ ...bodyCell, fontWeight: 900, color: COLORS.primary }}>
                {formatMarks(finalResult?.totalObtained, finalResult?.totalMax)}
              </TableCell>
              <TableCell sx={bodyCell} />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* RESULT SUMMARY */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
          <Summary label="Final Percentage" value={`${finalResult?.percentage ?? 0}%`} />
          <Summary label="Overall Grade" value={finalResult?.overallGrade || "-"} />
          <Summary label="Result" value={finalResult?.status || "-"} success={finalResult?.status === "PASS"} />
        </Box>

        {/* WEIGHTAGE */}
        <Box sx={{ mt: 1.5, p: 1.5, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.light }}>
          <Typography fontSize={11} fontWeight={900} sx={{ mb: 1 }}>
            EXAM WEIGHTAGE
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}>
            <Weight label="Half Yearly" value={`${halfYearlyWeightage}%`} />
            <Weight label="Annual" value={`${annualWeightage}%`} />
            <Weight label="Total" value={`${Number(halfYearlyWeightage) + Number(annualWeightage)}%`} />
          </Box>
        </Box>
      </Box>

      {/* SIGNATURE */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 3, mt: 7, textAlign: "center" }}>
        <Box>
          <Divider />
          <Typography fontSize={11} sx={{ mt: 0.5 }}>Class Teacher</Typography>
        </Box>
        <Box>
          <Divider />
          <Typography fontSize={11} sx={{ mt: 0.5 }}>Principal</Typography>
        </Box>
        <Box>
          <Divider />
          <Typography fontSize={11} sx={{ mt: 0.5 }}>Parent / Guardian</Typography>
        </Box>
      </Box>
    </Box>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function StudentInfo({ label, value }) {
  return (
    <Box sx={{ display: "flex", gap: 0.5, fontSize: 12 }}>
      <Typography component="span" fontSize={12} fontWeight={800}>{label}:</Typography>
      <Typography component="span" fontSize={12}>{value}</Typography>
    </Box>
  );
}

function Summary({ label, value, success = false }) {
  return (
    <Box sx={{ border: `1px solid ${COLORS.border}`, p: 1.2, textAlign: "center" }}>
      <Typography fontSize={9} color={COLORS.muted} fontWeight={700}>{label}</Typography>
      <Typography fontSize={15} fontWeight={900} sx={{ mt: 0.3, color: success ? COLORS.success : COLORS.primaryDeep }}>
        {value}
      </Typography>
    </Box>
  );
}

function Weight({ label, value }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", p: 1 }}>
      <Typography fontSize={10}>{label}</Typography>
      <Typography fontSize={11} fontWeight={900} color={COLORS.primary}>{value}</Typography>
    </Box>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function TeacherClassFinalResultPdfPage() {
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState(getAcademicYear());

  const { data: allClasses = [], isLoading: classesLoading } = useClasses();
  const { data: myAssignments = [], isLoading: assignmentsLoading } = useMyAssignments();

  const myClassOptions = useMemo(() => {
    const assignedClassIds = new Set(
      myAssignments
        .map((a) => String(a?.class?._id || a?.class || ""))
        .filter(Boolean)
    );

    return allClasses.filter((cls) => assignedClassIds.has(String(cls._id)));
  }, [allClasses, myAssignments]);

  const selectedClass = useMemo(
    () => myClassOptions.find((cls) => String(cls._id) === String(classId)) || null,
    [myClassOptions, classId]
  );

  const {
    data: finalResults = [],
    isLoading: finalLoading,
    isError: finalError,
  } = useClassFinalResults({ classId, academicYear });

  const halfYearlyExamId = finalResults[0]?.sourceExams?.find((e) => e.examCategory === "HALF_YEARLY")?._id;
  const annualExamId = finalResults[0]?.sourceExams?.find((e) => e.examCategory === "ANNUAL")?._id;

  const { data: halfYearlyClassResults = [], isLoading: halfLoading } = useClassResults(halfYearlyExamId);
  const { data: annualClassResults = [], isLoading: annualLoading } = useClassResults(annualExamId);

  const loading =
    classesLoading ||
    assignmentsLoading ||
    (Boolean(classId) && Boolean(academicYear) && (finalLoading || halfLoading || annualLoading));

  return (
    <PortalGuard allowedRoles={["TEACHER", "ADMIN"]}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "#E5E7EB", py: 3 }}>
        {/* CONTROLS */}
        <Paper
          className="no-print"
          sx={{ maxWidth: "210mm", mx: "auto", mb: 2, p: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}
        >
          <TextField
            select
            label="Class"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            size="small"
            sx={{ minWidth: 220 }}
          >
            {myClassOptions.length === 0 && (
              <MenuItem value="" disabled>
                {assignmentsLoading ? "Loading classes…" : "No classes assigned to you"}
              </MenuItem>
            )}
            {myClassOptions.map((cls) => (
              <MenuItem key={cls._id} value={cls._id}>
                {cls.className} - {cls.section}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Academic Year"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            size="small"
            placeholder="2025-2026"
            sx={{ minWidth: 160 }}
          />

          <Box sx={{ flexGrow: 1 }} />

          <Button
            variant="contained"
            startIcon={<Download />}
            disabled={!classId || !academicYear || finalResults.length === 0}
            onClick={() => window.print()}
            sx={{ backgroundColor: COLORS.primary, "&:hover": { backgroundColor: COLORS.primaryDark } }}
          >
            Download PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<Print />}
            disabled={!classId || !academicYear || finalResults.length === 0}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </Paper>

        {/* STATE MESSAGES */}
        {!classId && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography fontWeight={800} color={COLORS.muted}>
              Select a class and academic year to view final results
            </Typography>
          </Box>
        )}

        {classId && loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {classId && !loading && finalError && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography fontWeight={800} color={COLORS.danger}>
              Unable to load final results for this class
            </Typography>
          </Box>
        )}

        {classId && !loading && !finalError && finalResults.length === 0 && (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <Typography fontWeight={800}>
              No final results generated yet for this class / academic year
            </Typography>
          </Box>
        )}

        {/* REPORT CARDS — one A4 page per student */}
        {classId && !loading && !finalError && finalResults.length > 0 && (
          <Box className="pdf-page">
            {finalResults.map((finalResult) => {
              const studentId = finalResult?.student?._id || finalResult?.student;

              const halfYearly = getStudentExamResult(halfYearlyClassResults, studentId);
              const annual = getStudentExamResult(annualClassResults, studentId);

              return (
                <Box
                  key={finalResult?._id}
                  className="a4-sheet"
                  sx={{ width: "210mm", minHeight: "297mm", backgroundColor: "#fff", mx: "auto", p: "12mm", boxSizing: "border-box", mb: 3 }}
                >
                  <ReportCard
                    finalResult={finalResult}
                    halfYearly={halfYearly}
                    annual={annual}
                    fallbackClass={selectedClass}
                  />
                </Box>
              );
            })}
          </Box>
        )}

        {/* PRINT CSS */}
        <style jsx global>{`
          @page {
            size: A4;
            margin: 0;
          }

          @media print {
            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            body * {
              visibility: hidden;
            }

            .pdf-page,
            .pdf-page * {
              visibility: visible;
            }

            .pdf-page {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
            }

            .a4-sheet {
              width: 100% !important;
              min-height: 297mm;
              box-sizing: border-box;
              page-break-after: always;
            }

            .a4-sheet:last-child {
              page-break-after: auto;
            }

            .report-card {
              width: 100% !important;
              min-height: 297mm;
              box-sizing: border-box;
            }

            table {
              page-break-inside: avoid;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}</style>
      </Box>
    </PortalGuard>
  );
}

/* =====================================================
   TABLE STYLES
===================================================== */

const headCell = {
  border: `1px solid ${COLORS.border}`,
  fontWeight: 900,
  fontSize: 11,
  color: COLORS.text,
  padding: "7px 6px",
};

const bodyCell = {
  border: `1px solid ${COLORS.border}`,
  fontSize: 11,
  color: COLORS.text,
  padding: "7px 6px",
};
