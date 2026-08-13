"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Select,
  Paper,
  Grid,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  InputAdornment,
  Avatar,
  Divider,
  Stack,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import CakeIcon from "@mui/icons-material/Cake";
import ClassIcon from "@mui/icons-material/Class";
import GroupsIcon from "@mui/icons-material/Groups";
import SchoolIcon from "@mui/icons-material/School";
import PhoneIcon from "@mui/icons-material/Phone";
import FamilyRestroomIcon from "@mui/icons-material/FamilyRestroom";
import { useClasses } from "@/hooks/useClasses";
import { useCreateStudent } from "@/hooks/useStudent";
import { useStudentsByClass } from "@/hooks/useStudent";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const avatarColor = (name = "") => {
  const colors = [
    "#3150fd",
    "#00897b",
    "#e65100",
    "#8e24aa",
    "#c62828",
    "#00838f",
  ];
  const idx = name.charCodeAt(0) % colors.length || 0;
  return colors[idx];
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  classId: "",
  city: "",
  dateOfBirth: "",
  // Parent — optional. If name+email given, a new PARENT user is created
  // and linked; phone here is what feeds the fee-reminder SMS feature.
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  parentPassword: "",
};

export default function StudentsPage() {
  const { data: classes = [] } = useClasses();
  const { mutate: createStudent, isPending } = useCreateStudent();

  const [form, setForm] = useState(EMPTY_FORM);

  const [viewClassId, setViewClassId] = useState("");
  const {
    data: students = [],
    isLoading: studentsLoading,
    refetch,
  } = useStudentsByClass(viewClassId);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    createStudent(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        classId: form.classId,
        address: { city: form.city },
        dateOfBirth: form.dateOfBirth,
        // Only sent when the admin actually filled in parent details —
        // backend creates a new PARENT user + links it when both
        // parentName and parentEmail are present.
        parentName: form.parentName || undefined,
        parentEmail: form.parentEmail || undefined,
        parentPhone: form.parentPhone || undefined,
        parentPassword: form.parentPassword || undefined,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          if (form.classId === viewClassId) refetch();
        },
      },
    );
  };

  const isFormIncomplete =
    !form.name || !form.email || !form.password || !form.classId;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f7f8fc", minHeight: "100vh" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #3150fd, #6f7bff)",
          }}
        >
          <SchoolIcon sx={{ color: "#fff" }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Students
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student records and class enrollment
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* CREATE FORM */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              position: { md: "sticky" },
              top: { md: 16 },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PersonAddIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Create New Student
              </Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonAddIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel shrink>Class</InputLabel>
                  <Select
                    displayEmpty
                    label="Class"
                    name="classId"
                    value={form.classId}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <ClassIcon fontSize="small" color="action" />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="" disabled>
                      Select Class
                    </MenuItem>
                    {classes.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {c.className} - {c.section}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Date of Birth"
                  name="dateOfBirth"
                  InputLabelProps={{ shrink: true }}
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CakeIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* ===== PARENT / GUARDIAN — optional ===== */}
              <Grid item xs={12}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mt: 1 }}
                >
                  <FamilyRestroomIcon fontSize="small" color="action" />
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 700, color: "#52525b" }}
                  >
                    Parent / Guardian (optional)
                  </Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: "#a1a1aa", mt: 0.25 }}>
                  Fill this to auto-create a parent login and enable fee-due SMS
                  reminders.
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Parent Name"
                  name="parentName"
                  value={form.parentName}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonAddIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Parent Email"
                  name="parentEmail"
                  type="email"
                  value={form.parentEmail}
                  onChange={handleChange}
                  helperText="Required only if you want a parent login created"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Parent Phone"
                  name="parentPhone"
                  value={form.parentPhone}
                  onChange={handleChange}
                  placeholder="+91XXXXXXXXXX"
                  helperText="Used for fee-due SMS reminders"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Parent Password (optional)"
                  name="parentPassword"
                  value={form.parentPassword}
                  onChange={handleChange}
                  helperText="Leave blank to auto-generate a random one"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={isPending || isFormIncomplete}
                  startIcon={
                    isPending ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PersonAddIcon />
                    )
                  }
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  {isPending ? "Creating..." : "Create Student"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* VIEW STUDENTS BY CLASS */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <GroupsIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Students by Class
              </Typography>
              {viewClassId && students.length > 0 && (
                <Chip
                  label={students.length}
                  size="small"
                  color="primary"
                  sx={{ fontWeight: 700, height: 22 }}
                />
              )}
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <FormControl sx={{ minWidth: 240, mb: 2.5 }}>
              <InputLabel shrink>Class</InputLabel>
              <Select
                displayEmpty
                label="Class"
                value={viewClassId}
                onChange={(e) => setViewClassId(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <ClassIcon fontSize="small" color="action" />
                  </InputAdornment>
                }
              >
                <MenuItem value="" disabled>
                  Select Class
                </MenuItem>
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>
                    {c.className} - {c.section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f4f5fb" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>City</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsLoading && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <CircularProgress size={26} />
                      </TableCell>
                    </TableRow>
                  )}

                  {!studentsLoading &&
                    students.map((s) => (
                      <TableRow
                        key={s._id}
                        sx={{
                          "&:hover": { bgcolor: "#f9fafc" },
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell>
                          <Chip
                            label={s.rollNumber ?? "—"}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1.5}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 13,
                                bgcolor: avatarColor(s.user?.name || "?"),
                              }}
                            >
                              {getInitials(s.user?.name) || "?"}
                            </Avatar>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
                              {s.user?.name || "—"}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {s.user?.email || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.address?.city || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.status}
                            color={
                              s.status === "ACTIVE" ? "success" : "default"
                            }
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}

                  {!studentsLoading && viewClassId && students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          No students in this class
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}

                  {!viewClassId && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography color="text.secondary">
                          Select a class to view students
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
