"use client";

import { useState } from "react";
import { useStudentsByClass } from "@/hooks/useStudent";
import { Box, Button, Card, CardContent, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getFeeStructures } from "@/services/feeStructureService";
import { useAssignFee, useBulkAssignFee } from "@/hooks/fees/useStudentFee";

export default function AssignFeeForm({ defaultStructureId }) {
  const [structureId, setStructureId] = useState(defaultStructureId || "");
  const [studentId, setStudentId] = useState("");
  const [mode, setMode] = useState("bulk"); // bulk | single

  const { data: structuresData } = useQuery({
    queryKey: ["fee-structures-for-assign"],
    queryFn: async () => (await getFeeStructures()).data?.data,
  });
  const structures = structuresData || [];

  const assignFee = useAssignFee();
  const bulkAssign = useBulkAssignFee();

  const selectedStructure = structures.find((s) => s._id === structureId);
const { data: studentsInClass } = useStudentsByClass(selectedStructure?.class?._id || selectedStructure?.class);



  const handleSubmit = () => {
    if (!structureId) return toast.error("Select a fee structure");

    if (mode === "bulk") {
      bulkAssign.mutate({ feeStructureId: structureId });
      return;
    }

    if (!studentId.trim()) return toast.error("Enter a student ID");
    assignFee.mutate({ studentId: studentId.trim(), feeStructureId: structureId });
  };

  const pending = assignFee.isPending || bulkAssign.isPending;

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>Assign Fee</Typography>
        <Typography sx={{ fontSize: 13, color: "#71717a", mb: 3 }}>
          Apply a fee structure to a whole class (skips students who already have it) or a single student.
        </Typography>

        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth size="small" label="Fee Structure" value={structureId} onChange={(e) => setStructureId(e.target.value)}>
              {structures.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.class?.className} {s.class?.section || ""} — {s.academicYear}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth size="small" label="Assign To" value={mode} onChange={(e) => setMode(e.target.value)}>
              <MenuItem value="bulk">Entire Class (bulk)</MenuItem>
              <MenuItem value="single">Single Student</MenuItem>
            </TextField>
          </Grid>

         

{mode === "single" && (
  <Grid size={{ xs: 12, md: 6 }}>
    <TextField
      select
      fullWidth
      size="small"
      label="Student"
      value={studentId}
      onChange={(e) => setStudentId(e.target.value)}
      helperText={!selectedStructure ? "Select a fee structure first" : ""}
      disabled={!selectedStructure}
    >
      {(studentsInClass || []).map((s) => (
        <MenuItem key={s._id} value={s._id}>
          {s.user?.name} — Roll #{s.rollNumber}
        </MenuItem>
      ))}
    </TextField>
  </Grid>
)}
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Button
          disabled={pending}
          onClick={handleSubmit}
          disableElevation
          sx={{ px: 5, py: 1.3, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
        >
          {pending ? "Assigning..." : mode === "bulk" ? "Assign to Class" : "Assign to Student"}
        </Button>
      </CardContent>
    </Card>
  );
}