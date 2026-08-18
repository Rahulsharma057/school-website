"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import { useUserFullProfile } from "@/hooks/useUserManagement";

function Field({ label, value }) {
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
    </Grid>
  );
}

// Users management page ke liye — kisi bhi user row par click karke uska
// full extended profile (agar TEACHER/STUDENT hai) fetch karke dikhata hai.
export default function UserProfileModal({ user, open, onClose }) {
  const { data: profile, isLoading } = useUserFullProfile(user);

  if (!user) return null;
  const isTeacher = user.role === "TEACHER";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {user.name} — <Chip label={user.role} size="small" sx={{ ml: 1 }} />
      </DialogTitle>
      <DialogContent>
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
            <CircularProgress size={26} />
          </Box>
        )}

        {!isLoading && profile && (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Field label="Email" value={profile.user?.email} />
            <Field label="Phone" value={profile.phone} />
            <Field label="Aadhar Number" value={profile.aadharNumber} />
            <Field label="Category" value={profile.category} />
            <Field label="Religion" value={profile.religion} />
            <Field label="Nationality" value={profile.nationality} />
            {isTeacher ? (
              <>
                <Field label="Qualification" value={profile.qualification} />
                <Field label="Employee ID" value={profile.employeeId} />
                <Field label="Experience (yrs)" value={profile.experienceYears} />
                <Field label="Subjects" value={profile.subjects?.join(", ")} />
                <Field label="Class Teacher Of" value={profile.classTeacherOf ? `${profile.classTeacherOf.className} - ${profile.classTeacherOf.section}` : ""} />
              </>
            ) : (
              <>
                <Field label="Roll Number" value={profile.rollNumber} />
                <Field label="Class" value={profile.class ? `${profile.class.className} - ${profile.class.section}` : ""} />
                <Field label="Father's Name" value={profile.fatherName} />
                <Field label="Mother's Name" value={profile.motherName} />
                <Field label="Guardian Occupation" value={profile.guardianOccupation} />
                <Field label="Parent" value={profile.parent ? `${profile.parent.name} (${profile.parent.phone || "no phone"})` : ""} />
                <Field label="Admission Number" value={profile.admissionNumber} />
                <Field label="House" value={profile.house} />
              </>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              {profile.aadharCardUrl && (
                <Button size="small" variant="outlined" href={profile.aadharCardUrl} target="_blank">
                  View Aadhar Document
                </Button>
              )}
            </Grid>
          </Grid>
        )}

        {!isLoading && !profile && (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            No extended profile found for this user.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
