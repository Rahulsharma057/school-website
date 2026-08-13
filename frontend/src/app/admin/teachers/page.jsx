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
} from "@mui/material";

import {
  PersonOutline,
  EmailOutlined,
  LockOutlined,
  SchoolOutlined,
  PhoneOutlined,
  LocationCityOutlined,
  SaveOutlined,
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
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error while user is typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name
    if (!form.name.trim()) {
      newErrors.name = "Teacher name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      newErrors.email = "Enter a valid email address";
    }

    // Password
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Qualification
    if (!form.qualification.trim()) {
      newErrors.qualification = "Qualification is required";
    }

    // Phone
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number";
    }

    // City
    if (!form.city.trim()) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    createTeacher(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        qualification: form.qualification.trim(),
        phone: form.phone.trim(),
        address: {
          city: form.city.trim(),
        },
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
          });

          setErrors({});
        },
      }
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
    });

    setErrors({});
  };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
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
          Add a new teacher and create their account.
        </Typography>
      </Box>

      {/* Form Card */}
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
        <CardContent
          sx={{
            p: {
              xs: 2,
              sm: 3,
              md: 4,
            },
          }}
        >
          {/* Section Header */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              fontWeight={600}
              sx={{ mb: 0.5 }}
            >
              Teacher Information
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Enter the basic details of the teacher.
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2.5}>
            {/* Name */}
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

            {/* Email */}
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

            {/* Password */}
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
                helperText={
                  errors.password || "Minimum 6 characters"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Qualification */}
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

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                inputProps={{
                  maxLength: 10,
                  inputMode: "numeric",
                }}
                error={Boolean(errors.phone)}
                helperText={
                  errors.phone || "Enter a 10-digit mobile number"
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneOutlined color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* City */}
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

          {/* Footer */}
          <Divider sx={{ my: 3 }} />

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="flex-end"
            spacing={1.5}
          >
            <Button
              variant="outlined"
              disabled={isPending}
              onClick={handleClear}
              sx={{
                minWidth: 110,
                textTransform: "none",
                fontWeight: 600,
              }}
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
                "&:hover": {
                  boxShadow: "none",
                },
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