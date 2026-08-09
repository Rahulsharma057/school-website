"use client";

import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Container,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import { toast } from "react-toastify";

import { updateEntryByEditToken } from "@/services/formEntryService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WIDTH_GRID_MAP = { full: 12, half: 6, third: 4, quarter: 3 };

const evaluateRule = (rule, values) => {
  const watchedValue = values[rule.fieldName];
  const target = rule.value ?? "";

  if (rule.operator === "contains") {
    const arr = Array.isArray(watchedValue) ? watchedValue : [watchedValue];
    return arr.map((v) => String(v)).includes(target);
  }

  const asString =
    watchedValue === undefined || watchedValue === null
      ? ""
      : String(watchedValue);
  if (rule.operator === "notEquals") return asString !== target;
  return asString === target;
};

const isFieldVisible = (field, values) => {
  if (!field.conditional?.enabled || !field.conditional?.rules?.length)
    return true;
  const results = field.conditional.rules.map((rule) =>
    evaluateRule(rule, values),
  );
  return field.conditional.logic === "OR"
    ? results.some(Boolean)
    : results.every(Boolean);
};

const isFieldRequired = (field) => {
  if (field.conditional?.enabled && field.conditional?.requiredWhenVisible)
    return true;
  return Boolean(field.required);
};

export default function FormEditRenderer({ form, entry, token }) {
  const [values, setValues] = useState(entry.data || {});
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  const primaryColor = form.layout?.primaryColor || "#18181b";
  const isWideContainer = form.layout?.columns === 2;

  const existingFilesByField = useMemo(() => {
    const map = {};
    for (const f of entry.files || []) {
      if (!map[f.fieldName]) map[f.fieldName] = [];
      map[f.fieldName].push(f);
    }
    return map;
  }, [entry.files]);

  const sortedFields = useMemo(
    () =>
      [...(form.fields || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [form.fields],
  );

  const visibleFields = sortedFields.filter((f) => isFieldVisible(f, values));

  const setValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const toggleCheckbox = (name, option, checked) => {
    const current = Array.isArray(values[name]) ? values[name] : [];
    const next = checked
      ? [...current, option]
      : current.filter((o) => o !== option);
    setValue(name, next);
  };

  const handleFileChange = (field, fileList) => {
    const selected = Array.from(fileList || []).slice(0, field.maxFiles || 1);
    setFiles((prev) => ({ ...prev, [field.name]: selected }));
    setErrors((prev) => ({ ...prev, [field.name]: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    for (const field of visibleFields) {
      if (field.type === "section") continue;

      const required = isFieldRequired(field);

      if (field.type === "file") {
        const hasExisting = (existingFilesByField[field.name] || []).length > 0;
        const hasNew = (files[field.name] || []).length > 0;
        if (required && !hasExisting && !hasNew) {
          nextErrors[field.name] = "This field is required";
        }
        continue;
      }

      const value = values[field.name];
      const empty =
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (required && empty) {
        nextErrors[field.name] = "This field is required";
        continue;
      }
      if (empty) continue;

      if (["text", "textarea", "email", "phone"].includes(field.type)) {
        const str = String(value).trim();
        if (field.type === "email" && !EMAIL_REGEX.test(str)) {
          nextErrors[field.name] = "Must be a valid email";
          continue;
        }
        if (field.maxLength && str.length > field.maxLength) {
          nextErrors[field.name] =
            `Must be at most ${field.maxLength} characters`;
          continue;
        }
      }

      if (field.type === "number") {
        const num = Number(value);
        if (Number.isNaN(num)) {
          nextErrors[field.name] = "Must be a number";
          continue;
        }
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

      const visibleNames = new Set(
        visibleFields.filter((f) => f.type !== "section").map((f) => f.name),
      );
      const submitValues = Object.fromEntries(
        Object.entries(values).filter(([key]) => visibleNames.has(key)),
      );
      fd.append("data", JSON.stringify(submitValues));

      Object.entries(files).forEach(([name, fileArr]) => {
        if (!visibleNames.has(name)) return;
        (fileArr || []).forEach((file) => fd.append(name, file));
      });

      await updateEntryByEditToken(token, fd);
      setSaved(true);
      toast.success("Your response has been updated");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not save your changes",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (saved) {
    return (
      <Box
        sx={{
          background: "#fafafa",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Container maxWidth="sm">
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 3,
              border: "1px solid #e4e4e7",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                bgcolor: "#dcfce7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.5,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 30, color: "#15803d" }} />
            </Box>
            <Typography
              variant="h5"
              fontWeight={700}
              mb={1}
              sx={{ color: "#18181b" }}
            >
              Updated!
            </Typography>
            <Typography sx={{ color: "#71717a" }}>
              Your response to "{form.title}" has been saved.
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container
        maxWidth={isWideContainer ? "md" : "sm"}
        sx={{ py: { xs: 5, md: 8 } }}
      >
        <Paper
          component="form"
          onSubmit={handleSubmit}
          variant="outlined"
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 3,
            border: "1px solid #e4e4e7",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              color: primaryColor,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              mb: 0.5,
            }}
          >
            Editing your response
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            mb={3}
            sx={{ color: "#18181b", fontSize: { xs: 22, md: 28 } }}
          >
            {form.title}
          </Typography>

          <Grid container spacing={2.5}>
            {visibleFields.map((field) => {
              const errorText = errors[field.name];
              const required = isFieldRequired(field);

              if (field.type === "section") {
                return (
                  <Grid item xs={12} key={field.id}>
                    <Box
                      sx={{ pt: 1, pb: 0.5, borderBottom: "1px solid #e4e4e7" }}
                    >
                      <Typography
                        sx={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}
                      >
                        {field.label}
                      </Typography>
                      {field.helpText && (
                        <Typography
                          sx={{ fontSize: 12.5, color: "#71717a", mt: 0.25 }}
                        >
                          {field.helpText}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                );
              }

              const smWidth = WIDTH_GRID_MAP[field.width] || 12;

              if (
                ["text", "email", "phone", "number", "date"].includes(
                  field.type,
                )
              ) {
                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
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
                      required={required}
                      helperText={errorText || field.helpText}
                      error={Boolean(errorText)}
                      InputLabelProps={
                        field.type === "date" ? { shrink: true } : undefined
                      }
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          "&.Mui-focused fieldset": {
                            borderColor: primaryColor,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: primaryColor,
                        },
                      }}
                    />
                  </Grid>
                );
              }

              if (field.type === "textarea") {
                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      size="small"
                      label={field.label}
                      required={required}
                      helperText={errorText || field.helpText}
                      error={Boolean(errorText)}
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          "&.Mui-focused fieldset": {
                            borderColor: primaryColor,
                          },
                        },
                        "& .MuiInputLabel-root.Mui-focused": {
                          color: primaryColor,
                        },
                      }}
                    />
                  </Grid>
                );
              }

              if (field.type === "select") {
                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={field.label}
                      required={required}
                      value={values[field.name] || ""}
                      onChange={(e) => setValue(field.name, e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          bgcolor: "#fff",
                          "&.Mui-focused fieldset": {
                            borderColor: primaryColor,
                          },
                        },
                      }}
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
                const selected = values[field.name] || "";
                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        mb: 1,
                        color: "#18181b",
                      }}
                    >
                      {field.label}{" "}
                      {required && (
                        <Box component="span" sx={{ color: "#dc2626" }}>
                          *
                        </Box>
                      )}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {(field.options || []).map((opt) => {
                        const isSelected = selected === opt;
                        return (
                          <Box
                            key={opt}
                            onClick={() => setValue(field.name, opt)}
                            sx={{
                              cursor: "pointer",
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              border: `1.5px solid ${isSelected ? primaryColor : "#e4e4e7"}`,
                              bgcolor: isSelected
                                ? `${primaryColor}0d`
                                : "#fff",
                              color: isSelected ? primaryColor : "#3f3f46",
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: 13.5,
                              transition: "all 0.15s",
                              "&:hover": { borderColor: primaryColor },
                            }}
                          >
                            {opt}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Grid>
                );
              }

              if (field.type === "checkbox") {
                const selectedValues = values[field.name] || [];
                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        mb: 1,
                        color: "#18181b",
                      }}
                    >
                      {field.label}{" "}
                      {required && (
                        <Box component="span" sx={{ color: "#dc2626" }}>
                          *
                        </Box>
                      )}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {(field.options || []).map((opt) => {
                        const isSelected = selectedValues.includes(opt);
                        return (
                          <Box
                            key={opt}
                            onClick={() =>
                              toggleCheckbox(field.name, opt, !isSelected)
                            }
                            sx={{
                              cursor: "pointer",
                              px: 2,
                              py: 1,
                              borderRadius: 2,
                              border: `1.5px solid ${isSelected ? primaryColor : "#e4e4e7"}`,
                              bgcolor: isSelected
                                ? `${primaryColor}0d`
                                : "#fff",
                              color: isSelected ? primaryColor : "#3f3f46",
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: 13.5,
                              transition: "all 0.15s",
                              "&:hover": { borderColor: primaryColor },
                            }}
                          >
                            {opt}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Grid>
                );
              }

              if (field.type === "file") {
                const currentFiles = existingFilesByField[field.name] || [];
                const newSelection = files[field.name] || [];
                const maxFiles = field.maxFiles || 1;

                return (
                  <Grid item xs={12} sm={smWidth} key={field.id}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        mb: 1,
                        color: "#18181b",
                      }}
                    >
                      {field.label}{" "}
                      {required && (
                        <Box component="span" sx={{ color: "#dc2626" }}>
                          *
                        </Box>
                      )}
                    </Typography>

                    {currentFiles.length > 0 && newSelection.length === 0 && (
                      <Stack spacing={0.75} sx={{ mb: 1.25 }}>
                        {currentFiles.map((f) => (
                          <Stack
                            key={f.public_id}
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            component="a"
                            href={f.url}
                            target="_blank"
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              border: "1px solid #e4e4e7",
                              borderRadius: 1.5,
                              bgcolor: "#fff",
                              textDecoration: "none",
                              "&:hover": { borderColor: primaryColor },
                            }}
                          >
                            <InsertDriveFileIcon
                              sx={{
                                fontSize: 17,
                                color: "#a1a1aa",
                                flexShrink: 0,
                              }}
                            />
                            <Typography
                              sx={{ fontSize: 12.5, color: "#3f3f46", flex: 1 }}
                              noWrap
                            >
                              {f.originalName || "Current file"}
                            </Typography>
                            <OpenInNewIcon
                              sx={{
                                fontSize: 14,
                                color: "#a1a1aa",
                                flexShrink: 0,
                              }}
                            />
                          </Stack>
                        ))}
                      </Stack>
                    )}

                    <Box
                      component="label"
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.75,
                        py: 2.5,
                        px: 2,
                        border: "1.5px dashed #d4d4d8",
                        borderRadius: 2,
                        bgcolor: "#fafafa",
                        cursor: "pointer",
                        transition: "border-color 0.15s",
                        "&:hover": {
                          borderColor: primaryColor,
                          bgcolor: "#fff",
                        },
                      }}
                    >
                      <CloudUploadIcon
                        sx={{ fontSize: 22, color: "#a1a1aa" }}
                      />
                      <Typography
                        sx={{
                          fontSize: 12.5,
                          color: "#3f3f46",
                          fontWeight: 600,
                        }}
                      >
                        {newSelection.length > 0
                          ? `${newSelection.length} new file(s) selected`
                          : currentFiles.length > 0
                            ? "Click to replace"
                            : "Click to choose a file"}
                      </Typography>
                      <input
                        hidden
                        type="file"
                        multiple={maxFiles > 1}
                        accept={(field.accept || []).join(",") || undefined}
                        onChange={(e) =>
                          handleFileChange(field, e.target.files)
                        }
                      />
                    </Box>

                    {(errorText || field.helpText) && (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: errorText ? "#dc2626" : "#a1a1aa",
                          mt: 1,
                        }}
                      >
                        {errorText || field.helpText}
                      </Typography>
                    )}
                  </Grid>
                );
              }

              return null;
            })}
          </Grid>

          <Stack direction="row" justifyContent="center" mt={4.5}>
            <Button
              type="submit"
              size="large"
              disableElevation
              disabled={submitting}
              sx={{
                px: 6,
                py: 1.4,
                bgcolor: primaryColor,
                color: "#fff",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: 15,
                textTransform: "none",
                minWidth: 180,
                "&:hover": { filter: "brightness(0.9)", bgcolor: primaryColor },
              }}
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
