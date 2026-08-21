"use client";

import PortalGuard from "@/components/PortalGuard";

import {
  Avatar,
  Box,
  Chip,
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

import {
  EmojiEvents,
  WorkspacePremium,
  School,
} from "@mui/icons-material";

import { useMyResults } from "@/hooks/useResult";
import { useMyFinalResults } from "@/hooks/useFinalResult";

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
  success: "#166534",
  successBg: "#DCFCE7",
  danger: "#B91C1C",
  dangerBg: "#FEE2E2",
};

/* =====================================================
   HELPERS
===================================================== */

function getExamResult(results, category) {
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

function getGradeColor(grade) {
  if (!grade) {
    return {
      color: COLORS.textMuted,
      backgroundColor: "#F3F4F6",
    };
  }

  if (
    ["A+", "A", "A1"].includes(
      String(grade).toUpperCase()
    )
  ) {
    return {
      color: "#166534",
      backgroundColor: "#DCFCE7",
    };
  }

  if (
    ["B+", "B"].includes(
      String(grade).toUpperCase()
    )
  ) {
    return {
      color: "#1D4ED8",
      backgroundColor: "#DBEAFE",
    };
  }

  if (
    ["C+", "C"].includes(
      String(grade).toUpperCase()
    )
  ) {
    return {
      color: "#92400E",
      backgroundColor: "#FEF3C7",
    };
  }

  return {
    color: COLORS.danger,
    backgroundColor: COLORS.dangerBg,
  };
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
      (exam) => exam.examCategory === "HALF_YEARLY"
    )?.weightage ?? 50;

  const annualWeightage =
    finalResult?.sourceExams?.find(
      (exam) => exam.examCategory === "ANNUAL"
    )?.weightage ?? 50;

  // =====================================================
  // STUDENT DETAILS
  // =====================================================

  const studentName =
    finalResult?.studentName ||
    finalResult?.student?.name ||
    finalResult?.student?.user?.name ||
    "Student";

  const fatherName =
    finalResult?.fatherName ||
    finalResult?.student?.fatherName ||
    finalResult?.student?.user?.fatherName ||
    "—";

  const rollNo =
    finalResult?.rollNo ??
    finalResult?.rollNumber ??
    finalResult?.student?.rollNo ??
    finalResult?.student?.rollNumber ??
    "—";

  const className =
    finalResult?.class?.className ||
    finalResult?.class?.name ||
    finalResult?.student?.class?.className ||
    finalResult?.student?.class?.name ||
    "—";

  const section =
    finalResult?.class?.section ||
    finalResult?.student?.class?.section ||
    "—";

  const classDisplay =
    className !== "—"
      ? `${className} - ${section}`
      : "—";

  return (
    <Paper
      elevation={0}
      sx={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "#fff",
      }}
    >
      {/* =================================================
          REPORT CARD HEADER
      ================================================= */}

      <Box
        sx={{
          background: `linear-gradient(
            135deg,
            ${COLORS.primaryDeep},
            ${COLORS.primaryDark}
          )`,
          color: "#fff",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 2.5, md: 3 },
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
        >
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: "rgba(255,255,255,.15)",
            }}
          >
            <School />
          </Avatar>

          <Box>
            <Typography
              fontSize={{
                xs: 18,
                sm: 21,
              }}
              fontWeight={900}
            >
              ANNUAL FINAL REPORT CARD
            </Typography>

            <Typography
              sx={{
                mt: 0.3,
                color: "rgba(255,255,255,.78)",
                fontSize: 13,
              }}
            >
              Session:{" "}
              {finalResult?.academicYear || "—"}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* =================================================
          STUDENT INFORMATION
      ================================================= */}

      <Box
        sx={{
          px: { xs: 2, sm: 3, md: 4 },
          py: 2.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <InfoItem
            label="Student Name"
            value={studentName}
          />

          <InfoItem
            label="Father Name"
            value={fatherName}
          />

          <InfoItem
            label="Class / Section"
            value={classDisplay}
          />

          <InfoItem
            label="Roll No"
            value={rollNo}
          />
        </Box>
      </Box>

      <Divider />

      {/* =================================================
          MARKS TABLE
      ================================================= */}

      <TableContainer
        sx={{
          overflowX: "auto",
        }}
      >
        <Table
          sx={{
            minWidth: 720,
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor:
                  COLORS.surfaceTint,
              }}
            >
              <TableCell
                sx={{
                  ...headCellSx,
                  minWidth: 150,
                }}
              >
                Subject
              </TableCell>

              <TableCell
                align="center"
                sx={headCellSx}
              >
                Half Yearly
                <Typography
                  component="span"
                  display="block"
                  fontSize={10}
                  color={COLORS.textMuted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCellSx}
              >
                Annual
                <Typography
                  component="span"
                  display="block"
                  fontSize={10}
                  color={COLORS.textMuted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCellSx}
              >
                Final Total
                <Typography
                  component="span"
                  display="block"
                  fontSize={10}
                  color={COLORS.textMuted}
                >
                  Obt / Max
                </Typography>
              </TableCell>

              <TableCell
                align="center"
                sx={headCellSx}
              >
                Grade
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {subjects.map((subject, index) => {
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

              const gradeStyle =
                getGradeColor(
                  subject?.grade
                );

              return (
                <TableRow
                  key={
                    subjectId || index
                  }
                  hover
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color:
                        COLORS.textDark,
                    }}
                  >
                    {subject?.subjectName ||
                      subject?.subjectDetails
                        ?.name ||
                      "—"}
                  </TableCell>

                  <TableCell align="center">
                    <Typography
                      fontSize={13}
                      fontWeight={600}
                    >
                      {formatMarks(
                        halfMark?.marksObtained,
                        halfMark?.maxMarks
                      )}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Typography
                      fontSize={13}
                      fontWeight={600}
                    >
                      {formatMarks(
                        annualMark?.marksObtained,
                        annualMark?.maxMarks
                      )}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Typography
                      fontSize={13}
                      fontWeight={800}
                    >
                      {formatMarks(
                        subject?.marksObtained,
                        subject?.maxMarks
                      )}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={
                        subject?.grade || "-"
                      }
                      sx={{
                        fontWeight: 800,
                        color:
                          gradeStyle.color,
                        backgroundColor:
                          gradeStyle.backgroundColor,
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}

            {/* TOTAL */}

            <TableRow
              sx={{
                backgroundColor:
                  COLORS.surfaceTint,
              }}
            >
              <TableCell
                sx={{
                  fontWeight: 900,
                  color: COLORS.textDark,
                }}
              >
                TOTAL
              </TableCell>

              <TableCell
                align="center"
                sx={{
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
                  fontWeight: 900,
                  color: COLORS.primary,
                }}
              >
                {formatMarks(
                  finalResult?.totalObtained,
                  finalResult?.totalMax
                )}
              </TableCell>

              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Divider />

      {/* =================================================
          RESULT SUMMARY
      ================================================= */}

      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor:
            COLORS.surfaceTint,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 1.5,
          }}
        >
          <SummaryCard
            label="Final Percentage"
            value={`${finalResult?.percentage ?? 0}%`}
          />

          <SummaryCard
            label="Overall Grade"
            value={
              finalResult?.overallGrade || "-"
            }
          />

          <SummaryCard
            label="Result"
            value={
              finalResult?.status || "-"
            }
            success={
              finalResult?.status === "PASS"
            }
          />

          <SummaryCard
            label="Final Marks"
            value={`${finalResult?.totalObtained ?? 0}/${finalResult?.totalMax ?? 0}`}
          />
        </Box>

        {/* WEIGHTAGE */}

        <Box
          sx={{
            mt: 2,
            p: 1.75,
            borderRadius: 2,
            border: `1px solid ${COLORS.border}`,
            backgroundColor: "#fff",
          }}
        >
          <Typography
            fontSize={12}
            fontWeight={800}
            color={COLORS.textMuted}
            sx={{ mb: 1 }}
          >
            EXAM WEIGHTAGE
          </Typography>

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
          >
            <WeightageItem
              label="Half Yearly"
              value={`${halfYearlyWeightage}%`}
            />

            <WeightageItem
              label="Annual"
              value={`${annualWeightage}%`}
            />

            <WeightageItem
              label="Total"
              value={`${Number(halfYearlyWeightage) +
                Number(annualWeightage)}%`}
            />
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

/* =====================================================
   SMALL COMPONENTS
===================================================== */

function InfoItem({ label, value }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor:
          COLORS.surfaceTint,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Typography
        fontSize={11}
        fontWeight={700}
        color={COLORS.textMuted}
      >
        {label}
      </Typography>

      <Typography
        fontSize={14}
        fontWeight={800}
        color={COLORS.textDark}
        sx={{ mt: 0.25 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  success = false,
}) {
  return (
    <Box
      sx={{
        p: 1.75,
        borderRadius: 2,
        backgroundColor: "#fff",
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <Typography
        fontSize={11}
        fontWeight={700}
        color={COLORS.textMuted}
      >
        {label}
      </Typography>

      <Typography
        fontSize={18}
        fontWeight={900}
        color={
          success
            ? COLORS.success
            : COLORS.primaryDeep
        }
        sx={{ mt: 0.4 }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function WeightageItem({
  label,
  value,
}) {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        backgroundColor:
          COLORS.surfaceTint,
      }}
    >
      <Typography
        fontSize={13}
        fontWeight={600}
      >
        {label}
      </Typography>

      <Typography
        fontSize={13}
        fontWeight={900}
        color={COLORS.primary}
      >
        {value}
      </Typography>
    </Box>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

function ResultsContent() {
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

  const isLoading =
    examLoading || finalLoading;

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton
          variant="rounded"
          height={120}
        />

        <Skeleton
          variant="rounded"
          height={80}
        />

        <Skeleton
          variant="rounded"
          height={420}
        />
      </Stack>
    );
  }

  if (examError || finalError) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 3,
          p: 5,
          textAlign: "center",
        }}
      >
        <Avatar
          sx={{
            mx: "auto",
            mb: 1.5,
            bgcolor: COLORS.surfaceTint,
            color: COLORS.primary,
          }}
        >
          <EmojiEvents />
        </Avatar>

        <Typography fontWeight={800}>
          Unable to load final results
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Please try again later.
        </Typography>
      </Paper>
    );
  }

  if (
    !Array.isArray(finalResults) ||
    finalResults.length === 0
  ) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 3,
          textAlign: "center",
          py: 7,
          px: 2,
        }}
      >
        <Avatar
          sx={{
            mx: "auto",
            mb: 1.5,
            width: 52,
            height: 52,
            bgcolor: COLORS.surfaceTint,
            color: COLORS.primary,
          }}
        >
          <EmojiEvents />
        </Avatar>

        <Typography fontWeight={800}>
          No final results published yet
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          Your annual final report card will
          appear here once it is published.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {finalResults.map(
        (finalResult) => {
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
            <ReportCard
              key={finalResult._id}
              finalResult={finalResult}
              halfYearly={halfYearly}
              annual={annual}
            />
          );
        }
      )}
    </Stack>
  );
}

/* =====================================================
   PAGE
===================================================== */

export default function FinalResultsPage() {
  return (
    <PortalGuard
      allowedRoles={["STUDENT"]}
    >
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: COLORS.bgPage,
          px: {
            xs: 1,
            sm: 2,
            md: 3,
          },
          py: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Box
          sx={{
            maxWidth: 1100,
            mx: "auto",
          }}
        >
          {/* PAGE TITLE */}

          <Box sx={{ mb: 2.5 }}>
            <Stack
              direction="row"
              spacing={1.2}
              alignItems="center"
            >
              <Avatar
                sx={{
                  width: 38,
                  height: 38,
                  bgcolor:
                    COLORS.surfaceTint,
                  color: COLORS.primary,
                }}
              >
                <WorkspacePremium fontSize="small" />
              </Avatar>

              <Box>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 19,
                      sm: 22,
                    },
                    fontWeight: 900,
                    color:
                      COLORS.textDark,
                  }}
                >
                  My Final Results
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    color:
                      COLORS.textMuted,
                    mt: 0.2,
                  }}
                >
                  Your published annual
                  final report card
                </Typography>
              </Box>
            </Stack>
          </Box>

          <ResultsContent />
        </Box>
      </Box>
    </PortalGuard>
  );
}

/* =====================================================
   TABLE STYLES
===================================================== */

const headCellSx = {
  fontWeight: 900,
  fontSize: 12.5,
  color: COLORS.textDark,
  whiteSpace: "nowrap",
  py: 1.5,
};