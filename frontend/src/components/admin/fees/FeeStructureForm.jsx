"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { getAllClasses } from "@/services/classService";
import { useSaveFeeStructure } from "@/hooks/fees/useFeeStructures";

const CATEGORIES = ["TUITION", "EXAM", "REGISTRATION", "UNIFORM", "TRANSPORT", "LIBRARY", "LAB", "SPORTS", "ADMISSION", "OTHER"];

const emptyComponent = () => ({
  id: crypto.randomUUID(),
  name: "",
  category: "OTHER",
  paymentType: "ONE_TIME",
  amount: 0,
  installmentCount: 1,
  mandatory: true,
});

export default function FeeStructureForm({ editData, clearEdit }) {
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [status, setStatus] = useState(true);
  const [components, setComponents] = useState([emptyComponent()]);

 const { data: classesData } = useQuery({
  queryKey: ["classes-for-fee-structure"],
  queryFn: async () => (await getAllClasses()).data,
});

const classes = classesData?.data || [];


  const mutation = useSaveFeeStructure(editData?._id);

  useEffect(() => {
    if (!editData) {
      setClassId("");
      setAcademicYear("");
      setStatus(true);
      setComponents([emptyComponent()]);
      return;
    }

    setClassId(editData.class?._id || editData.class || "");
    setAcademicYear(editData.academicYear || "");
    setStatus(editData.status ?? true);
    setComponents(
      (editData.components || []).map((c) => ({ ...c, id: c.id || crypto.randomUUID() })),
    );
  }, [editData]);

  const addComponent = () => setComponents((prev) => [...prev, emptyComponent()]);
  const updateComponent = (id, patch) =>
    setComponents((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeComponent = (id) => setComponents((prev) => prev.filter((c) => c.id !== id));

  const totalAmount = components.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const handleSubmit = () => {
    if (!classId) return toast.error("Select a class");
    if (!academicYear.trim()) return toast.error("Academic year is required");
    if (!components.length) return toast.error("Add at least one fee component");

    for (const c of components) {
      if (!c.name.trim()) return toast.error("Every component needs a name");
      if (c.paymentType === "INSTALLMENT" && (!c.installmentCount || c.installmentCount < 1)) {
        return toast.error(`"${c.name}": installment count must be at least 1`);
      }
    }

    mutation.mutate(
      {
        class: classId,
        academicYear,
        status,
        components: components.map(({ id, ...c }) => ({ ...c, id, amount: Number(c.amount) })),
      },
      { onSuccess: () => clearEdit?.() },
    );
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Fee Structure" : "Create Fee Structure"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Define the fee components for a class + academic year — this is a template, individual students can be customized later.
            </Typography>
          </Box>
          {editData && (
            <Chip label="Editing" size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />
          )}
        </Stack>

        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField select fullWidth size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => (
              <MenuItem key={c._id} value={c._id}>
  {c.className} {c.section ? `- ${c.section}` : ""}
</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Academic Year"
              placeholder="2026-27"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active" />
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography fontWeight={700}>
            Fee Components <Typography component="span" sx={{ color: "#a1a1aa", fontSize: 13 }}>({components.length})</Typography>
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addComponent}
            variant="contained"
            disableElevation
            sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
          >
            Add Component
          </Button>
        </Stack>

        <Stack spacing={2}>
          {components.map((c) => (
            <Card key={c.id} variant="outlined" sx={{ p: 2, border: "1px solid #e4e4e7", borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Component Name"
                    placeholder="Tuition Fee"
                    value={c.name}
                    onChange={(e) => updateComponent(c.id, { name: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Category"
                    value={c.category}
                    onChange={(e) => updateComponent(c.id, { category: e.target.value })}
                  >
                    {CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payment Type"
                    value={c.paymentType}
                    onChange={(e) => updateComponent(c.id, { paymentType: e.target.value })}
                  >
                    <MenuItem value="ONE_TIME">One Time</MenuItem>
                    <MenuItem value="INSTALLMENT">Installment</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Amount (₹)"
                    value={c.amount}
                    onChange={(e) => updateComponent(c.id, { amount: e.target.value })}
                  />
                </Grid>
                {c.paymentType === "INSTALLMENT" && (
                  <Grid size={{ xs: 6, md: 1.5 }}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="# Installments"
                      value={c.installmentCount}
                      onChange={(e) => updateComponent(c.id, { installmentCount: e.target.value })}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 6, md: 1.5 }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={c.mandatory}
                          onChange={(e) => updateComponent(c.id, { mandatory: e.target.checked })}
                        />
                      }
                      label="Mandatory"
                      sx={{ mr: 0 }}
                    />
                    <Tooltip title="Remove">
                      <IconButton size="small" onClick={() => removeComponent(c.id)} sx={{ color: "#dc2626" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 700, fontSize: 15 }}>
            Total Annual Amount: <Box component="span" sx={{ color: "#15803d" }}>₹{totalAmount.toLocaleString("en-IN")}</Box>
          </Typography>

          <Button
            sx={{ px: 5, py: 1.3, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
            disableElevation
            disabled={mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? "Saving..." : editData ? "Update Structure" : "Save Structure"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}