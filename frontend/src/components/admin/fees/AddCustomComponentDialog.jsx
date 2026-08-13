"use client";

import { useState } from "react";

import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, MenuItem, TextField } from "@mui/material";
import { toast } from "react-toastify";

import { useAddCustomComponent } from "@/hooks/fees/useStudentFee";

const CATEGORIES = ["TUITION", "EXAM", "REGISTRATION", "UNIFORM", "TRANSPORT", "LIBRARY", "LAB", "SPORTS", "ADMISSION", "OTHER"];

export default function AddCustomComponentDialog({ open, onClose, studentFeeId }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [paymentType, setPaymentType] = useState("ONE_TIME");
  const [amount, setAmount] = useState("");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [startDate, setStartDate] = useState("");

  const mutation = useAddCustomComponent(studentFeeId);

  const handleSubmit = () => {
    if (!name.trim()) return toast.error("Name is required");
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");

    mutation.mutate(
      {
        name,
        category,
        paymentType,
        amount: Number(amount),
        installmentCount: paymentType === "INSTALLMENT" ? Number(installmentCount) : undefined,
        installmentStartDate: startDate || undefined,
      },
      {
        onSuccess: () => {
          setName(""); setAmount(""); setInstallmentCount(1); setStartDate("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Fee Component</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={12}>
            <TextField fullWidth size="small" label="Name" placeholder="Field Trip Fee" value={name} onChange={(e) => setName(e.target.value)} />
          </Grid>
          <Grid size={6}>
            <TextField select fullWidth size="small" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={6}>
            <TextField select fullWidth size="small" label="Payment Type" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
              <MenuItem value="ONE_TIME">One Time</MenuItem>
              <MenuItem value="INSTALLMENT">Installment</MenuItem>
            </TextField>
          </Grid>
          <Grid size={paymentType === "INSTALLMENT" ? 6 : 12}>
            <TextField fullWidth size="small" type="number" label="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Grid>
          {paymentType === "INSTALLMENT" && (
            <>
              <Grid size={6}>
                <TextField fullWidth size="small" type="number" label="Installments" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth size="small" type="date" label="Start Date" InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Grid>
            </>
          )}
        </Grid>
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
          {mutation.isPending ? "Adding..." : "Add Component"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}