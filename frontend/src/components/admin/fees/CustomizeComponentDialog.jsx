"use client";

import { useState, useEffect } from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from "@mui/material";

import { useUpdateFeeComponent } from "@/hooks/fees/useStudentFee";

export default function CustomizeComponentDialog({ open, onClose, studentFeeId, component }) {
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState("");
  const [waived, setWaived] = useState(false);
  const [installmentStartDate, setInstallmentStartDate] = useState("");

  const mutation = useUpdateFeeComponent(studentFeeId);

  useEffect(() => {
    if (open && component) {
      setTotalAmount(component.totalAmount ?? "");
      setInstallmentCount(component.installments?.length || 1);
      setWaived(component.waived || false);
      setInstallmentStartDate("");
    }
  }, [open, component]);

  if (!component) return null;

  const alreadyPaid = (component.installments || []).reduce((sum, i) => sum + i.paidAmount, 0);

  const handleSubmit = () => {
    mutation.mutate(
      {
        componentId: component.componentId,
        totalAmount: totalAmount === "" ? undefined : Number(totalAmount),
        waived,
        installmentCount:
          component.paymentType === "INSTALLMENT" && installmentCount ? Number(installmentCount) : undefined,
        installmentStartDate: installmentStartDate || undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Customize — {component.name}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12.5, color: "#71717a", mb: 2 }}>
          Already paid: ₹{alreadyPaid.toLocaleString("en-IN")} — new amount can't go below this.
        </Typography>

        <Stack spacing={2}>
          <FormControlLabel control={<Switch checked={waived} onChange={(e) => setWaived(e.target.checked)} />} label="Waive this fee for this student" />

          {!waived && (
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth size="small" type="number" label="Total Amount (₹)" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              </Grid>
              {component.paymentType === "INSTALLMENT" && (
                <>
                  <Grid size={6}>
                    <TextField fullWidth size="small" type="number" label="Installment Count" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Start Date"
                      InputLabelProps={{ shrink: true }}
                      value={installmentStartDate}
                      onChange={(e) => setInstallmentStartDate(e.target.value)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#71717a" }}>Cancel</Button>
        <Button
          variant="contained"
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
          sx={{ bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
        >
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}