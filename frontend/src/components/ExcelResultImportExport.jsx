"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import { toast } from "react-toastify";
import { CloudUpload, DoneAll, Download } from "@mui/icons-material";
import { useDownloadResultTemplate, useBulkEnterResults } from "@/hooks/useResult";

const COLORS = {
  primary: "#5B21B6",
  primaryDark: "#4C1D95",
  primaryDeep: "#3B0764",
  accent: "#7C3AED",
  surfaceTint: "#FAF5FF",
  border: "#E9D5FF",
  error: "#B91C1C",
  errorSoft: "#FEF2F2",
};

function parseResultExcel(file, subjects) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const records = rows
          .filter((row) => row["Student ID"])
          .map((row) => ({
            studentId: String(row["Student ID"]).trim(),
            rollNumber: row["Roll No"],
            studentName: row["Student Name"],
            marks: subjects.map((s) => {
              const matchKey = Object.keys(row).find((k) => k.startsWith(s.subject));
              return {
                subject: s.subject,
                marksObtained: Number(row[matchKey]) || 0,
              };
            }),
          }));

        resolve(records);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsArrayBuffer(file);
  });
}

// Checks every parsed row against each subject's maxMarks. Returns a list
// of problems (empty = all good) so the caller can block the preview/
// import entirely rather than letting an out-of-range value slip through.
function findMarksExceedingMax(records, subjects) {
  const maxBySubject = new Map(subjects.map((s) => [s.subject, s.maxMarks]));
  const problems = [];

  records.forEach((record) => {
    record.marks.forEach((m) => {
      const max = maxBySubject.get(m.subject);
      if (max === undefined) return;

      const value = Number(m.marksObtained);

      if (Number.isNaN(value) || value < 0 || value > max) {
        problems.push({
          student: record.studentName || record.studentId,
          subject: m.subject,
          value: m.marksObtained,
          max,
        });
      }
    });
  });

  return problems;
}

export default function ExcelResultImportExport({ examId, examName, subjects }) {
  const [records, setRecords] = useState([]);
  const [parseError, setParseError] = useState("");

  const { mutate: downloadTemplate, isPending: isDownloading } = useDownloadResultTemplate();
  const { mutate: importResults, isPending: isImporting } = useBulkEnterResults();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError("");
    setRecords([]);

    try {
      const parsed = await parseResultExcel(file, subjects);

      if (!parsed.length) {
        setParseError("No valid rows found. Make sure Student ID column is filled.");
        return;
      }

      // Block right here — invalid rows never even make it to the preview
      // table, let alone the "Confirm Import" button.
      const problems = findMarksExceedingMax(parsed, subjects);

      if (problems.length > 0) {
        const first = problems[0];

        const message =
          problems.length === 1
            ? `${first.student} — ${first.subject}: ${first.value} exceeds max marks (${first.max})`
            : `${problems.length} entries exceed their subject's max marks (e.g. ${first.student} — ${first.subject}: ${first.value}/${first.max})`;

        toast.error(message);
        setParseError(`Upload rejected: ${message}. Fix the Excel file and re-upload.`);
        return;
      }

      setRecords(parsed);
    } catch {
      setParseError("Could not read this file. Please upload the downloaded template only.");
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmImport = () => {
    importResults(
      { examId, records, subjects },
      { onSuccess: () => setRecords([]) }
    );
  };

  return (
    <Paper elevation={0} sx={{ mb: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: 2.5, overflow: "hidden", backgroundColor: "#fff" }}>
      <Box
        sx={{
          px: 2,
          py: 1.25,
          background: `linear-gradient(90deg, ${COLORS.primaryDeep}, ${COLORS.primaryDark})`,
          color: "#fff",
        }}
      >
        <Typography fontSize={14} fontWeight={800}>Excel Import / Export</Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: records.length ? 2 : 0 }}>
          <Button
            variant="outlined"
            startIcon={<Download sx={{ fontSize: 18 }} />}
            onClick={() => downloadTemplate({ examId, examName })}
            disabled={isDownloading}
            sx={{ textTransform: "none", fontWeight: 700, color: COLORS.primary, borderColor: COLORS.border }}
          >
            {isDownloading ? "Preparing..." : "Download Template"}
          </Button>

          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUpload sx={{ fontSize: 18 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.primaryDark})`,
              boxShadow: "none",
            }}
          >
            Upload Filled Excel
            <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
          </Button>
        </Stack>

        {parseError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, backgroundColor: COLORS.errorSoft, color: COLORS.error }}>
            {parseError}
          </Alert>
        )}

        {records.length > 0 && (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Chip
                size="small"
                label={`${records.length} row${records.length === 1 ? "" : "s"} ready to import`}
                sx={{ backgroundColor: COLORS.surfaceTint, color: COLORS.primaryDark, fontWeight: 700 }}
              />
              <Button
                size="small"
                variant="contained"
                startIcon={<DoneAll sx={{ fontSize: 16 }} />}
                onClick={handleConfirmImport}
                disabled={isImporting}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  background: `linear-gradient(135deg, ${COLORS.primaryDeep}, ${COLORS.primary})`,
                  boxShadow: "none",
                }}
              >
                {isImporting ? "Importing..." : "Confirm Import"}
              </Button>
            </Stack>

            <Divider sx={{ mb: 1.5 }} />

            <TableContainer sx={{ maxHeight: 320, overflowY: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: COLORS.surfaceTint }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: 12.5 }}>Student</TableCell>
                    {subjects.map((s) => (
                      <TableCell key={s.subject} sx={{ fontWeight: 800, fontSize: 12.5 }}>
                        {s.subject}
                        <Typography component="span" sx={{ display: "block", fontWeight: 500, fontSize: 10.5, color: "#6B7280" }}>
                          max {s.maxMarks}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.studentId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{r.studentName}</TableCell>
                      {r.marks.map((m) => (
                        <TableCell key={m.subject}>{m.marksObtained}</TableCell>
                      ))}
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
