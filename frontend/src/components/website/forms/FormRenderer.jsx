"use client";

import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Collapse,
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
import CloseIcon from "@mui/icons-material/Close";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";

import { toast } from "react-toastify";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";

const API = process.env.NEXT_PUBLIC_API_URL;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WIDTH_GRID_MAP = { full: 12, half: 6, third: 4, quarter: 3 };

const HONEYPOT_FIELD_NAME = "_hpw";

const evaluateRule = (rule, values) => {
  const watchedValue = values[rule.fieldName];
  const target = rule.value ?? "";

  if (rule.operator === "contains") {
    const arr = Array.isArray(watchedValue) ? watchedValue : [watchedValue];
    return arr.map((v) => String(v)).includes(target);
  }

  const asString = watchedValue === undefined || watchedValue === null ? "" : String(watchedValue);
  if (rule.operator === "notEquals") return asString !== target;
  return asString === target;
};

const isFieldVisible = (field, values) => {
  if (!field.conditional?.enabled || !field.conditional?.rules?.length) return true;
  const results = field.conditional.rules.map((rule) => evaluateRule(rule, values));
  return field.conditional.logic === "OR" ? results.some(Boolean) : results.every(Boolean);
};

const isFieldRequired = (field) => {
  if (field.conditional?.enabled && field.conditional?.requiredWhenVisible) return true;
  return Boolean(field.required);
};

const formatFileSize = (bytes) => {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function FormRenderer({ form }) {
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const layout = form.layout || { columns: 1, style: "card", primaryColor: "#18181b" };
  const isWideContainer = layout.columns === 2;
  const primaryColor = layout.primaryColor || "#18181b";
  const submission = form.submission || {};
  const honeypotEnabled = form.antiSpam?.honeypotEnabled !== false;

  const sortedFields = useMemo(
    () => [...(form.fields || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [form.fields],
  );

  const visibleFields = sortedFields.filter((f) => isFieldVisible(f, values));
  const requiredCount = visibleFields.filter((f) => f.type !== "section" && isFieldRequired(f)).length;

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

    for (const field of visibleFields) {
      if (field.type === "section") continue;

      const isFileField = field.type === "file";
      const value = isFileField ? files[field.name] : values[field.name];
      const required = isFieldRequired(field);

      const empty = isFileField
        ? !value || value.length === 0
        : value === undefined || value === "" || (Array.isArray(value) && value.length === 0);

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

      if (isFileField && errors[field.name]) {
        nextErrors[field.name] = errors[field.name];
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const doSubmit = async () => {
    setSubmitting(true);

    try {
      const fd = new FormData();

      fd.append("formId", form._id);
      fd.append("source", "route");

      const visibleNames = new Set(visibleFields.filter((f) => f.type !== "section").map((f) => f.name));
      const submitValues = Object.fromEntries(Object.entries(values).filter(([key]) => visibleNames.has(key)));
      fd.append("data", JSON.stringify(submitValues));

      if (honeypotEnabled) {
        fd.append(HONEYPOT_FIELD_NAME, honeypot);
      }

      Object.entries(files).forEach(([name, fileArr]) => {
        if (!visibleNames.has(name)) return;
        (fileArr || []).forEach((file) => fd.append(name, file));
      });

      const res = await fetch(`${API}/form-entries`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(body?.message || "Something went wrong. Please try again.");
      }

      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    if (submission.requireConfirmation) {
      setConfirmOpen(true);
      return;
    }

    doSubmit();
  };

  const wrapperSx =
    layout.style === "minimal"
      ? { p: { xs: 2.5, md: 3.5 } }
      : layout.style === "plain"
        ? { p: { xs: 3, md: 5 }, border: "none", boxShadow: "none" }
        : { p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7" };

  if (submitted) {
    return (
      <Box sx={{ background: "#fafafa", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <Container maxWidth="sm">
          <Paper variant="outlined" sx={{ ...wrapperSx, textAlign: "center" }}>
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

            <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: "#18181b" }}>
              {form.title}
            </Typography>
            <Typography sx={{ color: "#71717a", maxWidth: 420, mx: "auto" }}>{form.successMessage}</Typography>

            {submission.allowSubmitterEdit && (
              <Typography sx={{ fontSize: 12.5, color: "#a1a1aa", mt: 3 }}>
                Need to make a change later? Use the edit link provided by the school for this form.
              </Typography>
            )}
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth={isWideContainer ? "md" : "sm"} sx={{ py: { xs: 5, md: 8 } }}>
        <Paper component="form" onSubmit={handleSubmit} variant="outlined" sx={wrapperSx}>
          <Box mb={form.description ? 1 : 3}>
            <Typography variant="h4" fontWeight={800} sx={{ color: "#18181b", fontSize: { xs: 22, md: 28 }, letterSpacing: "-0.01em" }}>
              {form.title}
            </Typography>
          </Box>

          {form.description && (
            <Typography sx={{ color: "#71717a", mb: 1.5, fontSize: 14.5, lineHeight: 1.6 }}>{form.description}</Typography>
          )}

          {requiredCount > 0 && (
            <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 3 }}>
              Fields marked <Box component="span" sx={{ color: "#dc2626", fontWeight: 700 }}>*</Box> are required
            </Typography>
          )}

          {honeypotEnabled && (
            <Box sx={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
              <TextField
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                label="Leave this field empty"
                name="website"
              />
            </Box>
          )}

          <Grid container spacing={2.5} sx={{ mt: requiredCount > 0 ? 0 : 1 }}>
            {visibleFields.map((field) => {
              const errorText = errors[field.name];
              const required = isFieldRequired(field);

              if (field.type === "section") {
                return (
                  <Grid size={{ xs: 12 }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <Box sx={{ pt: 1, pb: 0.5, borderBottom: "1px solid #e4e4e7" }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#18181b" }}>{field.label}</Typography>
                        {field.helpText && (
                          <Typography sx={{ fontSize: 12.5, color: "#71717a", mt: 0.25 }}>{field.helpText}</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Grid>
                );
              }

              const smWidth = WIDTH_GRID_MAP[field.width] || 12;

              if (["text", "email", "phone", "number", "date"].includes(field.type)) {
                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <TextField
                        fullWidth
                        size="small"
                        type={field.type === "email" ? "email" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                        label={field.label}
                        placeholder={field.placeholder}
                        required={required}
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
                        sx={{
                          "& .MuiOutlinedInput-root": { bgcolor: "#fff", "&.Mui-focused fieldset": { borderColor: primaryColor } },
                          "& .MuiInputLabel-root.Mui-focused": { color: primaryColor },
                        }}
                      />
                    </Collapse>
                  </Grid>
                );
              }

              if (field.type === "textarea") {
                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        size="small"
                        label={field.label}
                        placeholder={field.placeholder}
                        required={required}
                        helperText={errorText || field.helpText}
                        error={Boolean(errorText)}
                        inputProps={{ maxLength: field.maxLength || undefined }}
                        value={values[field.name] || ""}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": { bgcolor: "#fff", "&.Mui-focused fieldset": { borderColor: primaryColor } },
                          "& .MuiInputLabel-root.Mui-focused": { color: primaryColor },
                        }}
                      />
                    </Collapse>
                  </Grid>
                );
              }

              if (field.type === "select") {
                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label={field.label}
                        required={required}
                        helperText={errorText || field.helpText}
                        error={Boolean(errorText)}
                        value={values[field.name] || ""}
                        onChange={(e) => setValue(field.name, e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": { bgcolor: "#fff", "&.Mui-focused fieldset": { borderColor: primaryColor } },
                          "& .MuiInputLabel-root.Mui-focused": { color: primaryColor },
                        }}
                      >
                        {(field.options || []).map((opt) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Collapse>
                  </Grid>
                );
              }

              if (field.type === "radio") {
                const selected = values[field.name] || "";
                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, color: "#18181b" }}>
                          {field.label} {required && <Box component="span" sx={{ color: "#dc2626" }}>*</Box>}
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
                                  bgcolor: isSelected ? `${primaryColor}0d` : "#fff",
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
                        {(errorText || field.helpText) && (
                          <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa", mt: 1 }}>{errorText || field.helpText}</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Grid>
                );
              }

              if (field.type === "checkbox") {
                const selectedValues = values[field.name] || [];
                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, color: "#18181b" }}>
                          {field.label} {required && <Box component="span" sx={{ color: "#dc2626" }}>*</Box>}
                        </Typography>
                        <Stack direction="row" flexWrap="wrap" gap={1}>
                          {(field.options || []).map((opt) => {
                            const isSelected = selectedValues.includes(opt);
                            return (
                              <Box
                                key={opt}
                                onClick={() => toggleCheckbox(field.name, opt, !isSelected)}
                                sx={{
                                  cursor: "pointer",
                                  px: 2,
                                  py: 1,
                                  borderRadius: 2,
                                  border: `1.5px solid ${isSelected ? primaryColor : "#e4e4e7"}`,
                                  bgcolor: isSelected ? `${primaryColor}0d` : "#fff",
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
                        {(errorText || field.helpText) && (
                          <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa", mt: 1 }}>{errorText || field.helpText}</Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Grid>
                );
              }

              if (field.type === "file") {
                const selectedFiles = files[field.name] || [];
                const maxFiles = field.maxFiles || 1;
                const isFull = selectedFiles.length >= maxFiles;

                return (
                  <Grid size={{ xs: 12, sm: smWidth }} key={field.id}>
                    <Collapse in appear timeout={250}>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1, color: "#18181b" }}>
                          {field.label} {required && <Box component="span" sx={{ color: "#dc2626" }}>*</Box>}
                        </Typography>

                        <Box
                          component="label"
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 0.75,
                            py: 3,
                            px: 2,
                            border: `1.5px dashed ${errorText ? "#dc2626" : "#d4d4d8"}`,
                            borderRadius: 2,
                            bgcolor: "#fafafa",
                            cursor: isFull ? "not-allowed" : "pointer",
                            opacity: isFull ? 0.6 : 1,
                            transition: "border-color 0.15s",
                            "&:hover": !isFull ? { borderColor: primaryColor, bgcolor: "#fff" } : {},
                          }}
                        >
                          <CloudUploadIcon sx={{ fontSize: 26, color: "#a1a1aa" }} />
                          <Typography sx={{ fontSize: 13, color: "#3f3f46", fontWeight: 600 }}>
                            {maxFiles > 1 ? `Choose up to ${maxFiles} files` : "Click to choose a file"}
                          </Typography>
                          {field.maxFileSizeMB && (
                            <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }}>Max {field.maxFileSizeMB}MB per file</Typography>
                          )}
                          <input
                            hidden
                            type="file"
                            multiple={maxFiles > 1}
                            disabled={isFull}
                            accept={(field.accept || []).join(",") || undefined}
                            onChange={(e) => handleFileChange(field, e.target.files)}
                          />
                        </Box>

                        {selectedFiles.length > 0 && (
                          <Stack spacing={0.75} sx={{ mt: 1.25 }}>
                            {selectedFiles.map((f, i) => (
                              <Stack
                                key={`${f.name}-${i}`}
                                direction="row"
                                alignItems="center"
                                spacing={1}
                                sx={{ px: 1.5, py: 0.75, border: "1px solid #e4e4e7", borderRadius: 1.5, bgcolor: "#fff" }}
                              >
                                <InsertDriveFileIcon sx={{ fontSize: 17, color: "#a1a1aa", flexShrink: 0 }} />
                                <Typography sx={{ fontSize: 12.5, color: "#3f3f46", flex: 1 }} noWrap>
                                  {f.name}
                                </Typography>
                                <Typography sx={{ fontSize: 11, color: "#a1a1aa", flexShrink: 0 }}>{formatFileSize(f.size)}</Typography>
                                <Box
                                  onClick={() => removeFile(field, i)}
                                  sx={{ display: "flex", cursor: "pointer", color: "#a1a1aa", flexShrink: 0, "&:hover": { color: "#dc2626" } }}
                                >
                                  <CloseIcon sx={{ fontSize: 16 }} />
                                </Box>
                              </Stack>
                            ))}
                          </Stack>
                        )}

                        {(errorText || field.helpText) && (
                          <Typography sx={{ fontSize: 12, color: errorText ? "#dc2626" : "#a1a1aa", mt: 1 }}>{errorText || field.helpText}</Typography>
                        )}
                      </Box>
                    </Collapse>
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
                "&:disabled": { bgcolor: primaryColor, opacity: 0.6, color: "#fff" },
              }}
            >
              {submitting ? "Submitting..." : form.submitButtonText}
            </Button>
          </Stack>
        </Paper>
      </Container>

      <ConfirmationDialog
        open={confirmOpen}
        title="Confirm Submission"
        message={submission.confirmationMessage || "Are you sure you want to submit this form?"}
        loading={submitting}
        confirmText="Submit"
        onClose={() => setConfirmOpen(false)}
        onConfirm={doSubmit}
      />
    </Box>
  );
}