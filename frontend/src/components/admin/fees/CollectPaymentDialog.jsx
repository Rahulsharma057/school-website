"use client";

import { useState, useEffect } from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { useCollectPayment } from "@/hooks/fees/useStudentFee";

const PAYMENT_MODES = ["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE", "OTHER"];

export default function CollectPaymentDialog({ open, onClose, studentFeeId, component }) {
  const [installmentNo, setInstallmentNo] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [remarks, setRemarks] = useState("");

  const mutation = useCollectPayment(studentFeeId);

  useEffect(() => {
    if (open) {
      setInstallmentNo("");
      setAmountPaid("");
      setPaymentMode("CASH");
      setRemarks("");
    }
  }, [open, component]);

  if (!component) return null;

  const unpaidInstallments = (component.installments || []).filter((i) => i.paidAmount < i.amount);
  const totalDue = unpaidInstallments.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);

  const handleSubmit = () => {
    const amount = Number(amountPaid);
    if (!amount || amount <= 0) return;

    mutation.mutate(
      {
        componentId: component.componentId,
        installmentNo: installmentNo ? Number(installmentNo) : undefined,
        amountPaid: amount,
        paymentMode,
        remarks,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Collect Payment — {component.name}</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 13, color: "#71717a", mb: 2 }}>
          Total due for this component: <b>₹{totalDue.toLocaleString("en-IN")}</b>
        </Typography>

        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              select
              fullWidth
              size="small"
              label="Installment (optional — leave blank to auto-allocate)"
              value={installmentNo}
              onChange={(e) => setInstallmentNo(e.target.value)}
            >
              <MenuItem value="">Auto-allocate across earliest unpaid</MenuItem>
              {unpaidInstallments.map((i) => (
                <MenuItem key={i.installmentNo} value={i.installmentNo}>
                  #{i.installmentNo} — Due ₹{(i.amount - i.paidAmount).toLocaleString("en-IN")}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField fullWidth size="small" type="number" label="Amount (₹)" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          </Grid>
          <Grid size={6}>
            <TextField select fullWidth size="small" label="Payment Mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map((m) => (
                <MenuItem key={m} value={m}>{m.replace("_", " ")}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField fullWidth size="small" label="Remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none", color: "#71717a" }}>Cancel</Button>
        <Button
          variant="contained"
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
          sx={{ bgcolor: "#15803d", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#166534" } }}
        >
          {mutation.isPending ? "Collecting..." : "Collect Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}