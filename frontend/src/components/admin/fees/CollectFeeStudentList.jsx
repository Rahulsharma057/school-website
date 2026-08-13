"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useQuery } from "@tanstack/react-query";

import { getSchoolClasses } from "@/services/schoolClassService";
import { useStudentsByClass } from "@/hooks/useStudent";
import { useClassFeeSummary } from "@/hooks/fees/useStudentFee";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const STATUS_STYLES = {
  PAID: { bg: "#dcfce7", color: "#15803d" },
  PARTIAL: { bg: "#fef3c7", color: "#b45309" },
  PENDING: { bg: "#f4f4f5", color: "#71717a" },
};

export default function CollectFeeStudentList() {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [search, setSearch] = useState("");

  const { data: classesData } = useQuery({
    queryKey: ["school-classes"],
    queryFn: async () => (await getSchoolClasses()).data,
  });
  const classes = classesData?.data || [];

  const { data: students, isLoading: loadingStudents } = useStudentsByClass(classId);
  const { data: feeSummary, isLoading: loadingSummary } = useClassFeeSummary({
    classId: classId || undefined,
    academicYear: academicYear || undefined,
  });

  // Merge the class roster with fee records (if the academic year is set)
  // so every student shows up — including those with NO fee assigned yet —
  // rather than only the ones getClassFeeSummary already knows about.
  const rows = useMemo(() => {
    if (!students) return [];

    const feeByStudentId = new Map((feeSummary || []).map((f) => [String(f.student?._id), f]));

    return students
      .map((s) => {
        const fee = feeByStudentId.get(String(s._id));
        return {
          id: s._id,
          studentId: s._id,
          name: s.user?.name || "—",
          email: s.user?.email || "",
          rollNumber: s.rollNumber,
          hasFee: Boolean(fee),
          totalAmount: fee?.totalAmount ?? null,
          totalPaid: fee?.totalPaid ?? null,
          totalDue: fee?.totalDue ?? null,
          status: fee?.status || null,
        };
      })
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        // FIX: rollNumber can come back as a Number from the API — calling
        // .toLowerCase() directly on it used to throw and silently break
        // this whole list. Coerce to string first.
        return r.name.toLowerCase().includes(q) || String(r.rollNumber ?? "").toLowerCase().includes(q);
      });
  }, [students, feeSummary, search]);

  const columns = [
    {
      field: "name",
      headerName: "Student",
      flex: 1,
      minWidth: 200,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{row.name}</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Roll #{row.rollNumber}</Typography>
        </Box>
      ),
    },
    {
      field: "totalAmount",
      headerName: "Total",
      width: 110,
      renderCell: ({ row }) => (row.hasFee ? `₹${row.totalAmount.toLocaleString("en-IN")}` : "—"),
    },
    {
      field: "totalPaid",
      headerName: "Paid",
      width: 110,
      renderCell: ({ row }) => (row.hasFee ? `₹${row.totalPaid.toLocaleString("en-IN")}` : "—"),
    },
    {
      field: "totalDue",
      headerName: "Due",
      width: 120,
      renderCell: ({ row }) =>
        row.hasFee ? (
          <Typography sx={{ fontWeight: 700, color: row.totalDue > 0 ? "#dc2626" : "#15803d" }}>
            ₹{row.totalDue.toLocaleString("en-IN")}
          </Typography>
        ) : (
          "—"
        ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      sortable: false,
      renderCell: ({ row }) =>
        row.hasFee ? (
          <Chip
            label={row.status}
            size="small"
            sx={{ fontWeight: 600, bgcolor: STATUS_STYLES[row.status]?.bg, color: STATUS_STYLES[row.status]?.color }}
          />
        ) : (
          <Chip label="Not Assigned" size="small" sx={{ fontWeight: 600, bgcolor: "#fee2e2", color: "#b91c1c" }} />
        ),
    },
  ];

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ width: 200 }}>
          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          label="Academic Year"
          placeholder="2026-27"
          helperText="Needed to show fee totals"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          sx={{ width: 160 }}
        />
        <TextField size="small" label="Search name / roll no." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ width: 220 }} />
      </Stack>

      {!classId ? (
        <EmptyState title="Select a class to begin" description="Pick a class above to see its students." />
      ) : loadingStudents || (academicYear && loadingSummary) ? (
        <LoadingSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState title="No students found" description="This class has no active students, or none match your search." />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            onRowClick={(params) => router.push(`/admin/fees/collect/${params.row.studentId}`)}
            getRowHeight={() => 62}
            sx={{
              border: "none",
              cursor: "pointer",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5" },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
