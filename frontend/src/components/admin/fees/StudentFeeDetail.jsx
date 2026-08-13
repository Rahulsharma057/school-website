"use client";

import { useState } from "react";

import {
  Box, Button, Chip, Divider, IconButton, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography,
} from "@mui/material";

import PaymentIcon from "@mui/icons-material/Payment";
import TuneIcon from "@mui/icons-material/Tune";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";

import { useStudentFee, usePaymentHistory, useRemoveCustomComponent } from "@/hooks/fees/useStudentFee";
import { downloadReceiptPdf } from "@/utils/receiptPdf";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import CollectPaymentDialog from "./CollectPaymentDialog";
import CustomizeComponentDialog from "./CustomizeComponentDialog";
import AddCustomComponentDialog from "./AddCustomComponentDialog";

const STATUS_STYLES = {
  PAID: { bg: "#dcfce7", color: "#15803d" },
  PARTIAL: { bg: "#fef3c7", color: "#b45309" },
  PENDING: { bg: "#f4f4f5", color: "#71717a" },
  OVERDUE: { bg: "#fee2e2", color: "#b91c1c" },
};

export default function StudentFeeDetail({ studentFeeId }) {
  const { data: studentFee, isLoading, isError } = useStudentFee(studentFeeId);
  const { data: payments } = usePaymentHistory(studentFeeId);
  const removeComponent = useRemoveCustomComponent(studentFeeId);

  const [payDialog, setPayDialog] = useState(null); // component
  const [customizeDialog, setCustomizeDialog] = useState(null); // component
  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // componentId

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !studentFee) return <EmptyState title="Unable to load fee record" />;

  const student = studentFee.student;
  const progress = studentFee.totalAmount > 0 ? Math.round((studentFee.totalPaid / studentFee.totalAmount) * 100) : 0;

  const handleDownloadReceipt = (payment) => {
    downloadReceiptPdf(payment, {
      studentName: student?.user?.name,
      rollNumber: student?.rollNumber,
      className: studentFee.class ? `${studentFee.class.className || ""} ${studentFee.class.section || ""}`.trim() : "",
      academicYear: studentFee.academicYear,
    });
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" rowGap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
            {student?.user?.name || "Student"} <Typography component="span" sx={{ color: "#a1a1aa", fontSize: 15 }}>({student?.rollNumber})</Typography>
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#71717a" }}>Academic Year: {studentFee.academicYear}</Typography>
        </Box>

        <Chip
          label={studentFee.status}
          sx={{ fontWeight: 700, bgcolor: STATUS_STYLES[studentFee.status]?.bg, color: STATUS_STYLES[studentFee.status]?.color }}
        />
      </Stack>

      <Stack direction="row" spacing={3} flexWrap="wrap" rowGap={2} mb={4}>
        <Box sx={{ flex: 1, minWidth: 200, p: 2, border: "1px solid #e4e4e7", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Total Amount</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#18181b" }}>₹{studentFee.totalAmount.toLocaleString("en-IN")}</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200, p: 2, border: "1px solid #e4e4e7", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Paid</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#15803d" }}>₹{studentFee.totalPaid.toLocaleString("en-IN")}</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 200, p: 2, border: "1px solid #e4e4e7", borderRadius: 2 }}>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>Due</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: studentFee.totalDue > 0 ? "#dc2626" : "#15803d" }}>₹{studentFee.totalDue.toLocaleString("en-IN")}</Typography>
        </Box>
      </Stack>

      <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4, mb: 4, bgcolor: "#f4f4f5", "& .MuiLinearProgress-bar": { bgcolor: "#15803d" } }} />

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography fontWeight={700}>Fee Components</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setAddCustomOpen(true)} sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}>
          Add Custom Component
        </Button>
      </Stack>

      <Stack spacing={2} mb={4}>
        {studentFee.components.map((c) => {
          const due = c.installments.reduce((sum, i) => sum + (i.amount - i.paidAmount), 0);
          return (
            <Box key={c.componentId} sx={{ border: "1px solid #e4e4e7", borderRadius: 2, overflow: "hidden" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, bgcolor: "#fafafa" }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>{c.name}</Typography>
                  <Chip label={c.category} size="small" sx={{ fontSize: 10.5, bgcolor: "#f4f4f5" }} />
                  {c.isCustom && <Chip label="Custom" size="small" sx={{ fontSize: 10.5, bgcolor: "#dbeafe", color: "#1d4ed8" }} />}
                  {c.waived && <Chip label="Waived" size="small" sx={{ fontSize: 10.5, bgcolor: "#f4f4f5", color: "#71717a" }} />}
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  {!c.waived && due > 0 && (
                    <Tooltip title="Collect payment">
                      <IconButton size="small" onClick={() => setPayDialog(c)} sx={{ color: "#15803d" }}>
                        <PaymentIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Customize for this student">
                    <IconButton size="small" onClick={() => setCustomizeDialog(c)} sx={{ color: "#18181b" }}>
                      <TuneIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {c.isCustom && c.installments.every((i) => i.paidAmount === 0) && (
                    <Tooltip title="Remove custom component">
                      <IconButton size="small" onClick={() => setRemoveTarget(c.componentId)} sx={{ color: "#dc2626" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>

              {!c.waived && (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Paid</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {c.installments.map((i) => (
                      <TableRow key={i.installmentNo}>
                        <TableCell>{i.installmentNo}</TableCell>
                        <TableCell>{i.dueDate ? new Date(i.dueDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                        <TableCell align="right">₹{i.amount.toLocaleString("en-IN")}</TableCell>
                        <TableCell align="right">₹{i.paidAmount.toLocaleString("en-IN")}</TableCell>
                        <TableCell align="center">
                          <Chip label={i.status} size="small" sx={{ fontSize: 10.5, fontWeight: 600, bgcolor: STATUS_STYLES[i.status]?.bg, color: STATUS_STYLES[i.status]?.color }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          );
        })}
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Typography fontWeight={700} mb={2}>Payment History</Typography>
      {!payments?.length ? (
        <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>No payments recorded yet.</Typography>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Receipt #</TableCell>
              <TableCell>Component</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell>Collected By</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Receipt</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p._id}>
                <TableCell sx={{ fontFamily: "monospace", fontSize: 12.5 }}>{p.receiptNumber}</TableCell>
                <TableCell>{p.componentName}{p.installmentNo ? ` #${p.installmentNo}` : ""}</TableCell>
                <TableCell align="right">₹{p.amountPaid.toLocaleString("en-IN")}</TableCell>
                <TableCell>{p.paymentMode}</TableCell>
                <TableCell>{p.collectedBy?.name || "—"}</TableCell>
                <TableCell>{new Date(p.paymentDate).toLocaleDateString("en-IN")}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Download receipt">
                    <IconButton size="small" onClick={() => handleDownloadReceipt(p)} sx={{ color: "#18181b" }}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CollectPaymentDialog open={Boolean(payDialog)} onClose={() => setPayDialog(null)} studentFeeId={studentFeeId} component={payDialog} />
      <CustomizeComponentDialog open={Boolean(customizeDialog)} onClose={() => setCustomizeDialog(null)} studentFeeId={studentFeeId} component={customizeDialog} />
      <AddCustomComponentDialog open={addCustomOpen} onClose={() => setAddCustomOpen(false)} studentFeeId={studentFeeId} />

      <ConfirmationDialog
        open={Boolean(removeTarget)}
        title="Remove Component"
        message="This will remove this custom fee component from the student's record."
        loading={removeComponent.isPending}
        confirmText="Remove"
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => removeComponent.mutate(removeTarget, { onSuccess: () => setRemoveTarget(null) })}
      />
    </Box>
  );
}
