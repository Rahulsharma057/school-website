"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Typography,
  TextField,
  Card,
  CardContent,
  Grid,
  Divider,
  Stack,
  InputAdornment,
  MenuItem,
} from "@mui/material";

import {
  PersonOutline,
  EmailOutlined,
  LockOutlined,
  SchoolOutlined,
  PhoneOutlined,
  LocationCityOutlined,
  SaveOutlined,
  BadgeOutlined,
  EventOutlined,
  WorkHistoryOutlined,
  MenuBookOutlined,
  FingerprintOutlined,
  PublicOutlined,
} from "@mui/icons-material";

import { useCreateTeacher } from "@/hooks/useTeacher";

export default function TeachersPage() {
  const { mutate: createTeacher, isPending } = useCreateTeacher();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    qualification: "",
    phone: "",
    city: "",
    employeeId: "",
    joiningDate: "",
    experienceYears: "",
    subjects: "",
    // Naye admin-only identity fields
    aadharNumber: "",
    category: "",
    religion: "",
    nationality: "Indian",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) newErrors.name = "Teacher name is required";
    else if (form.name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";

    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email address";

    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!form.qualification.trim())
      newErrors.qualification = "Qualification is required";

    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.trim()))
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";

    if (!form.city.trim()) newErrors.city = "City is required";

    if (!form.employeeId.trim())
      newErrors.employeeId = "Employee ID is required";

    if (form.experienceYears && Number(form.experienceYears) < 0)
      newErrors.experienceYears = "Experience can't be negative";

    if (form.aadharNumber && !/^\d{12}$/.test(form.aadharNumber.trim())) {
      newErrors.aadharNumber = "Aadhar number must be 12 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    createTeacher(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        qualification: form.qualification.trim(),
        phone: form.phone.trim(),
        address: { city: form.city.trim() },
        employeeId: form.employeeId.trim(),
        joiningDate: form.joiningDate || undefined,
        experienceYears: form.experienceYears
          ? Number(form.experienceYears)
          : undefined,
        subjects: form.subjects
          ? form.subjects
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined,
        aadharNumber: form.aadharNumber.trim() || undefined,
        category: form.category || undefined,
        religion: form.religion.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
      },
      {
        onSuccess: () => {
          setForm({
            name: "",
            email: "",
            password: "",
            qualification: "",
            phone: "",
            city: "",
            employeeId: "",
            joiningDate: "",
            experienceYears: "",
            subjects: "",
            aadharNumber: "",
            category: "",
            religion: "",
            nationality: "Indian",
          });
          setErrors({});
        },
      },
    );
  };

  const handleClear = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      qualification: "",
      phone: "",
      city: "",
      employeeId: "",
      joiningDate: "",
      experienceYears: "",
      subjects: "",
      aadharNumber: "",
      category: "",
      religion: "",
      nationality: "Indian",
    });
    setErrors({});
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          color="text.primary"
          sx={{ mb: 0.5 }}
        >
          Create Teacher
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Add a new teacher and create their account. Aadhar card document can
          be uploaded after creation from the Teachers list.
        </Typography>
      </Box>

      <Card
        elevation={0}
        sx={{
          maxWidth: 850,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "#fff",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
              Teacher Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the basic details of the teacher.
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teacher Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter teacher name"
                error={Boolean(errors.name)}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutline color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="teacher@example.com"
                error={Boolean(errors.email)}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="password"
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                error={Boolean(errors.password)}
                helperText={errors.password || "Minimum 6 characters"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Qualification"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. B.Ed, M.Ed, M.Sc"
                error={Boolean(errors.qualification)}
                helperText={errors.qualification}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SchoolOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                inputProps={{ maxLength: 10, inputMode: "numeric" }}
                error={Boolean(errors.phone)}
                helperText={errors.phone || "Enter a 10-digit mobile number"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Enter city"
                error={Boolean(errors.city)}
                helperText={errors.city}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationCityOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {/* ===== OFFICIAL DETAILS ===== */}
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BadgeOutlined fontSize="small" color="action" />
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, color: "#52525b" }}
              >
                Official Details
              </Typography>
            </Stack>
            <Typography
              sx={{ fontSize: 11.5, color: "#a1a1aa", mt: 0.25, mb: 2 }}
            >
              Only admins/principal set these. Teacher can't edit them later
              from their own profile.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  label="Employee ID"
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  placeholder="e.g. EMP-0042"
                  error={Boolean(errors.employeeId)}
                  helperText={errors.employeeId}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Joining Date"
                  name="joiningDate"
                  InputLabelProps={{ shrink: true }}
                  value={form.joiningDate}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Experience (years)"
                  name="experienceYears"
                  value={form.experienceYears}
                  onChange={handleChange}
                  error={Boolean(errors.experienceYears)}
                  helperText={errors.experienceYears}
                  inputProps={{ min: 0 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WorkHistoryOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subjects"
                  name="subjects"
                  value={form.subjects}
                  onChange={handleChange}
                  placeholder="e.g. Maths, Physics"
                  helperText="Comma-separated"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MenuBookOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* ===== IDENTITY / STATUTORY DETAILS ===== */}
          <Box sx={{ mt: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FingerprintOutlined fontSize="small" color="action" />
              <Typography
                sx={{ fontSize: 13, fontWeight: 700, color: "#52525b" }}
              >
                Identity Details (optional)
              </Typography>
            </Stack>
            <Typography
              sx={{ fontSize: 11.5, color: "#a1a1aa", mt: 0.25, mb: 2 }}
            >
              Aadhar card document itself can be uploaded after creating the
              teacher, from the Teachers list.
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Aadhar Number"
                  name="aadharNumber"
                  value={form.aadharNumber}
                  onChange={handleChange}
                  placeholder="12-digit number"
                  inputProps={{ maxLength: 12, inputMode: "numeric" }}
                  error={Boolean(errors.aadharNumber)}
                  helperText={errors.aadharNumber}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FingerprintOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <MenuItem value="">—</MenuItem>
                  {["GENERAL", "OBC", "SC", "ST", "EWS"].map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Religion"
                  name="religion"
                  value={form.religion}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nationality"
                  name="nationality"
                  value={form.nationality}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicOutlined color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.5}
          >
            <Button
              variant="outlined"
              disabled={isPending}
              onClick={handleClear}
              sx={{ minWidth: 110, textTransform: "none", fontWeight: 600 }}
            >
              Clear
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              onClick={handleSubmit}
              disabled={isPending}
              sx={{
                minWidth: 160,
                textTransform: "none",
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": { boxShadow: "none" },
              }}
            >
              {isPending ? "Creating..." : "Create Teacher"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
