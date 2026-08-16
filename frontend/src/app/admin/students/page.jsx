"use client";

import { useState, useEffect } from "react";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
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
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import { useClasses } from "@/hooks/useClasses";
import {
  useCreateStudent,
  useStudentsByClass,
  useUpdateStudentByAdmin,
  useUploadStudentAadhar,
} from "@/hooks/useStudent";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

const avatarColor = (name = "") => {
  const colors = ["#3150fd", "#00897b", "#e65100", "#8e24aa", "#c62828", "#00838f"];
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
  parentName: "",
  parentEmail: "",
  parentPhone: "",
  parentPassword: "",
};

// Admin-only edit dialog — phone, Aadhar, parent details, category etc.
const EMPTY_EDIT_FORM = {
  phone: "",
  aadharNumber: "",
  fatherName: "",
  motherName: "",
  guardianOccupation: "",
  category: "",
  religion: "",
  nationality: "Indian",
};

function StudentEditDialog({ student, open, onClose }) {
  const { mutate: updateStudent, isPending: updating } = useUpdateStudentByAdmin();
  const { mutate: uploadAadhar, isPending: uploading } = useUploadStudentAadhar();

  const [form, setForm] = useState(EMPTY_EDIT_FORM);
  const [aadharFile, setAadharFile] = useState(null);

  // student prop change hone par form fill karo
  // (yeh useEffect hona chahiye — useState apna 2nd argument as deps
  // accept nahi karta, isliye pehle sirf pehli baar hi chalta tha aur
  // dusre student pe Edit click karne par purana data hi dikhta reh jata tha)
  useEffect(() => {
    if (student) {
      setForm({
        phone: student.phone || "",
        aadharNumber: student.aadharNumber || "",
        fatherName: student.fatherName || "",
        motherName: student.motherName || "",
        guardianOccupation: student.guardianOccupation || "",
        category: student.category || "",
        religion: student.religion || "",
        nationality: student.nationality || "Indian",
      });
    } else {
      setForm(EMPTY_EDIT_FORM);
    }

    // naye student ke liye purani file selection carry na ho
    setAadharFile(null);
  }, [student]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = () => {
    if (!student) return;
    updateStudent(
      { studentId: student._id, data: form },
      { onSuccess: () => onClose() },
    );
  };

  const handleAadharUpload = () => {
    if (!aadharFile || !student) return;
    const formData = new FormData();
    formData.append("file", aadharFile);
    uploadAadhar(
      { studentId: student._id, formData },
      { onSuccess: () => setAadharFile(null) },
    );
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit — {student.user?.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Phone" name="phone" value={form.phone} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Aadhar Number" name="aadharNumber" value={form.aadharNumber} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Father's Name" name="fatherName" value={form.fatherName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Mother's Name" name="motherName" value={form.motherName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Guardian Occupation" name="guardianOccupation" value={form.guardianOccupation} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" select label="Category" name="category" value={form.category} onChange={handleChange}>
              <MenuItem value="">—</MenuItem>
              {["GENERAL", "OBC", "SC", "ST", "EWS"].map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Religion" name="religion" value={form.religion} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth size="small" label="Nationality" name="nationality" value={form.nationality} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#52525b", mb: 1 }}>
              Aadhar Card Document
            </Typography>
            {student.aadharCardUrl && (
              <Button
                size="small" variant="outlined" href={student.aadharCardUrl} target="_blank"
                sx={{ textTransform: "none", mb: 1.5, mr: 1.5 }}
              >
                View Current File
              </Button>
            )}
            <Stack direction="row" spacing={1} alignItems="center">
              <Button component="label" size="small" variant="outlined" startIcon={<UploadFileOutlinedIcon />} sx={{ textTransform: "none" }}>
                Choose File
                <input type="file" hidden accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => setAadharFile(e.target.files[0])} />
              </Button>
              {aadharFile && (
                <>
                  <Typography variant="caption" sx={{ color: "#64748b" }}>{aadharFile.name}</Typography>
                  <Button size="small" variant="contained" onClick={handleAadharUpload} disabled={uploading} sx={{ textTransform: "none" }}>
                    {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={updating} sx={{ textTransform: "none", fontWeight: 600 }}>
          {updating ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function StudentsPage() {
  const { data: classes = [] } = useClasses();
  const { mutate: createStudent, isPending } = useCreateStudent();

  const [form, setForm] = useState(EMPTY_FORM);
  const [viewClassId, setViewClassId] = useState("");
  const { data: students = [], isLoading: studentsLoading, refetch } = useStudentsByClass(viewClassId);

  const [editStudent, setEditStudent] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    createStudent(
      {
        name: form.name,
        email: form.email,
        password: form.password,
        classId: form.classId,
        address: { city: form.city },
        dateOfBirth: form.dateOfBirth,
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

  const isFormIncomplete = !form.name || !form.email || !form.password || !form.classId;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f7f8fc", minHeight: "100vh" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #3150fd, #6f7bff)",
          }}
        >
          <SchoolIcon sx={{ color: "#fff" }} />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Students</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage student records and class enrollment. Use "Edit" on any student for Aadhar, parent, and identity details.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* CREATE FORM */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider", position: { md: "sticky" }, top: { md: 16 } }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PersonAddIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Create New Student</Typography>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth label="Full Name" name="name" value={form.name} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonAddIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Email" name="email" type="email" value={form.email} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth type="password" label="Password" name="password" value={form.password} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel shrink>Class</InputLabel>
                  <Select displayEmpty label="Class" name="classId" value={form.classId} onChange={handleChange}
                    startAdornment={<InputAdornment position="start"><ClassIcon fontSize="small" color="action" /></InputAdornment>}>
                    <MenuItem value="" disabled>Select Class</MenuItem>
                    {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="City" name="city" value={form.city} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth type="date" label="Date of Birth" name="dateOfBirth" InputLabelProps={{ shrink: true }} value={form.dateOfBirth} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                  <FamilyRestroomIcon fontSize="small" color="action" />
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#52525b" }}>Parent / Guardian (optional)</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: "#a1a1aa", mt: 0.25 }}>
                  Fill this to auto-create a parent login. Aadhar card, category, and father/mother name can be added after creation via "Edit".
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Parent Name" name="parentName" value={form.parentName} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonAddIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Parent Email" name="parentEmail" type="email" value={form.parentEmail} onChange={handleChange}
                  helperText="Required only if you want a parent login created"
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Parent Phone" name="parentPhone" value={form.parentPhone} onChange={handleChange}
                  placeholder="+91XXXXXXXXXX" helperText="Used for fee-due SMS reminders"
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth size="small" type="password" label="Parent Password (optional)" name="parentPassword" value={form.parentPassword} onChange={handleChange}
                  helperText="Leave blank to auto-generate a random one"
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon fontSize="small" color="action" /></InputAdornment> }} />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth size="large" variant="contained" onClick={handleSubmit}
                  disabled={isPending || isFormIncomplete}
                  startIcon={isPending ? <CircularProgress size={18} color="inherit" /> : <PersonAddIcon />}
                  sx={{ borderRadius: 2, py: 1.2, textTransform: "none", fontWeight: 600 }}
                >
                  {isPending ? "Creating..." : "Create Student"}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* VIEW STUDENTS BY CLASS */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <GroupsIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Students by Class</Typography>
              {viewClassId && students.length > 0 && (
                <Chip label={students.length} size="small" color="primary" sx={{ fontWeight: 700, height: 22 }} />
              )}
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <FormControl sx={{ minWidth: 240, mb: 2.5 }}>
              <InputLabel shrink>Class</InputLabel>
              <Select displayEmpty label="Class" value={viewClassId} onChange={(e) => setViewClassId(e.target.value)}
                startAdornment={<InputAdornment position="start"><ClassIcon fontSize="small" color="action" /></InputAdornment>}>
                <MenuItem value="" disabled>Select Class</MenuItem>
                {classes.map((c) => <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>)}
              </Select>
            </FormControl>

            <Box sx={{ overflowX: "auto", borderRadius: 2 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f4f5fb" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Roll No</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Aadhar</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentsLoading && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><CircularProgress size={26} /></TableCell></TableRow>
                  )}

                  {!studentsLoading && students.map((s) => (
                    <TableRow key={s._id} sx={{ "&:hover": { bgcolor: "#f9fafc" }, "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell><Chip label={s.rollNumber ?? "—"} size="small" variant="outlined" sx={{ fontWeight: 600 }} /></TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: avatarColor(s.user?.name || "?") }}>
                            {getInitials(s.user?.name) || "?"}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{s.user?.name || "—"}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{s.user?.email || "—"}</Typography></TableCell>
                      <TableCell>
                        {s.aadharCardUrl ? (
                          <Chip label="Uploaded" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="Missing" size="small" color="warning" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={s.status} color={s.status === "ACTIVE" ? "success" : "default"} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit official details">
                          <IconButton size="small" onClick={() => setEditStudent(s)} sx={{ color: "#64748b" }}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                  {!studentsLoading && viewClassId && students.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><Typography color="text.secondary">No students in this class</Typography></TableCell></TableRow>
                  )}
                  {!viewClassId && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}><Typography color="text.secondary">Select a class to view students</Typography></TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <StudentEditDialog student={editStudent} open={!!editStudent} onClose={() => setEditStudent(null)} />
    </Box>
  );
}