"use client";

import { useAuth } from "@/context/AuthContext";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";
import { useMyStudentProfile } from "@/hooks/useStudent";
import { useMyTeacherProfile } from "@/hooks/useTeacher";

function StudentProfileView() {
  const { data: profile, isLoading } = useMyStudentProfile();
  if (isLoading) return <CircularProgress />;
  if (!profile) return <Typography>Profile not found</Typography>;

  return (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography>Name: {profile.user?.name}</Typography>
      <Typography>Email: {profile.user?.email}</Typography>
      <Typography>Class: {profile.class?.className} - {profile.class?.section}</Typography>
      <Typography>Roll No: {profile.rollNumber}</Typography>
      <Typography>City: {profile.address?.city}</Typography>
    </Paper>
  );
}

function TeacherProfileView() {
  const { data: profile, isLoading } = useMyTeacherProfile();
  if (isLoading) return <CircularProgress />;
  if (!profile) return <Typography>Profile not found</Typography>;

  return (
    <Paper sx={{ p: 3, maxWidth: 500 }}>
      <Typography>Name: {profile.user?.name}</Typography>
      <Typography>Email: {profile.user?.email}</Typography>
      <Typography>Qualification: {profile.qualification}</Typography>
      <Typography>Phone: {profile.phone}</Typography>
    </Paper>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>My Profile</Typography>
      {user?.role === "STUDENT" && <StudentProfileView />}
      {user?.role === "TEACHER" && <TeacherProfileView />}
      {!["STUDENT", "TEACHER"].includes(user?.role) && (
        <Typography>Name: {user?.name} | Email: {user?.email} | Role: {user?.role}</Typography>
      )}
    </Box>
  );
}