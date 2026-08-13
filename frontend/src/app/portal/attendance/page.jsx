"use client";

import PortalGuard from "@/components/PortalGuard";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Chip, CircularProgress } from "@mui/material";
import { useMyAttendance } from "@/hooks/useAttendance";

function AttendanceContent() {
  const { data, isLoading } = useMyAttendance();
  if (isLoading) return <CircularProgress />;

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography>Present: {data?.presentCount} / {data?.totalCount}</Typography>
      </Paper>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.attendance?.map((a, i) => (
              <TableRow key={i}>
                <TableCell>{new Date(a.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip
                    label={a.status}
                    color={a.status === "PRESENT" ? "success" : a.status === "ABSENT" ? "error" : "warning"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}

export default function MyAttendancePage() {
  return (
    <PortalGuard allowedRoles={["STUDENT"]}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>My Attendance</Typography>
        <AttendanceContent />
      </Box>
    </PortalGuard>
  );
}