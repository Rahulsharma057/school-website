"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

import {
  Alert,
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
  CloudUpload,
  DoneAll,
  Download,
  ErrorOutline,
} from "@mui/icons-material";

import { toast } from "react-toastify";

import {
  useDownloadResultTemplate,
  useBulkEnterResults,
} from "@/hooks/useResult";

const COLORS = {
  primary: "#5B21B6",
  primaryDark: "#4C1D95",
  primaryDeep: "#3B0764",
  accent: "#7C3AED",
  surfaceTint: "#FAF5FF",
  border: "#E9D5FF",
  error: "#B91C1C",
  errorSoft: "#FEF2F2",
  success: "#15803D",
  successSoft: "#F0FDF4",
};

/* =========================================================
   HELPERS
========================================================= */

const getComponents = (subject) => {
  if (Array.isArray(subject?.components) && subject.components.length > 0) {
    return subject.components;
  }

  return [
    {
      name: "Marks",
      maxMarks: Number(subject?.maxMarks || 0),
      passingMarks: Number(subject?.passingMarks || 0),
    },
  ];
};

const getSubjectMaxMarks = (subject) => {
  const components = getComponents(subject);

  return components.reduce(
    (total, component) => total + Number(component?.maxMarks || 0),
    0,
  );
};

const normalizeHeader = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

/* =========================================================
   STRICT MARK PARSER
========================================================= */

const parseMarkValue = (value) => {
  /*
    EMPTY CELL

    Excel blank:
    undefined
    null
    ""

    IMPORTANT:
    Blank is NOT zero.
  */

  if (value === undefined || value === null || String(value).trim() === "") {
    return {
      value: "",
      valid: true,
      empty: true,
    };
  }

  const stringValue = String(value).trim();

  /*
    Allowed:

    0
    10
    10.5
    0.5

    Rejected:

    abc
    10abc
    10/20
    -5
  */

  if (!/^\d+(\.\d+)?$/.test(stringValue)) {
    return {
      value,
      valid: false,
      empty: false,
    };
  }

  const number = Number(stringValue);

  if (!Number.isFinite(number)) {
    return {
      value,
      valid: false,
      empty: false,
    };
  }

  return {
    value: number,
    valid: true,
    empty: false,
  };
};

/* =========================================================
   CLAMP
========================================================= */

const clampMarks = (value, maxMarks) => {
  const number = Number(value);
  const max = Number(maxMarks);

  if (!Number.isFinite(number)) {
    return 0;
  }

  if (!Number.isFinite(max)) {
    return number;
  }

  return Math.min(Math.max(number, 0), max);
};

/* =========================================================
   FIND EXCEL COLUMN
========================================================= */

const findColumnValue = (row, subjectName, componentName) => {
  const keys = Object.keys(row);

  const subject = normalizeHeader(subjectName);

  const component = normalizeHeader(componentName);

  /*
    SIMPLE SUBJECT
  */

  if (component === "marks") {
    const simpleKey = keys.find((key) => {
      const normalizedKey = normalizeHeader(key);

      return (
        normalizedKey === subject ||
        normalizedKey.startsWith(`${subject} (`) ||
        normalizedKey === `${subject} marks` ||
        normalizedKey === `${subject} - marks`
      );
    });

    if (simpleKey) {
      return row[simpleKey];
    }
  }

  /*
    COMPONENT SUBJECT
  */

  const candidates = [
    `${subject} - ${component}`,
    `${subject}__${component}`,
    `${subject} ${component}`,
    `${subject}-${component}`,
    `${subject}:${component}`,
    `${subject} / ${component}`,
    `${subject} (${component})`,
  ];

  for (const key of keys) {
    const normalizedKey = normalizeHeader(key);

    if (
      candidates.some(
        (candidate) =>
          normalizedKey === candidate ||
          normalizedKey.startsWith(`${candidate} (`) ||
          normalizedKey.startsWith(candidate),
      )
    ) {
      return row[key];
    }
  }

  /*
    FALLBACK SEARCH
  */

  const found = keys.find((key) => {
    const normalizedKey = normalizeHeader(key);

    return normalizedKey.includes(subject) && normalizedKey.includes(component);
  });

  return found ? row[found] : "";
};

/* =========================================================
   STATUS
========================================================= */

const getStudentSubjectStatus = (row, subjectName) => {
  const subjectStatusKey = Object.keys(row).find(
    (key) => normalizeHeader(key) === normalizeHeader(`${subjectName} Status`),
  );

  if (!subjectStatusKey) {
    return "PRESENT";
  }

  const status = String(row[subjectStatusKey] ?? "")
    .trim()
    .toUpperCase();

  return status === "ABSENT" ? "ABSENT" : "PRESENT";
};

/* =========================================================
   PARSE EXCEL
========================================================= */

function parseResultExcel(file, subjects) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: false,
          sheetStubs: true,
        });

        if (!workbook.SheetNames.length) {
          throw new Error("No worksheet found in the Excel file.");
        }

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        /*
            IMPORTANT

            defval: ""
            keeps empty Excel cells as
            empty strings instead of
            dropping them.
          */

        const rows = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: true,
          blankrows: false,
        });

        if (!rows.length) {
          throw new Error("The Excel worksheet is empty.");
        }

        const records = [];

        rows.forEach((row, rowIndex) => {
          const rawStudentId =
            row["Student ID"] ?? row.studentId ?? row["studentId"];

          /*
                Ignore completely empty rows.
              */

          if (
            rawStudentId === undefined ||
            rawStudentId === null ||
            String(rawStudentId).trim() === ""
          ) {
            return;
          }

          const studentId = String(rawStudentId).trim();

          const studentName =
            row["Student Name"] ?? row.studentName ?? "Unknown Student";

          const rollNumber =
            row["Roll No"] ?? row["Roll Number"] ?? row.rollNumber ?? "";

          const marks = subjects.map((subject) => {
            const components = getComponents(subject);

            const status = getStudentSubjectStatus(row, subject.subjectName);

            const componentMarks = components.map((component) => {
              const rawValue = findColumnValue(
                row,
                subject.subjectName,
                component.name,
              );

              const parsed = parseMarkValue(rawValue);

              return {
                component: component.name,

                /*
                              VERY IMPORTANT

                              Empty:
                              ""

                              Explicit 0:
                              0

                              10:
                              10

                              Invalid:
                              original value
                            */

                marksObtained: parsed.valid ? parsed.value : rawValue,

                _rowNumber: rowIndex + 2,

                _valid: parsed.valid,

                _empty: parsed.empty,
              };
            });

            return {
              subject: subject.subject,

              status,

              components: componentMarks,
            };
          });

          records.push({
            studentId,

            rollNumber,

            studentName: String(studentName).trim(),

            marks,
          });
        });

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read the Excel file."));

    reader.readAsArrayBuffer(file);
  });
}

/* =========================================================
   VALIDATE MARKS
========================================================= */

function findMarksProblems(records, subjects) {
  const problems = [];

  const seenStudentIds = new Set();

  records.forEach((record) => {
    const studentId = String(record.studentId || "")
      .trim()
      .toLowerCase();

    /*
      DUPLICATE STUDENT ID
    */

    if (studentId) {
      if (seenStudentIds.has(studentId)) {
        problems.push({
          type: "duplicate",

          student: record.studentName || record.studentId,

          studentId: record.studentId,

          message: "Duplicate Student ID found.",
        });
      }

      seenStudentIds.add(studentId);
    }

    /*
      SUBJECT MARKS
    */

    record.marks?.forEach((mark) => {
      const subject = subjects.find((item) => item.subject === mark.subject);

      if (!subject) {
        return;
      }

      const components = getComponents(subject);

      mark.components?.forEach((component) => {
        const definition = components.find(
          (item) => item.name === component.component,
        );

        if (!definition) {
          problems.push({
            type: "component",

            student: record.studentName || record.studentId,

            subject: mark.subject,

            component: component.component,

            value: component.marksObtained,

            max: 0,

            message: "Component does not exist.",
          });

          return;
        }

        const rawValue = component.marksObtained;

        const parsed = parseMarkValue(rawValue);

        /*
              EMPTY IS VALID

              Do NOT convert it to 0.
            */

        if (parsed.empty) {
          return;
        }

        /*
              INVALID VALUE
            */

        if (!parsed.valid) {
          problems.push({
            type: "invalid",

            student: record.studentName || record.studentId,

            subject: mark.subject,

            component: component.component,

            value: rawValue,

            max: Number(definition.maxMarks || 0),

            message: "Marks must be a valid number.",
          });

          return;
        }

        const value = Number(parsed.value);

        const max = Number(definition.maxMarks || 0);

        /*
              NEGATIVE
            */

        if (value < 0) {
          problems.push({
            type: "range",

            student: record.studentName || record.studentId,

            subject: mark.subject,

            component: component.component,

            value,

            max,

            message: "Marks cannot be negative.",
          });

          return;
        }

        /*
              GREATER THAN MAX
            */

        if (value > max) {
          problems.push({
            type: "range",

            student: record.studentName || record.studentId,

            subject: mark.subject,

            component: component.component,

            value,

            max,

            message: "Marks exceed maximum marks.",
          });
        }
      });
    });
  });

  return problems;
}

/* =========================================================
   SANITIZE RECORDS
========================================================= */

function sanitizeRecords(records, subjects) {
  return records.map((record) => ({
    studentId: String(record.studentId).trim(),
    rollNumber: record.rollNumber ? String(record.rollNumber).trim() : "",
    studentName: record.studentName || "",

    marks: subjects.map((subject) => {
      const existing = record.marks?.find(
        (item) => item.subject === subject.subject
      );

      const status = existing?.status === "ABSENT" ? "ABSENT" : "PRESENT";

      const hasRealComponents =
        Array.isArray(subject.components) && subject.components.length > 0;

      const resolvedComponents = getComponents(subject).map((component) => {
        const existingComponent = existing?.components?.find(
          (item) => item.component === component.name
        );

        if (status === "ABSENT") {
          return { component: component.name, marksObtained: 0 };
        }

        const parsed = parseMarkValue(existingComponent?.marksObtained);

        if (parsed.empty) {
          return { component: component.name, marksObtained: "" };
        }

        if (parsed.valid) {
          return {
            component: component.name,
            marksObtained: clampMarks(parsed.value, component.maxMarks),
          };
        }

        return { component: component.name, marksObtained: "" };
      });

      if (hasRealComponents) {
        // Backend expects nested components for real multi-component subjects
        return { subject: subject.subject, status, components: resolvedComponents };
      }

      // Backend expects a FLAT marksObtained for simple (no-component) subjects
      const simpleValue = resolvedComponents[0]?.marksObtained ?? "";

      return {
        subject: subject.subject,
        status,
        ...(status === "ABSENT"
          ? { marksObtained: 0 }
          : simpleValue === ""
            ? {}
            : { marksObtained: simpleValue }),
        // keep components too, so the preview table (which reads mark.components)
        // still works — backend just ignores this extra field for simple subjects
        components: resolvedComponents,
      };
    }),
  }));
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ExcelResultImportExport({
  examId,
  examName,
  subjects = [],
}) {
  const [records, setRecords] = useState([]);

  const [parseError, setParseError] = useState("");

  const [validationProblems, setValidationProblems] = useState([]);

  const { mutate: downloadTemplate, isPending: isDownloading } =
    useDownloadResultTemplate();

  const { mutate: importResults, isPending: isImporting } =
    useBulkEnterResults();

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setParseError("");
    setValidationProblems([]);
    setRecords([]);

    try {
      if (!subjects.length) {
        throw new Error("No subjects found for this exam.");
      }

      const validExtensions = ["xlsx", "xls"];

      const extension = file.name.split(".").pop()?.toLowerCase();

      if (!validExtensions.includes(extension)) {
        throw new Error("Please upload an Excel file (.xlsx or .xls).");
      }

      const parsed = await parseResultExcel(file, subjects);

      if (!parsed.length) {
        throw new Error(
          "No valid students found. Make sure the Student ID column is present.",
        );
      }

      /*
        VALIDATE BEFORE SANITIZE

        This prevents:
        120 -> 100
        -5 -> 0
        abc -> 0
      */

      const problems = findMarksProblems(parsed, subjects);

      if (problems.length) {
        setValidationProblems(problems);

        const first = problems[0];

        let message;

        if (first.type === "duplicate") {
          message = `${first.student} — Student ID ${first.studentId} is duplicated.`;
        } else {
          message = `${first.student} — ${first.subject} / ${first.component}: ${first.value}/${first.max}. ${first.message}`;
        }

        toast.error(message);

        setParseError(`Upload rejected. ${message}`);

        return;
      }

      /*
        SANITIZE AFTER VALIDATION
      */

      const safeRecords = sanitizeRecords(parsed, subjects);

      setRecords(safeRecords);

      toast.success(
        `${safeRecords.length} student records loaded successfully.`,
      );
    } catch (error) {
      console.error("Excel import error:", error);

      const message = error?.message || "Could not read Excel file.";

      setParseError(message);

      toast.error(message);
    } finally {
      event.target.value = "";
    }
  };

  /* =======================================================
     CONFIRM IMPORT
  ======================================================= */

  const handleConfirmImport = () => {
    if (!records.length) {
      toast.error("No records available for import.");

      return;
    }

    /*
        Final sanitize
      */

    const safeRecords = sanitizeRecords(records, subjects);

    /*
        Final validation
      */

    const problems = findMarksProblems(safeRecords, subjects);

    if (problems.length) {
      const first = problems[0];

      toast.error(`${first.student} — ${first.message || "Invalid marks"}`);

      setValidationProblems(problems);

      return;
    }

    /*
        COMPLETE SUBJECT STRUCTURE
      */

    const payloadSubjects = subjects.map((subject) => ({
      subject: subject.subject,

      maxMarks: getSubjectMaxMarks(subject),

      passingMarks: Number(subject.passingMarks || 0),

      components: getComponents(subject).map((component) => ({
        name: component.name,

        maxMarks: Number(component.maxMarks || 0),

        passingMarks: Number(component.passingMarks || 0),
      })),
    }));

    importResults(
      {
        examId,

        records: safeRecords,

        subjects: payloadSubjects,
      },
      {
        onSuccess: () => {
          setRecords([]);
          setValidationProblems([]);
          setParseError("");

          toast.success("Results imported successfully.");
        },

        onError: (error) => {
          console.error("Bulk result import error:", error);

          toast.error(
            error?.response?.data?.message || "Failed to import results.",
          );
        },
      },
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2.5,

        border: `1px solid ${COLORS.border}`,

        borderRadius: 3,

        overflow: "hidden",

        backgroundColor: "#fff",
      }}
    >
      {/* HEADER */}

      <Box
        sx={{
          px: {
            xs: 1.5,
            sm: 2,
          },

          py: 1.5,

          background: `linear-gradient(135deg, ${COLORS.primaryDeep}, ${COLORS.primary})`,

          color: "#fff",
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CloudUpload />

          <Box>
            <Typography fontSize={14} fontWeight={800}>
              Excel Import / Export
            </Typography>

            <Typography
              fontSize={11}
              sx={{
                opacity: 0.8,
              }}
            >
              Upload marks using the downloaded template
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          p: {
            xs: 1.5,
            sm: 2,
          },
        }}
      >
        {/* ACTIONS */}

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.2}
          sx={{
            mb: records.length || parseError ? 2 : 0,
          }}
        >
          <Button
            fullWidth
            variant="outlined"
            startIcon={
              isDownloading ? <CircularProgress size={17} /> : <Download />
            }
            onClick={() =>
              downloadTemplate({
                examId,
                examName,
              })
            }
            disabled={isDownloading || !examId}
            sx={{
              textTransform: "none",

              fontWeight: 700,

              color: COLORS.primary,

              borderColor: COLORS.border,

              borderRadius: 2,

              "&:hover": {
                borderColor: COLORS.primary,

                backgroundColor: COLORS.surfaceTint,
              },
            }}
          >
            {isDownloading ? "Preparing..." : "Download Template"}
          </Button>

          <Button
            fullWidth
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
            disabled={!subjects.length}
            sx={{
              textTransform: "none",

              fontWeight: 700,

              borderRadius: 2,

              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,

              boxShadow: "none",

              "&:hover": {
                background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryDeep})`,

                boxShadow: "none",
              },
            }}
          >
            Upload Filled Excel
            <input
              hidden
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </Button>
        </Stack>

        {/* ERROR */}

        {parseError && (
          <Alert
            severity="error"
            icon={<ErrorOutline />}
            sx={{
              mb: 2,

              borderRadius: 2,

              backgroundColor: COLORS.errorSoft,
            }}
          >
            {parseError}
          </Alert>
        )}

        {/* INVALID DETAILS */}

        {validationProblems.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              mb: 2,

              p: 1.5,

              borderRadius: 2,

              border: "1px solid #FECACA",

              backgroundColor: COLORS.errorSoft,
            }}
          >
            <Typography
              fontSize={13}
              fontWeight={800}
              color={COLORS.error}
              sx={{
                mb: 1,
              }}
            >
              Invalid Excel Data
            </Typography>

            <Stack
              spacing={0.5}
              sx={{
                maxHeight: 180,

                overflow: "auto",
              }}
            >
              {validationProblems.slice(0, 20).map((problem, index) => {
                if (problem.type === "duplicate") {
                  return (
                    <Typography key={index} fontSize={12} color={COLORS.error}>
                      {problem.student} — Student ID {problem.studentId} is
                      duplicated.
                    </Typography>
                  );
                }

                return (
                  <Typography key={index} fontSize={12} color={COLORS.error}>
                    {problem.student} — {problem.subject}
                    {" / "}
                    {problem.component}: {problem.value}/{problem.max} —{" "}
                    {problem.message}
                  </Typography>
                );
              })}

              {validationProblems.length > 20 && (
                <Typography fontSize={11} color={COLORS.error}>
                  +{validationProblems.length - 20} more errors
                </Typography>
              )}
            </Stack>
          </Paper>
        )}

        {/* PREVIEW */}

        {records.length > 0 && (
          <>
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
              justifyContent="space-between"
              spacing={1}
              sx={{
                mb: 1.5,
              }}
            >
              <Chip
                size="small"
                icon={<DoneAll />}
                label={`${records.length} student${
                  records.length === 1 ? "" : "s"
                } ready`}
                sx={{
                  width: "fit-content",

                  backgroundColor: COLORS.successSoft,

                  color: COLORS.success,

                  fontWeight: 800,
                }}
              />

              <Button
                variant="contained"
                startIcon={
                  isImporting ? (
                    <CircularProgress size={17} color="inherit" />
                  ) : (
                    <DoneAll />
                  )
                }
                onClick={handleConfirmImport}
                disabled={isImporting}
                sx={{
                  textTransform: "none",

                  fontWeight: 800,

                  borderRadius: 2,

                  background: COLORS.primary,

                  "&:hover": {
                    background: COLORS.primaryDark,
                  },
                }}
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </Button>
            </Stack>

            <Divider
              sx={{
                mb: 1.5,
              }}
            />

            <TableContainer
              sx={{
                maxHeight: 360,

                border: "1px solid #E5E7EB",

                borderRadius: 2,

                overflowX: "auto",
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 800,

                        backgroundColor: COLORS.surfaceTint,

                        minWidth: 180,
                      }}
                    >
                      Student
                    </TableCell>

                    {subjects.map((subject) => {
                      const maxMarks = getSubjectMaxMarks(subject);

                      return (
                        <TableCell
                          key={subject.subject}
                          align="center"
                          sx={{
                            fontWeight: 800,

                            backgroundColor: COLORS.surfaceTint,

                            whiteSpace: "nowrap",
                          }}
                        >
                          {subject.subject}

                          <Typography
                            component="span"
                            sx={{
                              display: "block",

                              fontSize: 10,

                              color: "#6B7280",
                            }}
                          >
                            max {maxMarks}
                          </Typography>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.studentId} hover>
                      <TableCell>
                        <Typography fontSize={12.5} fontWeight={700}>
                          {record.studentName}
                        </Typography>

                        <Typography fontSize={10.5} color="text.secondary">
                          ID: {record.studentId}
                        </Typography>

                        {record.rollNumber && (
                          <Typography fontSize={10.5} color="text.secondary">
                            Roll: {record.rollNumber}
                          </Typography>
                        )}
                      </TableCell>

                      {record.marks.map((mark) => {
                        /*
                              Check whether
                              at least one
                              component has
                              actual marks.

                              Blank subject =
                              blank preview.
                            */

                        const hasMarks = mark.components?.some(
                          (component) =>
                            component.marksObtained !== "" &&
                            component.marksObtained !== null &&
                            component.marksObtained !== undefined,
                        );

                        const total = hasMarks
                          ? mark.components.reduce(
                              (sum, component) =>
                                sum + Number(component.marksObtained || 0),
                              0,
                            )
                          : "";

                        return (
                          <TableCell key={mark.subject} align="center">
                            <Chip
                              size="small"
                              label={
                                mark.status === "ABSENT"
                                  ? "ABSENT"
                                  : total === ""
                                    ? "—"
                                    : total
                              }
                              color={
                                mark.status === "ABSENT" ? "error" : "default"
                              }
                              variant={
                                total === "" && mark.status !== "ABSENT"
                                  ? "outlined"
                                  : "filled"
                              }
                              sx={{
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Box>
    </Paper>
  );
}
