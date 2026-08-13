"use client";

import PortalGuard from "@/components/PortalGuard";
import { useAuth } from "@/context/AuthContext";
import { Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress } from "@mui/material";
import { useMyTimetable, useMyClassTimetable } from "@/hooks/useTimetable";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const DAY_LABELS = { MON: "Monday", TUE: "Tuesday", WED: "Wednesday", THU: "Thursday", FRI: "Friday", SAT: "Saturday" };

function TimetableContent() {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";

  const teacherQuery = useMyTimetable();
  const studentQuery = useMyClassTimetable();

  const { data: entries = [], isLoading } = isTeacher ? teacherQuery : studentQuery;

  if (isLoading) return <CircularProgress />;

  return (
    <Paper elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f8fafc" }}>
            <TableCell>Day</TableCell>
            <TableCell>Period</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Subject</TableCell>
            {isTeacher ? <TableCell>Class</TableCell> : <TableCell>Teacher</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {DAYS.flatMap((day) =>
            entries
              .filter((e) => e.day === day)
              .sort((a, b) => a.period.periodNumber - b.period.periodNumber)
              .map((e) => (
                <TableRow key={e._id}>
                  <TableCell>{DAY_LABELS[day]}</TableCell>
                  <TableCell>P{e.period?.periodNumber}</TableCell>
                  <TableCell>{e.period?.startTime}-{e.period?.endTime}</TableCell>
                  <TableCell>{e.subject}</TableCell>
                  <TableCell>{isTeacher ? `${e.class?.className}-${e.class?.section}` : e.teacher?.name}</TableCell>
                </TableRow>
              ))
          )}
          {entries.length === 0 && (
            <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: "#94a3b8" }}>No timetable set yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function MyTimetablePage() {
  return (
    <PortalGuard allowedRoles={["TEACHER", "STUDENT"]}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" mb={3}>My Timetable</Typography>
        <TimetableContent />
      </Box>
    </PortalGuard>
  );
}