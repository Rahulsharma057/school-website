"use client";

import PortalGuard from "@/components/PortalGuard";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  Download,
  Print,
} from "@mui/icons-material";

import { useMyResults } from "@/hooks/useResult";
import { useMyFinalResults } from "@/hooks/useFinalResult";

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

function getExamResult(results = [], category) {
  return (
    results.find(
      (item) =>
        item?.exam?.examCategory === category
    ) || null
  );
}

function getSubjectMark(examResult, subjectId) {
  if (!examResult?.marks) return null;

  return (
    examResult.marks.find(
      (item) =>
        String(
          item?.subject?._id || item?.subject
        ) === String(subjectId)
    ) || null
  );
}

function formatMarks(obtained, max) {
  return `${obtained ?? 0} / ${max ?? 0}`;
}

/*
  Some APIs return:
  1. studentName directly
  2. student object
  3. student.user object

  So we support all three.
*/

function getStudentName(finalResult) {
  return (
    finalResult?.studentName ||
    finalResult?.student?.name ||
    finalResult?.student?.user?.name ||
    "Student"
  );
}

function getFatherName(finalResult) {
  return (
    finalResult?.fatherName ||
    finalResult?.student?.fatherName ||
    finalResult?.student?.user?.fatherName ||
    "—"
  );
}

function getRollNo(finalResult) {
  return (
    finalResult?.rollNo ??
    finalResult?.rollNumber ??
    finalResult?.student?.rollNo ??
    finalResult?.student?.rollNumber ??
    "—"
  );
}

function getClassName(finalResult) {
  return (
    finalResult?.class?.className ||
    finalResult?.class?.name ||
    finalResult?.student?.class?.className ||
    finalResult?.student?.class?.name ||
    "—"
  );
}

function getSection(finalResult) {
  return (
    finalResult?.class?.section ||
    finalResult?.student?.class?.section ||
    "—"
  );
}

/* =====================================================
   REPORT CARD
===================================================== */

function ReportCard({
  finalResult,
  halfYearly,
  annual,
}) {
  const subjects = finalResult?.subjects || [];

  const halfYearlyWeightage =
    finalResult?.sourceExams?.find(
      (exam) =>
        exam.examCategory === "HALF_YEARLY"
    )?.weightage ?? 50;

  const annualWeightage =
    finalResult?.sourceExams?.find(
      (exam) =>
        exam.examCategory === "ANNUAL"
    )?.weightage ?? 50;

  const studentName =
    getStudentName(finalResult);

  const fatherName =
    getFatherName(finalResult);

  const rollNo =
    getRollNo(finalResult);

  const className =
    getClassName(finalResult);

  const section =
    getSection(finalResult);

  const classDisplay =
    className !== "—"
      ? `${className} - ${section}`
      : "—";

  return (
    <Box className="report-card">

      {/* =================================================
          SCHOOL HEADER
      ================================================= */}

      <Box
        sx={{
          textAlign: "center",
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 900,
            color: COLORS.primaryDeep,
            letterSpacing: 0.5,
          }}
        >
           Smt Sheela Gautam Inter College (Aligarh)
        </Typography>

        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 900,
            color: COLORS.text,
            mt: 0.3,
          }}
        >
          ANNUAL FINAL REPORT CARD
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: COLORS.muted,
            mt: 0.4,
          }}
        >
          Session:{" "}
          {finalResult?.academicYear || "—"}
        </Typography>
      </Box>

      <Divider
        sx={{
          mb: 2,
          borderColor: COLORS.primary,
          borderWidth: 1,
        }}
      />

      {/* =================================================
          STUDENT DETAILS
      ================================================= */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: 5,
          rowGap: 1,
          mb: 2,
        }}
      >
        <StudentInfo
          label="Student Name"
          value={studentName}
        />

        <StudentInfo
          label="Class"
          value={classDisplay}
        />

        <StudentInfo
          label="Father Name"
          value={fatherName}
        />

        <StudentInfo
          label="Roll No"
          value={rollNo}
        />
      </Box>

      {/* =================================================
          MARKS TABLE
      ================================================= */}

      <TableContainer>
        <Table
          size="small"
          sx={{
            border: `1px solid ${COLORS.border}`,
            borderCollapse: "collapse",
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#F3F4F6",
              }}
            >
              <TableCell
                rowSpan={2}
                sx={headCell}
              >
                Subject
              </TableCell>

              <TableCell
                align="center"
                sx={headCell}
              >
                Half Yearly
                <Typography
                  component="span"
                  display="block"
                  fontSize={9}
                  color={COLORS.muted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCell}
              >
                Annual
                <Typography
                  component="span"
                  display="block"
                  fontSize={9}
                  color={COLORS.muted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCell}
              >
                Final Total
                <Typography
                  component="span"
                  display="block"
                  fontSize={9}
                  color={COLORS.muted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCell}
              >
                Grade
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>

            {subjects.map(
              (subject, index) => {

                const subjectId =
                  subject?.subject;

                const halfMark =
                  getSubjectMark(
                    halfYearly,
                    subjectId
                  );

                const annualMark =
                  getSubjectMark(
                    annual,
                    subjectId
                  );

                return (
                  <TableRow
                    key={
                      subjectId ||
                      index
                    }
                  >
                    <TableCell
                      sx={{
                        ...bodyCell,
                        fontWeight: 700,
                      }}
                    >
                      {subject?.subjectName ||
                        subject
                          ?.subjectDetails
                          ?.name ||
                        "—"}
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={bodyCell}
                    >
                      {formatMarks(
                        halfMark?.marksObtained,
                        halfMark?.maxMarks
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={bodyCell}
                    >
                      {formatMarks(
                        annualMark?.marksObtained,
                        annualMark?.maxMarks
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        ...bodyCell,
                        fontWeight: 800,
                      }}
                    >
                      {formatMarks(
                        subject?.marksObtained,
                        subject?.maxMarks
                      )}
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={bodyCell}
                    >
                      <Chip
                        size="small"
                        label={
                          subject?.grade ||
                          "-"
                        }
                        sx={{
                          height: 23,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              }
            )}

            {/* TOTAL */}

            <TableRow
              sx={{
                backgroundColor:
                  "#F3F4F6",
              }}
            >
              <TableCell
                sx={{
                  ...bodyCell,
                  fontWeight: 900,
                }}
              >
                TOTAL
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...bodyCell,
                  fontWeight: 900,
                }}
              >
                {formatMarks(
                  halfYearly?.totalObtained,
                  halfYearly?.totalMax
                )}
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...bodyCell,
                  fontWeight: 900,
                }}
              >
                {formatMarks(
                  annual?.totalObtained,
                  annual?.totalMax
                )}
              </TableCell>

              <TableCell
                align="center"
                sx={{
                  ...bodyCell,
                  fontWeight: 900,
                  color:
                    COLORS.primary,
                }}
              >
                {formatMarks(
                  finalResult?.totalObtained,
                  finalResult?.totalMax
                )}
              </TableCell>

              <TableCell
                sx={bodyCell}
              />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* =================================================
          RESULT SUMMARY
      ================================================= */}

      <Box sx={{ mt: 2 }}>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns:
              "repeat(3, 1fr)",
            gap: 1,
          }}
        >
          <Summary
            label="Final Percentage"
            value={`${finalResult?.percentage ?? 0}%`}
          />

          <Summary
            label="Overall Grade"
            value={
              finalResult?.overallGrade ||
              "-"
            }
          />

          <Summary
            label="Result"
            value={
              finalResult?.status ||
              "-"
            }
            success={
              finalResult?.status ===
              "PASS"
            }
          />
        </Box>

        {/* =================================================
            WEIGHTAGE
        ================================================= */}

        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            border:
              `1px solid ${COLORS.border}`,
            backgroundColor:
              COLORS.light,
          }}
        >
          <Typography
            fontSize={11}
            fontWeight={900}
            sx={{ mb: 1 }}
          >
            EXAM WEIGHTAGE
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr 1fr",
              gap: 1,
            }}
          >
            <Weight
              label="Half Yearly"
              value={`${halfYearlyWeightage}%`}
            />

            <Weight
              label="Annual"
              value={`${annualWeightage}%`}
            />

            <Weight
              label="Total"
              value={`${Number(
                halfYearlyWeightage
              ) +
                Number(
                  annualWeightage
                )}%`}
            />
          </Box>
        </Box>
      </Box>

      {/* =================================================
          SIGNATURE
      ================================================= */}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns:
            "1fr 1fr 1fr",
          gap: 3,
          mt: 7,
          textAlign: "center",
        }}
      >
        <Box>
          <Divider />
          <Typography
            fontSize={11}
            sx={{ mt: 0.5 }}
          >
            Class Teacher
          </Typography>
        </Box>

        <Box>
          <Divider />
          <Typography
            fontSize={11}
            sx={{ mt: 0.5 }}
          >
            Principal
          </Typography>
        </Box>

        <Box>
          <Divider />
          <Typography
            fontSize={11}
            sx={{ mt: 0.5 }}
          >
            Parent / Guardian
          </Typography>
        </Box>
      </Box>

    </Box>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function StudentInfo({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        fontSize: 12,
      }}
    >
      <Typography
        component="span"
        fontSize={12}
        fontWeight={800}
      >
        {label}:
      </Typography>

      <Typography
        component="span"
        fontSize={12}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Summary({
  label,
  value,
  success = false,
}) {
  return (
    <Box
      sx={{
        border:
          `1px solid ${COLORS.border}`,
        p: 1.2,
        textAlign: "center",
      }}
    >
      <Typography
        fontSize={9}
        color={COLORS.muted}
        fontWeight={700}
      >
        {label}
      </Typography>

      <Typography
        fontSize={15}
        fontWeight={900}
        sx={{
          mt: 0.3,
          color: success
            ? COLORS.success
            : COLORS.primaryDeep,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Weight({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems: "center",
        backgroundColor: "#fff",
        p: 1,
      }}
    >
      <Typography fontSize={10}>
        {label}
      </Typography>

      <Typography
        fontSize={11}
        fontWeight={900}
        color={COLORS.primary}
      >
        {value}
      </Typography>
    </Box>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function FinalResultPdfPage() {
  const {
    data: examResults = [],
    isLoading: examLoading,
    isError: examError,
  } = useMyResults();

  const {
    data: finalResults = [],
    isLoading: finalLoading,
    isError: finalError,
  } = useMyFinalResults();

  const loading =
    examLoading || finalLoading;

  const error =
    examError || finalError;

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          p: 5,
          textAlign: "center",
        }}
      >
        <Typography
          fontWeight={800}
        >
          Unable to load result
        </Typography>
      </Box>
    );
  }

  if (
    !Array.isArray(finalResults) ||
    finalResults.length === 0
  ) {
    return (
      <Box
        sx={{
          p: 5,
          textAlign: "center",
        }}
      >
        <Typography
          fontWeight={800}
        >
          No final result available
        </Typography>
      </Box>
    );
  }

  const halfYearly =
    getExamResult(
      examResults,
      "HALF_YEARLY"
    );

  const annual =
    getExamResult(
      examResults,
      "ANNUAL"
    );

  return (
    <PortalGuard
      allowedRoles={["STUDENT"]}
    >
      <Box
        className="pdf-page"
        sx={{
          minHeight: "100vh",
          backgroundColor:
            "#E5E7EB",
          py: 3,
        }}
      >

        {/* =================================================
            DOWNLOAD BUTTONS
        ================================================= */}

        <Stack
          direction="row"
          justifyContent="center"
          spacing={1}
          className="no-print"
          sx={{ mb: 2 }}
        >
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() =>
              window.print()
            }
            sx={{
              backgroundColor:
                COLORS.primary,
              "&:hover": {
                backgroundColor:
                  COLORS.primaryDark,
              },
            }}
          >
            Download PDF
          </Button>

          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() =>
              window.print()
            }
          >
            Print
          </Button>
        </Stack>

        {/* =================================================
            A4 PAPER
        ================================================= */}

        <Box
          sx={{
            width: "210mm",
            minHeight: "297mm",
            backgroundColor: "#fff",
            mx: "auto",
            p: "12mm",
            boxSizing: "border-box",
          }}
        >
          {finalResults.map(
            (finalResult) => (
              <ReportCard
                key={
                  finalResult?._id
                }
                finalResult={
                  finalResult
                }
                halfYearly={
                  halfYearly
                }
                annual={annual}
              />
            )
          )}
        </Box>

        {/* =================================================
            PRINT CSS
        ================================================= */}

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
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
            }

            .no-print {
              display: none !important;
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