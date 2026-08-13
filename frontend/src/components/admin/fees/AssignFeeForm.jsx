"use client";

import { useEffect, useMemo, useState } from "react";

import { useStudentsByClass } from "@/hooks/useStudent";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getFeeStructures } from "@/services/feeStructureService";
import {
  useAssignFee,
  useBulkAssignFee,
} from "@/hooks/fees/useStudentFee";

export default function AssignFeeForm({ defaultStructureId }) {
  const [structureId, setStructureId] = useState(
    defaultStructureId || ""
  );

  const [studentId, setStudentId] = useState("");
  const [mode, setMode] = useState("bulk");

  // Sync structureId when URL query parameter changes
  useEffect(() => {
    if (defaultStructureId) {
      setStructureId(defaultStructureId);
    }
  }, [defaultStructureId]);

  // =========================
  // FEE STRUCTURES
  // =========================

  const {
    data: structuresData,
    isLoading: structuresLoading,
    isError: structuresError,
  } = useQuery({
    queryKey: ["fee-structures-for-assign"],
    queryFn: async () => {
      const response = await getFeeStructures();

      return response?.data?.data || [];
    },
  });

  const structures = Array.isArray(structuresData)
    ? structuresData
    : [];

  // =========================
  // SELECTED STRUCTURE
  // =========================

  const selectedStructure = useMemo(() => {
    if (!structureId) return null;

    return (
      structures.find(
        (structure) => structure?._id === structureId
      ) || null
    );
  }, [structures, structureId]);

  // =========================
  // CLASS ID
  // =========================

  const classId =
    selectedStructure?.class?._id ||
    (typeof selectedStructure?.class === "string"
      ? selectedStructure.class
      : null);

  // =========================
  // STUDENTS
  // =========================

  const {
    data: studentsData,
    isLoading: studentsLoading,
  } = useStudentsByClass(classId);

  const studentsInClass = Array.isArray(studentsData)
    ? studentsData
    : [];

  // =========================
  // MUTATIONS
  // =========================

  const assignFee = useAssignFee();
  const bulkAssign = useBulkAssignFee();

  // =========================
  // STRUCTURE CHANGE
  // =========================

  const handleStructureChange = (event) => {
    const value = event.target.value;

    setStructureId(value);

    // Reset student when structure changes
    setStudentId("");
  };

  // =========================
  // MODE CHANGE
  // =========================

  const handleModeChange = (event) => {
    const value = event.target.value;

    setMode(value);

    // Reset selected student when switching mode
    if (value === "bulk") {
      setStudentId("");
    }
  };

  // =========================
  // SUBMIT
  // =========================

  const handleSubmit = () => {
    if (!structureId) {
      toast.error("Select a fee structure");
      return;
    }

    // BULK ASSIGN
    if (mode === "bulk") {
      bulkAssign.mutate({
        feeStructureId: structureId,
      });

      return;
    }

    // SINGLE STUDENT
    if (!studentId) {
      toast.error("Select a student");
      return;
    }

    assignFee.mutate({
      studentId,
      feeStructureId: structureId,
    });
  };

  const pending =
    assignFee.isPending ||
    bulkAssign.isPending;

  // =========================
  // RENDER
  // =========================

  return (
    <Card
      variant="outlined"
      sx={{
        border: "1px solid #e4e4e7",
        boxShadow: "none",
      }}
    >
      <CardContent
        sx={{
          p: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{
            color: "#18181b",
            mb: 0.5,
          }}
        >
          Assign Fee
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            color: "#71717a",
            mb: 3,
          }}
        >
          Apply a fee structure to a whole class or assign it
          to a single student.
        </Typography>

        <Grid container spacing={2} mb={3}>
          {/* =========================
              FEE STRUCTURE
          ========================= */}

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Fee Structure"
              value={structureId}
              onChange={handleStructureChange}
              disabled={structuresLoading || pending}
              error={structuresError}
              helperText={
                structuresError
                  ? "Unable to load fee structures"
                  : ""
              }
            >
              {structures.length === 0 && !structuresLoading ? (
                <MenuItem disabled value="">
                  No fee structures found
                </MenuItem>
              ) : (
                structures.map((structure) => (
                  <MenuItem
                    key={structure._id}
                    value={structure._id}
                  >
                    {structure.class?.className || "Class"}
                    {structure.class?.section
                      ? ` - ${structure.class.section}`
                      : ""}{" "}
                    — {structure.academicYear || ""}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>

          {/* =========================
              ASSIGN MODE
          ========================= */}

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Assign To"
              value={mode}
              onChange={handleModeChange}
              disabled={pending}
            >
              <MenuItem value="bulk">
                Entire Class (bulk)
              </MenuItem>

              <MenuItem value="single">
                Single Student
              </MenuItem>
            </TextField>
          </Grid>

          {/* =========================
              STUDENT
          ========================= */}

          {mode === "single" && (
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Student"
                value={studentId}
                onChange={(event) =>
                  setStudentId(event.target.value)
                }
                disabled={!selectedStructure || studentsLoading || pending}
                helperText={
                  !selectedStructure
                    ? "Select a fee structure first"
                    : studentsLoading
                      ? "Loading students..."
                      : studentsInClass.length === 0
                        ? "No students found in this class"
                        : ""
                }
              >
                {studentsInClass.map((student) => (
                  <MenuItem
                    key={student._id}
                    value={student._id}
                  >
                    {student.user?.name || "Unnamed Student"}
                    {" — "}
                    Roll #{student.rollNumber ?? "-"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* =========================
            SUBMIT
        ========================= */}

        <Button
          disabled={
            pending ||
            !structureId ||
            (mode === "single" && !studentId)
          }
          onClick={handleSubmit}
          disableElevation
          variant="contained"
          sx={{
            px: 5,
            py: 1.3,
            bgcolor: "#18181b",
            color: "#fff",
            borderRadius: "8px",
            fontWeight: 600,
            textTransform: "none",
            "&:hover": {
              bgcolor: "#27272a",
            },
          }}
        >
          {pending
            ? "Assigning..."
            : mode === "bulk"
              ? "Assign to Class"
              : "Assign to Student"}
        </Button>
      </CardContent>
    </Card>
  );
}