"use client";

import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, LinearProgress, CircularProgress } from "@mui/material";
import { useMySalary } from "@/hooks/useSalary";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const statusColor = { PENDING: "warning", PARTIAL: "info", PAID: "success" };

function SalaryContent() {
  const { data: history = [], isLoading } = useMySalary();
  if (isLoading) return <CircularProgress />;

  if (history.length === 0) return <Typography>No salary records yet.</Typography>;

  return (
    <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f8fafc" }}>
            <TableCell>Month</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((h) => (
            <TableRow key={h._id}>
              <TableCell>{months[h.month - 1]} {h.year}</TableCell>
              <TableCell>₹{h.calculatedSalary}</TableCell>
              <TableCell>
                ₹{h.paidAmount}
                <LinearProgress variant="determinate" value={(h.paidAmount / h.calculatedSalary) * 100} sx={{ mt: 0.5, height: 5, borderRadius: 2 }} />
              </TableCell>
              <TableCell><Chip label={h.status} size="small" color={statusColor[h.status]} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function MySalaryPage() {
  return (
    <PortalGuard allowedRoles={["TEACHER"]}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>My Salary</Typography>
        <SalaryContent />
      </Box>
    </PortalGuard>
  );
}