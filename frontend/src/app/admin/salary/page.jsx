"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, TextField, Button, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, Chip, Stack,
  Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import { PaidOutlined, AddCircleOutline, DownloadOutlined, EventNoteOutlined } from "@mui/icons-material";
import { useAllTeachers } from "@/hooks/useTeacher";
import {
  useSetSalaryStructure,
  useCurrentSalaryStructure,
  useGenerateMonthlySalary,
  useAddPayment,
  useTeacherSalaryHistory,
} from "@/hooks/useSalary";
import { useLeaveQuota, useSetLeaveQuota } from "@/hooks/useLeaveQuota";
import { useAddAdjustment, useAdjustments } from "@/hooks/useSalaryAdjustment";
import { useExportSalary, useExportAttendance } from "@/hooks/useExport";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const statusColor = { PENDING: "warning", PARTIAL: "info", PAID: "success" };
const currentYear = new Date().getFullYear();

export default function SalaryPage() {
  const { data: teachers = [] } = useAllTeachers();
  const [teacherId, setTeacherId] = useState("");
  const [year, setYear] = useState(currentYear);

  const { data: structure } = useCurrentSalaryStructure(teacherId);
  const { data: history = [] } = useTeacherSalaryHistory(teacherId);
  const { data: quota } = useLeaveQuota(teacherId, year);

  const { mutate: setStructure, isPending: settingStructure } = useSetSalaryStructure();
  const { mutate: generateSalary, isPending: generating } = useGenerateMonthlySalary();
  const { mutate: addPayment, isPending: paying } = useAddPayment();
  const { mutate: setQuota, isPending: settingQuota } = useSetLeaveQuota();
  const { mutate: addAdjustment, isPending: adjusting } = useAddAdjustment();
  const { mutate: exportSalary, isPending: exportingSalary } = useExportSalary();
  const { mutate: exportAttendance, isPending: exportingAttendance } = useExportAttendance();

  const [structureForm, setStructureForm] = useState({ basicSalary: "", joiningDate: "" });
  const [genForm, setGenForm] = useState({ month: new Date().getMonth() + 1, year: currentYear });
  const [quotaInput, setQuotaInput] = useState("");

  const [payDialog, setPayDialog] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");

  const [adjustDialog, setAdjustDialog] = useState(null); // salary record
  const [adjustType, setAdjustType] = useState("DEDUCTION");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const { data: adjustments = [] } = useAdjustments(adjustDialog?._id);

  const handleSetStructure = () => {
    if (!teacherId || !structureForm.basicSalary || !structureForm.joiningDate) return;
    setStructure({
      teacherId,
      basicSalary: Number(structureForm.basicSalary),
      joiningDate: structureForm.joiningDate,
    });
  };

  const handleGenerate = () => {
    if (!teacherId) return;
    generateSalary({ teacherId, month: Number(genForm.month), year: Number(genForm.year) });
  };

  const handlePaySubmit = () => {
    if (!payDialog || !payAmount) return;
    addPayment(
      { id: payDialog._id, data: { amount: Number(payAmount), note: payNote } },
      { onSuccess: () => { setPayDialog(null); setPayAmount(""); setPayNote(""); } }
    );
  };

  const handleSetQuota = () => {
    if (!teacherId || !quotaInput) return;
    setQuota({ teacherId, year, totalPaidLeaves: Number(quotaInput) });
  };

  const handleAddAdjustment = () => {
    if (!adjustDialog || !adjustAmount || !adjustReason) return;
    addAdjustment({
      monthlySalaryId: adjustDialog._id,
      type: adjustType,
      amount: Number(adjustAmount),
      reason: adjustReason,
    });
    setAdjustAmount("");
    setAdjustReason("");
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: "#dcfce7", color: "#16a34a", width: 44, height: 44 }}>
          <PaidOutlined />
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#1e293b" }}>
            Teacher Salary & Leave
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Manage salary, leave quota, and payroll
          </Typography>
        </Box>
      </Stack>

      {/* Teacher + Year selector */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Select size="small" displayEmpty value={teacherId} onChange={(e) => setTeacherId(e.target.value)} sx={{ minWidth: 280 }}>
            <MenuItem value="" disabled>Select Teacher</MenuItem>
            {teachers.map((t) => <MenuItem key={t._id} value={t._id}>{t.name} ({t.email})</MenuItem>)}
          </Select>
          <TextField size="small" type="number" label="Year" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ width: 120 }} />
        </Stack>
      </Paper>

      {teacherId && (
        <>
          {/* Salary Structure */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 1 }}>Salary Structure</Typography>
            {structure ? (
              <Box sx={{ mb: 2, p: 2, backgroundColor: "#f0fdf4", borderRadius: 2 }}>
                <Typography variant="body2">
                  Current Basic Salary: <b>₹{structure.basicSalary}</b> | Joining Date: {new Date(structure.joiningDate).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>No salary structure set yet.</Typography>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <TextField label="Basic Salary (₹)" size="small" type="number" value={structureForm.basicSalary} onChange={(e) => setStructureForm({ ...structureForm, basicSalary: e.target.value })} />
              <TextField label="Joining Date" size="small" type="date" InputLabelProps={{ shrink: true }} value={structureForm.joiningDate} onChange={(e) => setStructureForm({ ...structureForm, joiningDate: e.target.value })} />
              <Button variant="contained" onClick={handleSetStructure} disabled={settingStructure} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
                {settingStructure ? "Saving..." : "Update Structure"}
              </Button>
            </Stack>
          </Paper>

          {/* Leave Quota */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <EventNoteOutlined sx={{ color: "#64748b" }} fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
                Paid Leave Quota ({year})
              </Typography>
            </Stack>
            {quota && (
              <Box sx={{ mb: 2, p: 2, backgroundColor: "#eff6ff", borderRadius: 2 }}>
                <Typography variant="body2">
                  Used: <b>{quota.usedPaidLeaves}</b> / <b>{quota.totalPaidLeaves}</b> paid leaves
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((quota.usedPaidLeaves / quota.totalPaidLeaves) * 100, 100)}
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
            )}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Total Paid Leaves / Year" size="small" type="number" value={quotaInput} onChange={(e) => setQuotaInput(e.target.value)} sx={{ width: 220 }} />
              <Button variant="contained" onClick={handleSetQuota} disabled={settingQuota} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
                {settingQuota ? "Saving..." : "Set Quota"}
              </Button>
            </Stack>
          </Paper>

          {/* Generate Monthly Salary */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 2 }}>Generate Monthly Salary</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
              <Select size="small" value={genForm.month} onChange={(e) => setGenForm({ ...genForm, month: e.target.value })}>
                {months.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
              </Select>
              <TextField size="small" type="number" label="Year" value={genForm.year} onChange={(e) => setGenForm({ ...genForm, year: e.target.value })} sx={{ width: 120 }} />
              <Button variant="contained" startIcon={<AddCircleOutline />} onClick={handleGenerate} disabled={generating || !structure} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
                {generating ? "Generating..." : "Generate Salary"}
              </Button>
            </Stack>
            {!structure && (
              <Typography variant="caption" sx={{ color: "#dc2626", mt: 1, display: "block" }}>
                Set salary structure first before generating.
              </Typography>
            )}
          </Paper>

          {/* Export Buttons */}
          <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid #e2e8f0", borderRadius: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155", mb: 2 }}>Export Reports</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                onClick={() => exportAttendance({ teacherId, month: genForm.month, year: genForm.year })}
                disabled={exportingAttendance}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                {exportingAttendance ? "Exporting..." : `Export Attendance (${months[genForm.month - 1]})`}
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadOutlined />}
                onClick={() => exportSalary({ teacherId, year })}
                disabled={exportingSalary}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
              >
                {exportingSalary ? "Exporting..." : `Export Salary (${year})`}
              </Button>
            </Stack>
          </Paper>

          {/* Salary History */}
          <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1e293b" }}>Salary History</Typography>
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Month</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Present/Half/Leave</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Base Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Net Salary</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#475569" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: "#475569" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h._id} hover>
                    <TableCell>{months[h.month - 1]} {h.year}</TableCell>
                    <TableCell>{h.presentDays}P / {h.halfDays}H / {h.paidLeaveDays}PL</TableCell>
                    <TableCell>₹{h.calculatedSalary}</TableCell>
                    <TableCell>
                      <b>₹{h.netSalary ?? h.calculatedSalary}</b>
                      {(h.totalDeductions > 0 || h.totalBonus > 0) && (
                        <Typography variant="caption" sx={{ display: "block", color: "#64748b" }}>
                          {h.totalDeductions > 0 && `-₹${h.totalDeductions} `}
                          {h.totalBonus > 0 && `+₹${h.totalBonus}`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      ₹{h.paidAmount}
                      <LinearProgress variant="determinate" value={(h.paidAmount / (h.netSalary || h.calculatedSalary)) * 100} sx={{ mt: 0.5, height: 5, borderRadius: 2 }} />
                    </TableCell>
                    <TableCell><Chip label={h.status} size="small" color={statusColor[h.status]} /></TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" variant="outlined" onClick={() => setAdjustDialog(h)} sx={{ textTransform: "none" }}>
                          Adjust
                        </Button>
                        {h.status !== "PAID" && (
                          <Button size="small" variant="outlined" color="success" onClick={() => setPayDialog(h)} sx={{ textTransform: "none" }}>
                            Pay
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: "#94a3b8" }}>No salary records yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={!!payDialog} onClose={() => setPayDialog(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Payment</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {payDialog && (
            <Typography variant="body2" sx={{ color: "#64748b" }}>
              Due: ₹{(payDialog.netSalary ?? payDialog.calculatedSalary) - payDialog.paidAmount}
            </Typography>
          )}
          <TextField label="Amount (₹)" type="number" size="small" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          <TextField label="Note (optional)" size="small" value={payNote} onChange={(e) => setPayNote(e.target.value)} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setPayDialog(null)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button variant="contained" onClick={handlePaySubmit} disabled={paying} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {paying ? "Saving..." : "Save Payment"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Adjustment Dialog */}
      <Dialog open={!!adjustDialog} onClose={() => setAdjustDialog(null)} PaperProps={{ sx: { borderRadius: 3, minWidth: 400 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Salary Adjustment</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <ToggleButtonGroup value={adjustType} exclusive size="small" onChange={(e, val) => val && setAdjustType(val)}>
            <ToggleButton value="DEDUCTION" sx={{ textTransform: "none", px: 2 }} color="error">Deduction</ToggleButton>
            <ToggleButton value="BONUS" sx={{ textTransform: "none", px: 2 }} color="success">Bonus</ToggleButton>
          </ToggleButtonGroup>
          <TextField label="Amount (₹)" type="number" size="small" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
          <TextField label="Reason" size="small" multiline rows={2} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} />
          <Button variant="contained" onClick={handleAddAdjustment} disabled={adjusting} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>
            {adjusting ? "Adding..." : "Add Adjustment"}
          </Button>

          {adjustments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "#64748b" }}>Previous Adjustments</Typography>
              {adjustments.map((a) => (
                <Box key={a._id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: "1px solid #f1f5f9" }}>
                  <Typography variant="body2">{a.reason}</Typography>
                  <Typography variant="body2" sx={{ color: a.type === "DEDUCTION" ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                    {a.type === "DEDUCTION" ? "-" : "+"}₹{a.amount}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAdjustDialog(null)} sx={{ textTransform: "none" }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}