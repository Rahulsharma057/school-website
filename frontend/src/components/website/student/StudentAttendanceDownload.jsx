"use client";

import { useState } from "react";

import { Button, CircularProgress, Tooltip } from "@mui/material";

import { Download } from "@mui/icons-material";

import * as XLSX from "xlsx";

import { useStudentAttendance } from "@/hooks/useAttendance";

export default function StudentAttendanceDownload({ student, classId }) {
  const [loading, setLoading] = useState(false);

  const { refetch } = useStudentAttendance(
    student?.user?._id,
    classId,
    null,
    null,
    false,
  );

  const handleDownload = async () => {
    if (!student?.user?._id || !classId) {
      return;
    }

    setLoading(true);

    try {
      const result = await refetch();

      const data = result?.data;

      if (!data?.attendance?.length) {
        alert("No attendance found for this student.");

        return;
      }

      const studentName = student?.user?.name || "Student";

      // =================================================
      // ATTENDANCE SHEET
      // =================================================

      const attendanceRows = data.attendance.map((item, index) => ({
        "S.No": index + 1,

        Date: new Date(item.date).toLocaleDateString("en-IN"),

        Status: item.status || "-",

        Class: item.class?.className || "-",

        Section: item.class?.section || "-",
      }));

      // =================================================
      // SUMMARY SHEET
      // =================================================

      const summaryRows = [
        {
          Metric: "Student Name",
          Value: studentName,
        },

        {
          Metric: "Roll Number",
          Value: student?.rollNumber || "-",
        },

        {
          Metric: "Total Days",
          Value: data.summary?.total || 0,
        },

        {
          Metric: "Present",
          Value: data.summary?.present || 0,
        },

        {
          Metric: "Absent",
          Value: data.summary?.absent || 0,
        },

        {
          Metric: "Leave",
          Value: data.summary?.leave || 0,
        },

        {
          Metric: "Attendance %",
          Value: `${data.summary?.percentage || 0}%`,
        },
      ];

      // =================================================
      // WORKBOOK
      // =================================================

      const workbook = XLSX.utils.book_new();

      const attendanceSheet = XLSX.utils.json_to_sheet(attendanceRows);

      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);

      attendanceSheet["!cols"] = [
        { wch: 8 },
        { wch: 18 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
      ];

      summarySheet["!cols"] = [{ wch: 25 }, { wch: 30 }];

      XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      XLSX.writeFile(
        workbook,
        `${studentName.replace(/\s+/g, "_")}_Attendance.xlsx`,
      );
    } catch (error) {
      console.error("Student attendance export error:", error);

      alert("Unable to download attendance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title="Download complete attendance">
      <span>
        <Button
          size="small"
          variant="outlined"
          startIcon={
            loading ? (
              <CircularProgress size={16} />
            ) : (
              <Download fontSize="small" />
            )
          }
          onClick={handleDownload}
          disabled={loading}
          sx={{
            minWidth: 90,
            textTransform: "none",
          }}
        >
          {loading ? "..." : "Excel"}
        </Button>
      </span>
    </Tooltip>
  );
}
