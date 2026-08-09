"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Container,
  FormControlLabel,
  FormGroup,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { toast } from "react-toastify";

const API = process.env.NEXT_PUBLIC_API_URL;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FormRenderer({ form }) {
  const [values, setValues] = useState({});
  // files[field.name] is always an array now, so fields with maxFiles > 1
  // can hold more than one selection — matches what the backend already
  // accepts (multer .any() groups multiple files under the same field
  // name), the UI previously only ever kept a single File per field.
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const layout = form.layout || { columns: 1, style: "card", primaryColor: "#18181b" };
  const isTwoCol = layout.columns === 2;
  const primaryColor = layout.primaryColor || "#18181b";

  const sortedFields = [...(form.fields || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggleCheckbox = (name, option, checked) => {
    const current = Array.isArray(values[name]) ? values[name] : [];
    const next = checked ? [...current, option] : current.filter((o) => o !== option);
    setValue(name, next);
  };

  const handleFileChange = (field, fileList) => {
    const maxFiles = field.maxFiles || 1;
    const selected = Array.from(fileList || []).slice(0, maxFiles);

    const fieldErrors = [];
    const allowedTypes = field.accept?.length ? field.accept : [];
    const maxBytes = (field.maxFileSizeMB || 5) * 1024 * 1024;

    for (const file of selected) {
      if (allowedTypes.length && !allowedTypes.includes(file.type)) {
        fieldErrors.push(`"${file.name}" is not an allowed file type`);
      }
      if (file.size > maxBytes) {
        fieldErrors.push(`"${file.name}" exceeds ${field.maxFileSizeMB || 5}MB`);
      }
    }

    setFiles((prev) => ({ ...prev, [field.name]: selected }));
    setErrors((prev) => ({ ...prev, [field.name]: fieldErrors.length ? fieldErrors.join("; ") : undefined }));
  };

  const removeFile = (field, index) => {
    setFiles((prev) => {
      const next = [...(prev[field.name] || [])];
      next.splice(index, 1);
      return { ...prev, [field.name]: next };
    });
  };

  const validate = () => {
    const nextErrors = {};

    for (const field of sortedFields) {
      const isFileField = field.type === "file";
      const value = isFileField ? files[field.name] : values[field.name];

      const empty = isFileField
        ? !value || value.length === 0
        : value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

      if (field.required && empty) {
        nextErrors[field.name] = "This field is required";
        continue;
      }

      if (empty) continue;

      // ---- mirror server-side validateEntryData bounds for fast feedback ----
      if (["text", "textarea", "email", "phone"].includes(field.type)) {
        const str = String(value).trim();

        if (field.type === "email" && !EMAIL_REGEX.test(str)) {
          nextErrors[field.name] = "Must be a valid email";
          continue;
        }
        if (field.minLength && str.length < field.minLength) {
          nextErrors[field.name] = `Must be at least ${field.minLength} characters`;
          continue;
        }
        if (field.maxLength && str.length > field.maxLength) {
          nextErrors[field.name] = `Must be at most ${field.maxLength} characters`;
          continue;
        }
      }

      if (field.type === "number") {
        const num = Number(value);
        if (Number.isNaN(num)) {
          nextErrors[field.name] = "Must be a number";
          continue;
        }
        if (field.min !== null && field.min !== undefined && num < field.min) {
          nextErrors[field.name] = `Must be at least ${field.min}`;
          continue;
        }
        if (field.max !== null && field.max !== undefined && num > field.max) {
          nextErrors[field.name] = `Must be at most ${field.max}`;
          continue;
        }
      }

      // file type/size errors were already computed in handleFileChange —
      // keep them unless the field is otherwise valid
      if (isFileField && errors[field.name]) {
        nextErrors[field.name] = errors[field.name];
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSubmitting(true);

    try {
      const fd = new FormData();

      fd.append("formId", form._id);
      fd.append("source", "route");
      fd.append("data", JSON.stringify(values));

      Object.entries(files).forEach(([name, fileArr]) => {
        (fileArr || []).forEach((file) => fd.append(name, file));
      });

      const res = await fetch(`${API}/form-entries`, {
        method: "POST",
        body: fd,
        // needed so a logged-in submitter's session is recognized when
        // the form's accessControl.viewRoles restricts who can submit
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Something went wrong. Please try again.";
        try {
          const body = await res.json();
          if (body?.message) message = body.message;
        } catch {
          // response wasn't JSON — keep the generic message
        }
        throw new Error(message);
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const wrapperSx =
    layout.style === "minimal"
      ? { p: { xs: 2, md: 3 } }
      : layout.style === "plain"
        ? { p: { xs: 3, md: 5 }, border: "none", boxShadow: "none" }
        : { p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7" };

  if (submitted) {
    return (
      <Box sx={{ background: "#fafafa", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Container maxWidth="sm">
          <Paper variant="outlined" sx={{ ...wrapperSx, textAlign: "center" }}>
            <Typography variant="h5" fontWeight={700} mb={1.5} sx={{ color: "#18181b" }}>
              {form.title}
            </Typography>
            <Typography sx={{ color: "#3f3f46" }}>{form.successMessage}</Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth={isTwoCol ? "md" : "sm"} sx={{ py: { xs: 5, md: 8 } }}>
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={wrapperSx}>
          <Typography
            variant="h4"
            fontWeight={700}
            mb={form.description ? 1 : 3}
            sx={{ color: "#18181b", fontSize: { xs: 24, md: 30 } }}
          >
            {form.title}
          </Typography>

          {form.description && (
            <Typography sx={{ color: "#71717a", mb: 3 }}>{form.description}</Typography>
          )}

          <Grid container spacing={2.5}>
            {sortedFields.map((field) => {
              // width only matters in 2-column layout — single column
              // forces every field full-width regardless of its setting
              const colWidth = isTwoCol && field.width === "half" ? 6 : 12;
              const errorText = errors[field.name];

              if (["text", "email", "phone", "number", "date"].includes(field.type)) {
                return (
                  <Grid item xs={12} sm={colWidth} key={field.id}>
                    <TextField
                      fullWidth
                      size="small"
                      type={
                        field.type === "email"
                          ? "email"
                          : field.type === "number"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : "text"
                      }
                      label={field.label}
                      placeholder={field.placeholder}
                      required={field.required}
                      helperText={errorText || field.helpText}
                      error={Boolean(errorText)}
                      inputProps={
                        field.type === "number"
                          ? { min: field.min ?? undefined, max: field.max ?? undefined }
                          : field.type !== "date"
                            ? { maxLength: field.maxLength || undefined }
                            : undefined
                      }
                      InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    />
                  </Grid>
                );
              }

              if (field.type === "textarea") {
                return (
                  <Grid item xs={12} key={field.id}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      size="small"
                      label={field.label}
                      placeholder={field.placeholder}
                      required={field.required}
                      helperText={errorText || field.helpText}
                      error={Boolean(errorText)}
                      inputProps={{ maxLength: field.maxLength || undefined }}
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    />
                  </Grid>
                );
              }

              if (field.type === "select") {
                return (
                  <Grid item xs={12} sm={colWidth} key={field.id}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={field.label}
                      required={field.required}
                      helperText={errorText || field.helpText}
                      error={Boolean(errorText)}
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    >
                      {(field.options || []).map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                );
              }

              if (field.type === "radio") {
                return (
                  <Grid item xs={12} key={field.id}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      {field.label} {field.required && "*"}
                    </Typography>
                    <RadioGroup
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                    >
                      {(field.options || []).map((opt) => (
                        <FormControlLabel key={opt} value={opt} control={<Radio size="small" />} label={opt} />
                      ))}
                    </RadioGroup>
                    {(errorText || field.helpText) && (
                      <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa" }}>
                        {errorText || field.helpText}
                      </Typography>
                    )}
                  </Grid>
                );
              }

              if (field.type === "checkbox") {
                return (
                  <Grid item xs={12} key={field.id}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      {field.label} {field.required && "*"}
                    </Typography>
                    <FormGroup>
                      {(field.options || []).map((opt) => (
                        <FormControlLabel
                          key={opt}
                          control={
                            <Checkbox
                              size="small"
                              checked={(values[field.name] || []).includes(opt)}
                              onChange={(e) => toggleCheckbox(field.name, opt, e.target.checked)}
                            />
                          }
                          label={opt}
                        />
                      ))}
                    </FormGroup>
                    {(errorText || field.helpText) && (
                      <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa" }}>
                        {errorText || field.helpText}
                      </Typography>
                    )}
                  </Grid>
                );
              }

              if (field.type === "file") {
                const selectedFiles = files[field.name] || [];
                const maxFiles = field.maxFiles || 1;

                return (
                  <Grid item xs={12} sm={colWidth} key={field.id}>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 0.5 }}>
                      {field.label} {field.required && "*"}
                    </Typography>
                    <Button
                      component="label"
                      size="small"
                      disabled={selectedFiles.length >= maxFiles}
                      sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
                    >
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file(s) selected`
                        : maxFiles > 1
                          ? `Choose up to ${maxFiles} files`
                          : "Choose File"}
                      <input
                        hidden
                        type="file"
                        multiple={maxFiles > 1}
                        accept={(field.accept || []).join(",") || undefined}
                        onChange={(e) => handleFileChange(field, e.target.files)}
                      />
                    </Button>

                    {selectedFiles.length > 0 && (
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75} sx={{ mt: 1 }}>
                        {selectedFiles.map((f, i) => (
                          <Chip
                            key={`${f.name}-${i}`}
                            size="small"
                            label={f.name}
                            onDelete={() => removeFile(field, i)}
                          />
                        ))}
                      </Stack>
                    )}

                    {(errorText || field.helpText) && (
                      <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa", mt: 0.5 }}>
                        {errorText || field.helpText}
                      </Typography>
                    )}
                  </Grid>
                );
              }

              return null;
            })}
          </Grid>

          <Stack direction="row" justifyContent="center" mt={4}>
            <Button
              type="submit"
              size="large"
              disableElevation
              disabled={submitting}
              sx={{
                px: 5.5,
                py: 1.5,
                bgcolor: primaryColor,
                color: "#fff",
                borderRadius: "8px",
                fontWeight: 600,
                textTransform: "none",
                "&:hover": { filter: "brightness(0.9)" },
              }}
            >
              {submitting ? "Submitting..." : form.submitButtonText}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
