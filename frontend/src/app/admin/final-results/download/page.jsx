"use client";

import { Fragment, useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
  School,
  Refresh,
  AutoAwesome,
  TableChart,
} from "@mui/icons-material";

import jsPDF from "jspdf";
// npm install exceljs
import ExcelJS from "exceljs";

import PortalGuard from "@/components/PortalGuard";

import { useClasses } from "@/hooks/useClasses";

import {
  useClassFinalResults,
  useGenerateSchoolFinalResult,
} from "@/hooks/useFinalResult";

export default function FinalResultDownloadPage() {
  // =====================================================
  // SCHOOL IDENTITY — shared by the on-screen/print header and Excel export
  // =====================================================

  const SCHOOL_NAME = "Smt Sheela Gautam Inter College";
  // =====================================================
  // STATE
  // =====================================================

  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // =====================================================
  // CLASSES
  // =====================================================

  const { data: classes = [], isLoading: classesLoading } = useClasses();

  // =====================================================
  // FINAL RESULTS
  // =====================================================

  const {
    data: results = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useClassFinalResults({ classId, academicYear });

  // =====================================================
  // GENERATE FINAL RESULT
  // =====================================================

  const {
    mutate: generateSchoolFinalResult,
    isPending: isGenerating,
  } = useGenerateSchoolFinalResult();

  // =====================================================
  // SOURCE EXAMS (e.g. "Half Yearly", "Annual")
  // These become the sub-columns under every subject, in the
  // same order as they were configured to contribute to the
  // final result.
  // =====================================================

  const examColumns = useMemo(() => {
    const first = results.find(
      (item) =>
        Array.isArray(item.sourceExams) &&
        item.sourceExams.length > 0
    );

    return first?.sourceExams || [];
  }, [results]);

  // =====================================================
  // SUBJECT NAME HELPER
  // =====================================================

  const getSubjectName = (subject) =>
    (typeof subject?.subject === "object"
      ? subject.subject?.name || subject.subject?.subjectName
      : subject?.subject) || "Subject";

  // =====================================================
  // EXAM NAME ABBREVIATION — the header columns are too narrow
  // for full exam names ("Half Yearly", "Annual"), so shorten
  // them to fixed 3-4 letter tags for both screen and print.
  // =====================================================

  const EXAM_NAME_ABBREVIATIONS = {
    "half yearly": "Half",
    "half-yearly": "Half",
    "halfyearly": "Half",
    annual: "Anu",
    "final exam": "Fin",
    final: "Fin",
    "unit test": "UT",
    quarterly: "Qtr",
    "pre-board": "PreB",
    preboard: "PreB",
    "term 1": "T1",
    "term 2": "T2",
  };

  const abbreviateExamName = (name) => {
    const key = String(name || "").trim().toLowerCase();
    if (EXAM_NAME_ABBREVIATIONS[key]) return EXAM_NAME_ABBREVIATIONS[key];
    return String(name || "").trim().slice(0, 4);
  };

  // =====================================================
  // SUBJECT COLUMNS — pivoted from exam-wise data.
  // Report-card format needs SUBJECT as the primary column
  // group (Hindi, English, Maths ...), with one sub-column per
  // exam (Half Yearly, Annual ...) plus a Total and % for that
  // subject — mirroring the uploaded Excel mark-sheet.
  //
  // ASSUMPTION: each result.examResults[i].subjects[j] carries
  // { subject, marksObtained, maxMarks } and result.examResults[i]
  // carries an examId matching sourceExams[i]._id. Subjects are
  // matched across exams by name. Adjust the matching key below
  // if your backend instead exposes a stable subjectId.
  // =====================================================

  const subjectColumns = useMemo(() => {
    const order = [];
    const byName = new Map();

    results.forEach((result) => {
      (result.examResults || []).forEach((examResult) => {
        (examResult.subjects || []).forEach((subject) => {
          const name = getSubjectName(subject);

          if (!byName.has(name)) {
            byName.set(name, { name, examMax: {} });
            order.push(name);
          }

          const entry = byName.get(name);

          if (entry.examMax[examResult.examId] == null) {
            entry.examMax[examResult.examId] =
              Number(subject.maxMarks) || 0;
          }
        });
      });
    });

    return order.map((name) => {
      const entry = byName.get(name);
      const totalMax = examColumns.reduce(
        (sum, exam) => sum + (entry.examMax[exam._id] || 0),
        0
      );
      return { ...entry, totalMax };
    });
  }, [results, examColumns]);

  // =====================================================
  // PER-STUDENT SUBJECT MARKS LOOKUP
  // Returns, for a given result + subject, the marks obtained
  // per exam plus the subject total/max/percentage.
  // =====================================================

  const getSubjectMarks = (result, subjectColumn) => {
    const perExam = examColumns.map((exam) => {
      const examResult = result.examResults?.find(
        (item) => String(item.examId) === String(exam._id)
      );

      const subject = examResult?.subjects?.find(
        (item) => getSubjectName(item) === subjectColumn.name
      );

      return {
        examId: exam._id,
        obtained: subject ? Number(subject.marksObtained) || 0 : null,
        max:
          subject && subject.maxMarks != null
            ? Number(subject.maxMarks) || 0
            : subjectColumn.examMax[exam._id] || 0,
      };
    });

    const obtainedTotal = perExam.reduce(
      (sum, item) => sum + (item.obtained ?? 0),
      0
    );

    const maxTotal =
      subjectColumn.totalMax ||
      perExam.reduce((sum, item) => sum + item.max, 0);

    const percentage = maxTotal > 0 ? (obtainedTotal / maxTotal) * 100 : 0;

    return { perExam, obtainedTotal, maxTotal, percentage };
  };

  // =====================================================
  // RANK — use backend-provided rank if present, otherwise
  // compute a dense rank client-side from percentage (ties
  // share the same rank, matching typical mark-sheet convention).
  // =====================================================

  const rankByResultKey = useMemo(() => {
    const keyOf = (r) => r._id || r.student?._id;

    const hasBackendRank = results.some((r) => r.rank != null);
    if (hasBackendRank) {
      const map = new Map();
      results.forEach((r) => map.set(keyOf(r), r.rank));
      return map;
    }

    const sorted = [...results].sort(
      (a, b) => (Number(b.percentage) || 0) - (Number(a.percentage) || 0)
    );

    const map = new Map();
    let rank = 0;
    let prevPercentage = null;
    let position = 0;

    sorted.forEach((r) => {
      position += 1;
      const pct = Number(r.percentage) || 0;
      if (pct !== prevPercentage) {
        rank = position;
        prevPercentage = pct;
      }
      map.set(keyOf(r), rank);
    });

    return map;
  }, [results]);

  // =====================================================
  // ACADEMIC YEARS
  // =====================================================

  const academicYears = [
    "2024-2025",
    "2025-2026",
    "2026-2027",
    "2027-2028",
  ];

  // =====================================================
  // SELECTED CLASS
  // =====================================================

  const selectedClass = useMemo(() => {
    return classes.find((item) => String(item._id) === String(classId));
  }, [classes, classId]);

  // =====================================================
  // COMBINED EXAMS
  // =====================================================

  const combinedExamNames = useMemo(() => {
    const firstWithExams = results.find(
      (item) => Array.isArray(item.sourceExams) && item.sourceExams.length
    );

    if (!firstWithExams) return "";

    return firstWithExams.sourceExams
      .map((exam) => exam.examName)
      .filter(Boolean)
      .join(" + ");
  }, [results]);

  // =====================================================
  // GENERATE
  // =====================================================

  const handleGenerate = () => {
    if (!classId) return;
    if (!academicYear) return;

    generateSchoolFinalResult(
      { classId, academicYear },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  // =====================================================
  // BUILD MARK-SHEET FILE NAME — shared by PDF / Excel
  // =====================================================

  const buildFileName = (ext) =>
    `final-result-${selectedClass?.className || "class"}${
      selectedClass?.section ? `-${selectedClass.section}` : ""
    }-${academicYear}.${ext}`;

  // =====================================================
  // DIRECT PDF DOWNLOAD — built natively with jsPDF-AutoTable (vector
  // text + lines), NOT a canvas screenshot. A screenshot-based PDF has to
  // rasterize the whole wide mark-sheet into one giant canvas, which hits
  // browser canvas size limits as soon as there are many subjects/exams
  // (that's what caused the earlier "wrong PNG signature" errors). AutoTable
  // has no such limit — however wide the table gets, it just keeps adding
  // page breaks, and can even auto-split columns across pages while
  // repeating the Sr/Name/Father columns on every continuation page (like
  // frozen columns in Excel). Text stays crisp and selectable too.
  // npm install jspdf-autotable
  // =====================================================

  const drawPdfReportHeader = (pdf, pageWidth) => {
    let y = 10;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.text(SCHOOL_NAME, pageWidth / 2, y, { align: "center" });

    y += 5.5;
    pdf.setFontSize(10.5);
    pdf.text("FINAL RESULT REPORT", pageWidth / 2, y, { align: "center" });

    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    const classLine = `${selectedClass?.className || "Class"}${
      selectedClass?.section ? ` - ${selectedClass.section}` : ""
    }   |   Academic Year: ${academicYear}`;
    pdf.text(classLine, pageWidth / 2, y, { align: "center" });

    if (combinedExamNames) {
      y += 4;
      pdf.setFontSize(7.5);
      pdf.text(`Examinations: ${combinedExamNames}`, pageWidth / 2, y, { align: "center" });
    }

    return y + 3;
  };

  const handleDownload = async () => {
    if (!results.length) return;

    setIsDownloadingPdf(true);

    try {
      const { default: autoTable } = await import("jspdf-autotable");

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const startY = drawPdfReportHeader(pdf, pageWidth);

      const blockWidth = examColumns.length + 1;

      // ---- Colors mirrored from the on-screen table
      const C = {
        headerGray: [243, 244, 246],
        subjectHeader: [237, 233, 254],
        examSubHeader: [245, 243, 255],
        trailHeader: [220, 252, 231],
        subjectTotalBody: [250, 245, 255],
        trailBody: [240, 253, 244],
        pass: [220, 252, 231],
        compartment: [254, 249, 195],
        fail: [254, 226, 226],
      };

      // ---- 3-row header, using colSpan/rowSpan just like the on-screen table
      const head = [
        [
          { content: "Sr.", rowSpan: 3, styles: { fillColor: C.headerGray, halign: "center" } },
          { content: "Student Name", rowSpan: 3, styles: { fillColor: C.headerGray, halign: "left" } },
          { content: "Father Name", rowSpan: 3, styles: { fillColor: C.headerGray, halign: "left" } },
          ...subjectColumns.map((subject) => ({
            content: subject.name,
            colSpan: blockWidth,
            styles: { fillColor: C.subjectHeader, halign: "center" },
          })),
          { content: "Total", rowSpan: 3, styles: { fillColor: C.trailHeader } },
          { content: "%", rowSpan: 3, styles: { fillColor: C.trailHeader } },
          { content: "Grade", rowSpan: 3, styles: { fillColor: C.trailHeader } },
          { content: "Status", rowSpan: 3, styles: { fillColor: C.trailHeader } },
        ],
        [
          ...subjectColumns.flatMap(() => [
            ...examColumns.map((exam) => ({
              content: abbreviateExamName(exam.examName),
              styles: { fillColor: C.examSubHeader, fontSize: 6.5 },
            })),
            { content: "Total", styles: { fillColor: C.subjectHeader, fontSize: 6.5 } },
          ]),
        ],
        [
          ...subjectColumns.flatMap((subject) => [
            ...examColumns.map((exam) => ({
              content: String(subject.examMax[exam._id] ?? ""),
              styles: { fillColor: C.examSubHeader, fontSize: 6, textColor: [110, 110, 110] },
            })),
            {
              content: String(subject.totalMax || ""),
              styles: { fillColor: C.subjectHeader, fontSize: 6, textColor: [110, 110, 110] },
            },
          ]),
        ],
      ];

      // ---- Body rows
      const body = results.map((result, index) => {
        const status = String(result.status || "").toUpperCase();
        const statusColor =
          status === "PASS"
            ? C.pass
            : status === "COMPARTMENT"
            ? C.compartment
            : status === "FAIL"
            ? C.fail
            : C.trailBody;

        const row = [
          index + 1,
          `${result.student?.name || "Student"}${
            result.student?.rollNumber ? ` (Roll: ${result.student.rollNumber})` : ""
          }`,
          result.fatherName || result.student?.fatherName || "—",
        ];

        subjectColumns.forEach((subject) => {
          const { perExam, obtainedTotal } = getSubjectMarks(result, subject);
          perExam.forEach((item) => row.push(item.obtained != null ? item.obtained : "—"));
          row.push({ content: obtainedTotal, styles: { fillColor: C.subjectTotalBody, fontStyle: "bold" } });
        });

        row.push(
          { content: `${result.totalObtained ?? 0}/${result.totalMax ?? 0}`, styles: { fillColor: C.trailBody, fontStyle: "bold" } },
          { content: `${Number(result.percentage || 0).toFixed(1)}%`, styles: { fillColor: C.trailBody, fontStyle: "bold" } },
          { content: result.overallGrade || "—", styles: { fillColor: C.trailBody, fontStyle: "bold" } },
          { content: status || "—", styles: { fillColor: statusColor, fontStyle: "bold" } }
        );

        return row;
      });

      autoTable(pdf, {
        head,
        body,
        startY,
        theme: "grid",
        styles: {
          font: "helvetica",
          fontSize: 6.5,
          cellPadding: 0.9,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          valign: "middle",
          halign: "center",
          textColor: [0, 0, 0],
          overflow: "linebreak",
        },
        headStyles: { fontStyle: "bold", halign: "center" },
        columnStyles: {
          1: { halign: "left", cellWidth: 30 },
          2: { halign: "left", cellWidth: 24 },
        },
        // FIX ("how to download PDF of such a big table"): this is the key
        // option — instead of trying to cram every column onto one page (or
        // rasterizing it, which breaks on very wide tables), AutoTable
        // splits the columns themselves across as many pages as needed.
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: [0, 1, 2], // repeat Sr / Name / Father columns on every continuation page
        margin: { top: startY, left: 6, right: 6, bottom: 8 },
        didDrawPage: (data) => {
          // Re-draw the school header on every new page (first page already
          // has it from startY; continuation pages start fresh at the top).
          if (data.pageNumber > 1) {
            drawPdfReportHeader(pdf, pageWidth);
          }
          const pageCount = pdf.internal.getNumberOfPages();
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7);
          pdf.setTextColor(120, 120, 120);
          pdf.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - 6,
            pdf.internal.pageSize.getHeight() - 4,
            { align: "right" }
          );
        },
      });

      pdf.save(buildFileName("pdf"));
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("PDF banane mein dikkat aa gayi. Console check karein.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  // =====================================================
  // EXCEL DOWNLOAD — mirrors the exact same subject/exam
  // pivoted mark-sheet layout shown on screen (3 header rows +
  // one data row per student), built with SheetJS (xlsx).
  // =====================================================

  // Colors mirrored 1:1 from the on-screen table's sx backgroundColors.
  const XLSX_COLOR = {
    headerGray: "FFF3F4F6",
    subjectHeader: "FFEDE9FE",
    examSubHeader: "FFF5F3FF",
    trailHeader: "FFDCFCE7",
    subjectTotalBody: "FFFAF5FF",
    trailBody: "FFF0FDF4",
    purpleBorder: "FF6B12B7",
    pass: "FFDCFCE7",
    compartment: "FFFEF9C3",
    fail: "FFFEE2E2",
  };

  const handleDownloadExcel = async () => {
    if (!results.length) return;

    setIsDownloadingExcel(true);

    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Final Result");

      const FIXED_COLS = ["Sr.", "Student Name", "Father Name"];
      const TRAIL_COLS = ["Total", "%", "Grade", "Status"];
      const fixedColCount = FIXED_COLS.length;
      const blockWidth = examColumns.length + 1;
      const totalCols =
        fixedColCount + subjectColumns.length * blockWidth + TRAIL_COLS.length;

      const subjectColsEnd = fixedColCount + subjectColumns.length * blockWidth; // exclusive, 0-indexed
      ws.columns = Array.from({ length: totalCols }, (_, c) => {
        if (c === 0) return { width: 6 };
        if (c === 1) return { width: 19 };
        if (c === 2) return { width: 17 };
        if (c < subjectColsEnd) return { width: 5 }; // Half/Anu/Total per subject — kept narrow
        return { width: 7 }; // Total / % / Grade / Status
      });

      // ---- School / report info block — mirrors the print header exactly
      const infoLines = [
        { text: SCHOOL_NAME, bold: true, size: 16 },
        { text: "FINAL RESULT REPORT", bold: true, size: 12 },
        {
          text: `${selectedClass?.className || "Class"}${
            selectedClass?.section ? ` - ${selectedClass.section}` : ""
          }   |   Academic Year: ${academicYear}`,
          bold: true,
          size: 10,
        },
        combinedExamNames ? { text: `Examinations: ${combinedExamNames}`, size: 9 } : null,
      ].filter(Boolean);

      infoLines.forEach((line) => {
        const infoRow = ws.addRow([line.text]);
        infoRow.height = line.size >= 14 ? 26 : 18;
        const cell = infoRow.getCell(1);
        cell.font = { bold: !!line.bold, size: line.size, color: { argb: "FF1A1A1A" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        ws.mergeCells(infoRow.number, 1, infoRow.number, totalCols);
      });

      // Blank spacer row before the table
      const spacerRow = ws.addRow([]);
      spacerRow.height = 6;

      const thinBorder = { style: "thin", color: { argb: "FFBBBBBB" } };
      const purpleBorder = { style: "medium", color: { argb: XLSX_COLOR.purpleBorder } };

      const styleCell = (row, col, value, opts = {}) => {
        const cell = row.getCell(col);
        cell.value = value;
        cell.alignment = {
          vertical: "middle",
          horizontal: opts.align || "center",
          wrapText: !!opts.wrap,
        };
        cell.font = {
          bold: !!opts.bold,
          size: opts.fontSize || 10,
          color: { argb: opts.fontColor || "FF000000" },
        };
        if (opts.fill) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill } };
        }
        cell.border = {
          top: thinBorder,
          bottom: thinBorder,
          left: opts.leftBorder || thinBorder,
          right: thinBorder,
        };
        return cell;
      };

      // ---- Header row 1 — Sr / Name / Father + one merged cell per subject
      const row1 = ws.addRow([]);
      row1.height = 22;
      styleCell(row1, 1, "Sr.", { bold: true, fill: XLSX_COLOR.headerGray });
      styleCell(row1, 2, "Student Name", { bold: true, fill: XLSX_COLOR.headerGray, align: "left" });
      styleCell(row1, 3, "Father Name", { bold: true, fill: XLSX_COLOR.headerGray, align: "left" });

      let colCursor = fixedColCount + 1;
      subjectColumns.forEach((subject) => {
        styleCell(row1, colCursor, subject.name, {
          bold: true,
          fill: XLSX_COLOR.subjectHeader,
          leftBorder: purpleBorder,
        });
        ws.mergeCells(row1.number, colCursor, row1.number, colCursor + blockWidth - 1);
        colCursor += blockWidth;
      });

      TRAIL_COLS.forEach((label) => {
        styleCell(row1, colCursor, label, { bold: true, fill: XLSX_COLOR.trailHeader });
        colCursor += 1;
      });

      // ---- Header row 2 — exam abbreviations + "Total" per subject
      const row2 = ws.addRow([]);
      row2.height = 18;
      colCursor = fixedColCount + 1;
      subjectColumns.forEach(() => {
        examColumns.forEach((exam, i) => {
          styleCell(row2, colCursor, abbreviateExamName(exam.examName), {
            bold: true,
            fill: XLSX_COLOR.examSubHeader,
            fontSize: 9,
            leftBorder: i === 0 ? purpleBorder : thinBorder,
          });
          colCursor += 1;
        });
        styleCell(row2, colCursor, "Total", {
          bold: true,
          fill: XLSX_COLOR.subjectHeader,
          fontSize: 9,
        });
        colCursor += 1;
      });

      // ---- Header row 3 — max marks per exam + subject total max
      const row3 = ws.addRow([]);
      row3.height = 18;
      colCursor = fixedColCount + 1;
      subjectColumns.forEach((subject) => {
        examColumns.forEach((exam, i) => {
          styleCell(row3, colCursor, subject.examMax[exam._id] ?? "", {
            fill: XLSX_COLOR.examSubHeader,
            fontSize: 9,
            fontColor: "FF666666",
            leftBorder: i === 0 ? purpleBorder : thinBorder,
          });
          colCursor += 1;
        });
        styleCell(row3, colCursor, subject.totalMax || "", {
          bold: true,
          fill: XLSX_COLOR.subjectHeader,
          fontSize: 9,
          fontColor: "FF666666",
        });
        colCursor += 1;
      });

      // ---- Vertical merges for fixed + trailing columns across the 3 header rows
      for (let c = 1; c <= fixedColCount; c++) ws.mergeCells(row1.number, c, row3.number, c);
      const trailStart = fixedColCount + subjectColumns.length * blockWidth + 1;
      for (let i = 0; i < TRAIL_COLS.length; i++) {
        ws.mergeCells(row1.number, trailStart + i, row3.number, trailStart + i);
      }

      ws.views = [{ state: "frozen", ySplit: row3.number }];

      // ---- Data rows
      results.forEach((result, index) => {
        const status = String(result.status || "").toUpperCase();
        const row = ws.addRow([]);

        styleCell(row, 1, index + 1);
        styleCell(
          row,
          2,
          `${result.student?.name || "Student"}${
            result.student?.rollNumber ? ` (Roll: ${result.student.rollNumber})` : ""
          }`,
          { bold: true, align: "left", wrap: true }
        );
        styleCell(row, 3, result.fatherName || result.student?.fatherName || "—", {
          align: "left",
          wrap: true,
        });

        let c = fixedColCount + 1;
        subjectColumns.forEach((subject) => {
          const { perExam, obtainedTotal } = getSubjectMarks(result, subject);
          perExam.forEach((item, i) => {
            styleCell(row, c, item.obtained != null ? item.obtained : "—", {
              leftBorder: i === 0 ? purpleBorder : thinBorder,
            });
            c += 1;
          });
          styleCell(row, c, obtainedTotal, { bold: true, fill: XLSX_COLOR.subjectTotalBody });
          c += 1;
        });

        styleCell(row, c, `${result.totalObtained ?? 0}/${result.totalMax ?? 0}`, {
          bold: true,
          fill: XLSX_COLOR.trailBody,
        });
        c += 1;
        styleCell(row, c, `${Number(result.percentage || 0).toFixed(1)}%`, {
          bold: true,
          fill: XLSX_COLOR.trailBody,
        });
        c += 1;
        styleCell(row, c, result.overallGrade || "—", { bold: true, fill: XLSX_COLOR.trailBody });
        c += 1;

        const statusFill =
          status === "PASS"
            ? XLSX_COLOR.pass
            : status === "COMPARTMENT"
            ? XLSX_COLOR.compartment
            : status === "FAIL"
            ? XLSX_COLOR.fail
            : XLSX_COLOR.trailBody;
        styleCell(row, c, status || "—", { bold: true, fill: statusFill });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildFileName("xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel generation failed:", err);
      alert("Excel banane mein dikkat aa gayi. Console check karein.");
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  // =====================================================
  // ACTUAL PRINT (printer dialog — kept separate from download)
  // =====================================================

  const handlePrint = () => {
    window.print();
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    if (!classId || !academicYear) return;
    refetch();
  };

  // =====================================================
  // CLASS CHANGE
  // =====================================================

  const handleClassChange = (event) => {
    setClassId(event.target.value);
  };

  // =====================================================
  // ACADEMIC YEAR CHANGE
  // =====================================================

  const handleAcademicYearChange = (event) => {
    setAcademicYear(event.target.value);
  };

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const passCount = results.filter((item) => item.status === "PASS").length;
  const failCount = results.filter((item) => item.status === "FAIL").length;
  const compartmentCount = results.filter(
    (item) => item.status === "COMPARTMENT"
  ).length;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <PortalGuard>
      <Box
        sx={{
          p: { xs: 1.5, sm: 2, md: 3 },
          minHeight: "100vh",
          backgroundColor: "#f5f6fa",
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
          spacing={2}
          className="no-print"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: "#6B12B7" }}>
              <School />
            </Avatar>

            <Box>
              <Typography variant="h5" fontWeight={700}>
                Final Result Download
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Final Result
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            {classId && academicYear && (
              <Button
                variant="outlined"
                startIcon={
                  isFetching ? <CircularProgress size={18} /> : <Refresh />
                }
                onClick={handleRefresh}
                disabled={isFetching}
              >
                Refresh
              </Button>
            )}

            {results.length > 0 && (
              <Button
                variant="outlined"
                startIcon={
                  isDownloadingExcel ? (
                    <CircularProgress size={18} />
                  ) : (
                    <TableChart />
                  )
                }
                onClick={handleDownloadExcel}
                disabled={isDownloadingExcel}
                sx={{ color: "#1e7e34", borderColor: "#1e7e34" }}
              >
                {isDownloadingExcel ? "Preparing Excel..." : "Download Excel"}
              </Button>
            )}

            {results.length > 0 && (
              <Button
                variant="contained"
                startIcon={
                  isDownloadingPdf ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Download />
                  )
                }
                onClick={handleDownload}
                disabled={isDownloadingPdf}
                sx={{ bgcolor: "#6B12B7", "&:hover": { bgcolor: "#551099" } }}
              >
                {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
              </Button>
            )}
          </Stack>
        </Stack>

        {/* =================================================
            FILTER CARD
        ================================================= */}

        <Card className="no-print" sx={{ mt: 3, borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={2}>
              Select Result
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>

                <Select
                  value={classId}
                  label="Class"
                  onChange={handleClassChange}
                  disabled={classesLoading}
                >
                  <MenuItem value="">Select Class</MenuItem>

                  {classes.map((item) => (
                    <MenuItem key={item._id} value={item._id}>
                      {item.className}
                      {item.section ? ` - ${item.section}` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Academic Year</InputLabel>

                <Select
                  value={academicYear}
                  label="Academic Year"
                  onChange={handleAcademicYearChange}
                >
                  <MenuItem value="">Select Academic Year</MenuItem>

                  {academicYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              mt={3}
            >
              <Button
                variant="contained"
                startIcon={
                  isGenerating ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AutoAwesome />
                  )
                }
                disabled={!classId || !academicYear || isGenerating}
                onClick={handleGenerate}
                sx={{ bgcolor: "#6B12B7", "&:hover": { bgcolor: "#551099" } }}
              >
                {isGenerating ? "Generating..." : "Generate Final Result"}
              </Button>

              {results.length > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={handlePrint}
                >
                  Print Result
                </Button>
              )}
            </Stack>

            {classId && academicYear && (
              <Alert severity="info" sx={{ mt: 3 }}>
                Showing final result for{" "}
                <b>
                  {selectedClass?.className || "Selected Class"}
                  {selectedClass?.section ? ` - ${selectedClass.section}` : ""}
                </b>{" "}
                — Academic Year <b>{academicYear}</b>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* =================================================
            LOADING
        ================================================= */}

        {isLoading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
            className="no-print"
          >
            <Stack spacing={2} alignItems="center">
              <CircularProgress />
              <Typography color="text.secondary">
                Loading final results...
              </Typography>
            </Stack>
          </Box>
        )}

        {!isLoading && isFetching && results.length > 0 && (
          <Alert severity="info" sx={{ mt: 3 }} className="no-print">
            Refreshing final results...
          </Alert>
        )}

        {isError && !isLoading && (
          <Alert severity="error" sx={{ mt: 3 }} className="no-print">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load final results"}
          </Alert>
        )}

        {!classId || !academicYear ? (
          <Card className="no-print" sx={{ mt: 3, borderRadius: 3 }}>
            <CardContent>
              <Stack alignItems="center" spacing={1} py={5}>
                <School sx={{ fontSize: 55, color: "#6B12B7" }} />
                <Typography variant="h6" fontWeight={700}>
                  Select Class & Academic Year
                </Typography>
                <Typography color="text.secondary" textAlign="center">
                  Select both options above to view the final results.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ) : null}

        {!isLoading &&
          !isError &&
          classId &&
          academicYear &&
          results.length === 0 && (
            <Card className="no-print" sx={{ mt: 3, borderRadius: 3 }}>
              <CardContent>
                <Alert severity="warning">
                  No final results found for{" "}
                  <b>{selectedClass?.className || "selected class"}</b> in
                  academic year <b>{academicYear}</b>.
                </Alert>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  First click <b>Generate Final Result</b>. The system will
                  automatically combine all exams configured to contribute to
                  the final result for this class and year.
                </Typography>
              </CardContent>
            </Card>
          )}

        {/* =================================================
            RESULT — subject-wise mark-sheet layout
        ================================================= */}

        {!isLoading && results.length > 0 && (
          <Box
            id="final-result-print"
            sx={{
              mt: 3,
              backgroundColor: "#fff",
              p: { xs: 2, md: 4 },
              borderRadius: 3,
              boxShadow: {
                xs: "none",
                md: "0 4px 20px rgba(0,0,0,0.06)",
              },
            }}
          >
            {/* =================================================
                REPORT HEADER
            ================================================= */}

            <Box textAlign="center" mb={3}>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                {SCHOOL_NAME}
              </Typography>

              <Typography variant="h6" fontWeight={600} mt={1}>
                FINAL RESULT REPORT
              </Typography>

              <Typography variant="subtitle1" fontWeight={600} mt={0.5}>
                {selectedClass?.className || "Class"}
                {selectedClass?.section
                  ? ` - ${selectedClass.section}`
                  : ""}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Academic Year: <b>{academicYear}</b>
              </Typography>

              {combinedExamNames && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Examinations: {combinedExamNames}
                </Typography>
              )}
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* =================================================
                SUMMARY
            ================================================= */}

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              mb={3}
              className="no-print"
            >
              <Chip
                label={`Total Students: ${results.length}`}
                color="primary"
                variant="outlined"
              />

              <Chip label={`Passed: ${passCount}`} color="success" variant="outlined" />

              <Chip label={`Failed: ${failCount}`} color="error" variant="outlined" />

              <Chip
                label={`Compartment: ${compartmentCount}`}
                color="warning"
                variant="outlined"
              />
            </Stack>

            {/* =================================================
                MARK-SHEET TABLE — Sr.No / Name / Father, then one
                column-group per SUBJECT (Half Yearly, Annual, Total,
                %), then Grand Total, Percentage, Grade, Status, Rank.
            ================================================= */}

            <TableContainer
              sx={{
                overflowX: "auto",
                "& table": { borderCollapse: "collapse" },
                // Dense sizing applied to every cell in this table so the
                // whole mark-sheet takes up as little width as possible —
                // makes it much easier to fit on a printed A4 landscape page.
                "& .MuiTableCell-root": {
                  padding: "1px 2px",
                  fontSize: "0.6rem",
                  lineHeight: 1.05,
                },
              }}
            >
              <Table sx={{ minWidth: "auto", tableLayout: "fixed" }} size="small">
                <TableHead>
                  {/* =========================
                      ROW 1 — SUBJECT NAME
                      e.g. "Hindi" spanning its Half Yearly / Annual /
                      Total / % sub-columns — matches the report card.
                  ========================= */}

                  <TableRow>
                    <TableCell
                      rowSpan={3}
                      align="center"
                      sx={{ fontWeight: 800, width: 18, backgroundColor: "#f3f4f6" }}
                    >
                      Sr.
                    </TableCell>

                    <TableCell
                      rowSpan={3}
                      sx={{ fontWeight: 800, width: 74, backgroundColor: "#f3f4f6" }}
                    >
                      Student Name
                    </TableCell>

                    <TableCell
                      rowSpan={3}
                      sx={{ fontWeight: 800, width: 66, backgroundColor: "#f3f4f6" }}
                    >
                      Father Name
                    </TableCell>

                    {subjectColumns.map((subject) => (
                      <TableCell
                        key={subject.name}
                        align="center"
                        colSpan={examColumns.length + 1}
                        sx={{
                          fontWeight: 800,
                          backgroundColor: "#ede9fe",
                          borderLeft: "2px solid #6B12B7",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {subject.name}
                      </TableCell>
                    ))}

                    <TableCell
                      rowSpan={3}
                      align="center"
                      sx={{ fontWeight: 800, width: 36, backgroundColor: "#dcfce7" }}
                    >
                      Total
                    </TableCell>

                    <TableCell
                      rowSpan={3}
                      align="center"
                      sx={{ fontWeight: 800, width: 28, backgroundColor: "#dcfce7" }}
                    >
                      %
                    </TableCell>

                    <TableCell
                      rowSpan={3}
                      align="center"
                      sx={{ fontWeight: 800, width: 26, backgroundColor: "#dcfce7" }}
                    >
                      Grade
                    </TableCell>

                    <TableCell
                      rowSpan={3}
                      align="center"
                      sx={{ fontWeight: 800, width: 38, backgroundColor: "#dcfce7" }}
                    >
                      Status
                    </TableCell>
                  </TableRow>

                  {/* =========================
                      ROW 2 — Half Yearly / Annual / Total / % LABELS
                  ========================= */}

                  <TableRow>
                    {subjectColumns.map((subject) => (
                      <Fragment key={`labels-${subject.name}`}>
                        {examColumns.map((exam) => (
                          <TableCell
                            key={`${subject.name}-${exam._id}-label`}
                            align="center"
                            sx={{
                              fontWeight: 700,
                              backgroundColor: "#f5f3ff",
                              width: 12,
                              whiteSpace: "nowrap",
                              fontSize: "0.5rem",
                            }}
                          >
                            {abbreviateExamName(exam.examName)}
                          </TableCell>
                        ))}

                        <TableCell
                          key={`${subject.name}-total-label`}
                          align="center"
                          sx={{ fontWeight: 700, backgroundColor: "#ede9fe", width: 20, fontSize: "0.5rem" }}
                        >
                          Total
                        </TableCell>
                      </Fragment>
                    ))}
                  </TableRow>

                  {/* =========================
                      ROW 3 — MAX MARKS (e.g. 100 / 100 / 200)
                  ========================= */}

                  <TableRow>
                    {subjectColumns.map((subject) => (
                      <Fragment key={`max-${subject.name}`}>
                        {examColumns.map((exam) => (
                          <TableCell
                            key={`${subject.name}-${exam._id}-max`}
                            align="center"
                            sx={{
                              fontWeight: 600,
                              backgroundColor: "#f5f3ff",
                              width: 12,
                              color: "text.secondary",
                              fontSize: "0.5rem",
                            }}
                          >
                            {subject.examMax[exam._id] ?? ""}
                          </TableCell>
                        ))}

                        <TableCell
                          key={`${subject.name}-total-max`}
                          align="center"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: "#ede9fe",
                            width: 20,
                            fontSize: "0.5rem",
                            color: "text.secondary",
                          }}
                        >
                          {subject.totalMax || ""}
                        </TableCell>
                      </Fragment>
                    ))}
                  </TableRow>
                </TableHead>

                {/* =================================================
                    TABLE BODY
                ================================================= */}

                <TableBody>
                  {results.map((result, index) => {
                    const status = String(result.status || "").toUpperCase();
                    const resultKey = result._id || result.student?._id || index;

                    return (
                      <TableRow key={resultKey} sx={{ pageBreakInside: "avoid" }}>
                        <TableCell align="center">{index + 1}</TableCell>

                        <TableCell sx={{ whiteSpace: "normal" }}>
                          <Box component="div" sx={{ fontSize: "0.62rem", fontWeight: 700 }}>
                            {result.student?.name || "Student"}
                          </Box>

                          {result.student?.rollNumber && (
                            <Box component="div" sx={{ fontSize: "0.54rem", color: "text.secondary" }}>
                              Roll: {result.student.rollNumber}
                            </Box>
                          )}
                        </TableCell>

                        <TableCell sx={{ whiteSpace: "normal", fontSize: "0.6rem" }}>
                          {result.fatherName || result.student?.fatherName || "—"}
                        </TableCell>

                        {subjectColumns.map((subject) => {
                          const { perExam, obtainedTotal } = getSubjectMarks(result, subject);

                          return (
                            <Fragment key={`${resultKey}-${subject.name}`}>
                              {perExam.map((item) => (
                                <TableCell
                                  key={`${resultKey}-${subject.name}-${item.examId}`}
                                  align="center"
                                  sx={{ borderLeft: "1px solid #eee", width: 12, fontSize: "0.55rem" }}
                                >
                                  {item.obtained != null ? item.obtained : "—"}
                                </TableCell>
                              ))}

                              <TableCell
                                key={`${resultKey}-${subject.name}-total`}
                                align="center"
                                sx={{ fontWeight: 700, backgroundColor: "#faf5ff", width: 20, fontSize: "0.55rem" }}
                              >
                                {obtainedTotal}
                              </TableCell>
                            </Fragment>
                          );
                        })}

                        <TableCell align="center" sx={{ backgroundColor: "#f0fdf4", fontWeight: 800 }}>
                          {result.totalObtained ?? 0}/{result.totalMax ?? 0}
                        </TableCell>

                        <TableCell align="center" sx={{ backgroundColor: "#f0fdf4", fontWeight: 800 }}>
                          {Number(result.percentage || 0).toFixed(1)}%
                        </TableCell>

                        <TableCell align="center" sx={{ backgroundColor: "#f0fdf4", fontWeight: 800 }}>
                          {result.overallGrade || "—"}
                        </TableCell>

                        <TableCell
                          align="center"
                          sx={{
                            backgroundColor:
                              status === "PASS"
                                ? "#dcfce7"
                                : status === "COMPARTMENT"
                                ? "#fef9c3"
                                : status === "FAIL"
                                ? "#fee2e2"
                                : "#f0fdf4",
                            fontWeight: 800,
                          }}
                        >
                          {status || "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* =================================================
                REPORT FOOTER
            ================================================= */}

            <Divider sx={{ mt: 3, mb: 2 }} />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={1}
            >
              <Typography variant="body2">
                Total Students: <b>{results.length}</b>
              </Typography>

              <Typography variant="body2">
                Passed: <b>{passCount}</b>
              </Typography>

              <Typography variant="body2">
                Failed: <b>{failCount}</b>
              </Typography>

              <Typography variant="body2">
                Compartment: <b>{compartmentCount}</b>
              </Typography>

              <Typography variant="body2">
                Generated on: <b>{new Date().toLocaleDateString("en-IN")}</b>
              </Typography>
            </Stack>
          </Box>
        )}

        <style jsx global>{`
          @media print {
            body {
              background: white !important;
              margin: 0 !important;
            }

            /* Hide EVERYTHING on the page by default — this covers
               sidebars/navbars/headers coming from parent layouts
               that this component has no direct control over. */
            body * {
              visibility: hidden !important;
            }

            /* ...then reveal only the report card and everything
               inside it — this is exactly what's on screen, nothing
               added or removed, so print always matches the UI. */
            #final-result-print,
            #final-result-print * {
              visibility: visible !important;
            }

            /* Pull the report out of the page flow so it isn't
               pushed aside by the (now invisible, but still
               occupying no space thanks to display:none below on
               its siblings) sidebar/layout wrappers. */
            #final-result-print {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 6px !important;
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            /* Explicitly-marked non-print elements (e.g. summary
               chips inside the report) stay fully removed, not just
               invisible, so they don't leave blank gaps. */
            .no-print {
              display: none !important;
            }

            @page {
              size: A4 landscape;
              margin: 6mm;
            }

            table {
              width: 100% !important;
              border-collapse: collapse !important;
              table-layout: fixed !important;
            }

            /* Columns as small/tight as possible while printing —
               shrink padding + font further than the on-screen size. */
            th,
            td {
              border: 1px solid #000 !important;
              padding: 0.5px 1.5px !important;
              color: #000 !important;
              font-size: 5.5px !important;
              line-height: 1 !important;
              overflow: visible !important;
            }

            /* Name / Father columns need to wrap instead of being
               cut off with an ellipsis — that's what caused text to
               go missing in print compared to what's visible on screen. */
            #final-result-print td:nth-child(2),
            #final-result-print td:nth-child(3),
            #final-result-print th:nth-child(2),
            #final-result-print th:nth-child(3) {
              white-space: normal !important;
              word-break: break-word !important;
            }

            /* All other (numeric/short) cells stay single-line. */
            #final-result-print td:not(:nth-child(2)):not(:nth-child(3)),
            #final-result-print th:not(:nth-child(2)):not(:nth-child(3)) {
              white-space: nowrap !important;
            }

            .MuiChip-root {
              border: none !important;
            }
          }
        `}</style>
      </Box>
    </PortalGuard>
  );
}
