"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";

import {
  AccountBalanceWallet,
  CheckCircle,
  Pending,
} from "@mui/icons-material";

import { useMyFee } from "@/hooks/fees/useStudentFee";

export default function MyFeesPage() {
  const {
    data: fee,
    isLoading,
    isError,
    error,
  } = useMyFee();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          py: 8,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          {error?.response?.data?.message ||
            "No fee record found for you yet."}
        </Alert>
      </Box>
    );
  }

  if (!fee) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No fee record found.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, mb: 3 }}
      >
        My Fees
      </Typography>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Total Fee
              </Typography>

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ₹{fee.totalAmount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Paid
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "success.main",
                }}
              >
                ₹{fee.totalPaid || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">
                Due
              </Typography>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "error.main",
                }}
              >
                ₹{fee.totalDue || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Components */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Fee Details
          </Typography>

       {fee.components?.map((component) => (
  <Box key={component.componentId} sx={{ mb: 3 }}>
    {/* Component Header */}
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 1,
      }}
    >
      <Box>
        <Typography sx={{ fontWeight: 600 }}>
          {component.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          {component.category}
        </Typography>
      </Box>

      <Chip
        label={
          component.waived
            ? "Waived"
            : component.totalAmount > 0
            ? "Active"
            : "Free"
        }
        color={component.waived ? "warning" : "primary"}
        size="small"
      />
    </Box>

    {/* Component Total */}
    <Typography variant="body2" sx={{ mb: 2 }}>
      Total: ₹{component.totalAmount || 0}
    </Typography>

    {/* Installments */}
    {component.installments?.length > 0 && (
      <Box>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, mb: 1 }}
        >
          Installments
        </Typography>

       {component.installments.map((installment, index) => (
  <Box
    key={`${component.componentId}-${installment.installmentNo}-${index}`}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1.5,
              mb: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              backgroundColor: "#fafafa",
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 600 }}>
                Installment {installment.installmentNo}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Due Date:{" "}
                {installment.dueDate
                  ? new Date(
                      installment.dueDate
                    ).toLocaleDateString("en-IN")
                  : "No date"}
              </Typography>
            </Box>

            <Box sx={{ textAlign: "right" }}>
              <Typography sx={{ fontWeight: 600 }}>
                ₹{installment.amount || 0}
              </Typography>

              <Chip
                size="small"
                label={installment.status || "PENDING"}
                color={
                  installment.status === "PAID"
                    ? "success"
                    : "warning"
                }
              />
            </Box>
          </Box>
        ))}
      </Box>
    )}

    <Divider sx={{ mt: 2 }} />
  </Box>
))}
        </CardContent>
      </Card>
    </Box>
  );
}