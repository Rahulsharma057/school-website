"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { DataGrid } from "@mui/x-data-grid";
import SmsIcon from "@mui/icons-material/Sms";
import { toast } from "react-toastify";

import { useClasses } from "@/hooks/useClasses";
import { useDueList } from "@/hooks/fees/useStudentFee";
import { buildSmsLink, buildDueReminderMessage } from "@/utils/smsHelper";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import SendReminderQueueDialog from "./SendReminderQueueDialog";

export default function DueListTable() {
  const router = useRouter();

  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [search, setSearch] = useState("");

  // MUI X DataGrid v9 uses Set for selected row IDs
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [queueOpen, setQueueOpen] = useState(false);

  const { data: classesData } = useClasses();
  const classes = classesData || [];

  const { data, isLoading, isError } = useDueList({
    classId: classId || undefined,
    academicYear: academicYear || undefined,
    onlyOverdue: onlyOverdue ? "true" : undefined,
  });

  // --------------------------------------------------
  // Rows
  // --------------------------------------------------

  const rows = useMemo(() => {
    const mapped = (data || []).map((r) => ({
      ...r,
      id: r._id,
    }));

    if (!search.trim()) {
      return mapped;
    }

    const q = search.trim().toLowerCase();

    return mapped.filter((r) => {
      const name = r.student?.user?.name || "";
      const roll = r.student?.rollNumber;

      return (
        name.toLowerCase().includes(q) ||
        String(roll ?? "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [data, search]);

  // --------------------------------------------------
  // Build reminder
  // --------------------------------------------------

  const buildReminderFor = (row) => {
    const name = row.student?.user?.name || "Student";
    const phone = row.student?.parent?.phone || null;

    const message = buildDueReminderMessage({
      studentName: name,

      className: row.class
        ? `${row.class.className || ""} ${row.class.section || ""}`.trim()
        : "",

      totalDue: row.totalDue,

      academicYear: row.academicYear,
    });

    return {
      id: row.id,
      name,
      phone,
      message,
    };
  };

  // --------------------------------------------------
  // Single reminder
  // --------------------------------------------------

  const handleSingleRemind = (row) => {
    const { phone, message } = buildReminderFor(row);

    if (!phone) {
      toast.error(
        `No parent phone on file for ${
          row.student?.user?.name || "this student"
        }`,
      );

      return;
    }

    const link = buildSmsLink(phone, message);

    window.location.href = link;
  };

  // --------------------------------------------------
  // Selected reminder queue
  // --------------------------------------------------

  const selectedQueue = useMemo(() => {
    return rows.filter((row) => selectedIds.has(row.id)).map(buildReminderFor);
  }, [rows, selectedIds]);

  // --------------------------------------------------
  // DataGrid columns
  // --------------------------------------------------

  const columns = [
    {
      field: "student",
      headerName: "Student",
      flex: 1,
      minWidth: 200,

      renderCell: ({ row }) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {row.student?.user?.name}
          </Typography>

          <Typography
            sx={{
              fontSize: 12,
              color: "#a1a1aa",
            }}
          >
            Roll #{row.student?.rollNumber}
          </Typography>
        </Box>
      ),
    },

    {
      field: "class",
      headerName: "Class",
      width: 130,

      renderCell: ({ value }) =>
        `${value?.className || ""} ${value?.section || ""}`.trim(),
    },

    {
      field: "phone",
      headerName: "Parent Phone",
      width: 140,
      sortable: false,

      renderCell: ({ row }) =>
        row.student?.parent?.phone ? (
          <Typography sx={{ fontSize: 13 }}>
            {row.student.parent.phone}
          </Typography>
        ) : (
          <Typography
            sx={{
              fontSize: 12,
              color: "#d4d4d8",
            }}
          >
            Not on file
          </Typography>
        ),
    },

    {
      field: "totalAmount",
      headerName: "Total",
      width: 100,

      renderCell: ({ value }) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`,
    },

    {
      field: "totalPaid",
      headerName: "Paid",
      width: 100,

      renderCell: ({ value }) =>
        `₹${Number(value || 0).toLocaleString("en-IN")}`,
    },

    {
      field: "totalDue",
      headerName: "Due",
      width: 120,

      renderCell: ({ value }) => (
        <Typography
          sx={{
            fontWeight: 700,
            color: "#dc2626",
          }}
        >
          ₹{Number(value || 0).toLocaleString("en-IN")}
        </Typography>
      ),
    },

    {
      field: "status",
      headerName: "Status",
      width: 105,

      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            fontWeight: 600,

            bgcolor: value === "PARTIAL" ? "#fef3c7" : "#fee2e2",

            color: value === "PARTIAL" ? "#b45309" : "#b91c1c",
          }}
        />
      ),
    },

    {
      field: "actions",
      headerName: "Remind",
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",

      renderCell: ({ row }) => (
        <Tooltip
          title={
            row.student?.parent?.phone
              ? "Send SMS reminder"
              : "No parent phone on file"
          }
        >
          <span>
            <IconButton
              size="small"
              disabled={!row.student?.parent?.phone}
              onClick={(e) => {
                e.stopPropagation();
                handleSingleRemind(row);
              }}
              sx={{
                color: "#15803d",
              }}
            >
              <SmsIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },
  ];

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={2} mb={3} alignItems="center">
        {/* Class */}
        <TextField
          select
          size="small"
          label="Class (optional)"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          sx={{
            width: 200,
          }}
        >
          <MenuItem value="">All classes</MenuItem>

          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              {c.className}
              {c.section ? ` - ${c.section}` : ""}
            </MenuItem>
          ))}
        </TextField>

        {/* Academic Year */}
        <TextField
          size="small"
          label="Academic Year (optional)"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          sx={{
            width: 160,
          }}
        />

        {/* Search */}
        <TextField
          size="small"
          label="Search name / roll no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: 220,
          }}
        />

        {/* Overdue */}
        <FormControlLabel
          control={
            <Switch
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
            />
          }
          label="Only Overdue"
        />

        <Box sx={{ flexGrow: 1 }} />

        {/* Send reminders */}
        <Button
          startIcon={<SmsIcon />}
          disabled={selectedIds.size === 0}
          onClick={() => setQueueOpen(true)}
          variant="contained"
          disableElevation
          sx={{
            bgcolor: "#15803d",
            textTransform: "none",
            fontWeight: 600,

            "&:hover": {
              bgcolor: "#166534",
            },
          }}
        >
          Send Reminders {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
        </Button>
      </Stack>

      {/* Loading */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <EmptyState title="Unable to load due list" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No dues found"
          description={
            search
              ? "No student matches your search."
              : "Every fee record here is fully paid, or matches your filter."
          }
        />
      ) : (
        <Box
          sx={{
            border: "1px solid #e4e4e7",
            borderRadius: 2,
            bgcolor: "#fff",
            overflow: "hidden",
          }}
        >
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            // MUI X DataGrid v9 selection model
            rowSelectionModel={{
              type: "include",
              ids: selectedIds,
            }}
            onRowSelectionModelChange={(model) => {
              setSelectedIds(model.ids);
            }}
            onRowClick={(params) => {
              router.push(`/admin/fees/students/${params.id}`);
            }}
            getRowHeight={() => 60}
            sx={{
              border: "none",
              cursor: "pointer",

              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#fafafa",
                borderBottom: "1px solid #e4e4e7",
              },

              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid #f4f4f5",
              },
            }}
          />
        </Box>
      )}

      {/* Reminder Queue */}
      <SendReminderQueueDialog
        open={queueOpen}
        onClose={() => setQueueOpen(false)}
        queue={selectedQueue}
      />
    </Box>
  );
}
