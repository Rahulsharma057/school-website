"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
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
  Select,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Badge,
  Pagination,
} from "@mui/material";

// Icons
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import { useClasses } from "@/hooks/useClasses";

import {
  useCreateStudent,
  useStudents,
  useUpdateStudentByAdmin,
  useDeleteStudent,
  useUploadStudentAadhar,
  useUploadStudentDocument,
  useDeleteStudentDocument,
  useDownloadStudentProfile,  useImportStudents,
  useExportStudents,
} from "@/hooks/useStudent";

import { downloadFile, isImageUrl } from "@/utils/downloadFile";

import ProfileViewDialog from "@/components/admin/profile/ProfileViewDialog";

// ======================================================
// CONSTANTS
// ======================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const AADHAR_REGEX = /^\d{12}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const DOCUMENT_TYPES = [
  {
    value: "BIRTH_CERTIFICATE",
    label: "Birth Certificate",
  },
  {
    value: "TRANSFER_CERTIFICATE",
    label: "Transfer Certificate",
  },
  {
    value: "MARKSHEET",
    label: "Marksheet",
  },
  {
    value: "CASTE_CERTIFICATE",
    label: "Caste Certificate",
  },
  {
    value: "MEDICAL_CERTIFICATE",
    label: "Medical Certificate",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const DOCUMENT_TYPE_LABELS = DOCUMENT_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

const AVATAR_COLORS = [
  "#6d28d9",
  "#00897b",
  "#e65100",
  "#8e24aa",
  "#c62828",
  "#00838f",
];

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const avatarColor = (name = "") => {
  const code = name?.trim()?.charCodeAt(0);

  const index = Number.isFinite(code) ? code % AVATAR_COLORS.length : 0;

  return AVATAR_COLORS[index];
};

function safeFileName(name, suffix) {
  return `${(name || "student").replace(/[^a-z0-9]/gi, "_")}_${suffix}`;
}

// ======================================================
// COMMON STYLES
// ======================================================

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: "#fff",
    fontSize: 13,
  },

  "& .MuiInputLabel-root": {
    fontSize: 13,
  },
};

const primaryButtonSx = {
  borderRadius: 2,
  textTransform: "none",
  fontWeight: 700,
  boxShadow: "none",

  "&:hover": {
    boxShadow: "0 6px 18px rgba(49,80,253,.18)",
  },
};

// ======================================================
// PREVIEW ITEM
// ======================================================

function PreviewItem({ url, title, downloadName }) {
  const [downloading, setDownloading] = useState(false);

  

  const isImage = isImageUrl(url);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadFile(url, downloadName);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: "1px solid #e8e1f2",
        overflow: "hidden",
        bgcolor: "#fff",
        transition: "all .2s ease",

        "&:hover": {
          borderColor: "#c7d2fe",
          boxShadow: "0 8px 25px rgba(15,23,42,.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Box
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
        sx={{
          height: {
            xs: 105,
            sm: 125,
          },

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          cursor: "pointer",

          bgcolor: "#f1f5ff",

          backgroundImage: isImage ? `url(${url})` : "none",

          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {!isImage && (
          <Box
            sx={{
              width: 55,
              height: 55,
              borderRadius: 2,
              bgcolor: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PictureAsPdfOutlinedIcon
              sx={{
                fontSize: 32,
                color: "#6d28d9",
              }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ p: 1.25 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: "#1e293b",
            mb: 1,
          }}
          noWrap
        >
          {title}
        </Typography>

        <Stack direction="row" spacing={0.75}>
          <Button
            size="small"
            fullWidth
            variant="outlined"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
            sx={{
              textTransform: "none",
              fontSize: 11.5,
              borderRadius: 1.5,
            }}
          >
            View
          </Button>

          <Button
            size="small"
            fullWidth
            variant="contained"
            onClick={handleDownload}
            disabled={downloading}
            startIcon={
              downloading ? (
                <CircularProgress size={12} color="inherit" />
              ) : (
                <DownloadOutlinedIcon sx={{ fontSize: 14 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontSize: 11.5,
              borderRadius: 1.5,
            }}
          >
            {downloading ? "..." : "Save"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

// ======================================================
// CREATE STUDENT
// ======================================================

const EMPTY_CREATE_FORM = {
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

function validateCreateForm(form) {
  const errors = {};

  if (!form.name.trim()) {
    errors.name = "Name is required";
  }

  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Enter a valid email";
  }

  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 6) {
    errors.password = "Minimum 6 characters";
  }

  if (!form.classId) {
    errors.classId = "Select a class";
  }

  if (form.dateOfBirth) {
    const dob = new Date(form.dateOfBirth);

    if (dob > new Date()) {
      errors.dateOfBirth = "Date of birth cannot be in the future";
    }
  }

  const parentTouched =
    form.parentName ||
    form.parentEmail ||
    form.parentPhone ||
    form.parentPassword;

  if (parentTouched) {
    if (!form.parentName.trim()) {
      errors.parentName = "Required to create a parent login";
    }

    if (!form.parentEmail.trim()) {
      errors.parentEmail = "Required to create a parent login";
    } else if (!EMAIL_REGEX.test(form.parentEmail.trim())) {
      errors.parentEmail = "Enter a valid email";
    }
  }

  if (form.parentPhone && !PHONE_REGEX.test(form.parentPhone.trim())) {
    errors.parentPhone = "Enter a valid 10-digit mobile number";
  }

  return errors;
}

function CreateStudentDialog({ open, onClose, classes }) {
  const { mutate: createStudent, isPending } = useCreateStudent();

  const [form, setForm] = useState(EMPTY_CREATE_FORM);

  const [errors, setErrors] = useState({});

  const handleClose = () => {
    setForm(EMPTY_CREATE_FORM);
    setErrors({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = () => {
    const validationErrors = validateCreateForm(form);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    createStudent(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        classId: form.classId,

        address: {
          city: form.city.trim(),
        },

        dateOfBirth: form.dateOfBirth || undefined,

        parentName: form.parentName.trim() || undefined,

        parentEmail: form.parentEmail.trim() || undefined,

        parentPhone: form.parentPhone.trim() || undefined,

        parentPassword: form.parentPassword || undefined,
      },
      {
        onSuccess: handleClose,
      },
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={typeof window !== "undefined" && window.innerWidth < 600}
      PaperProps={{
        sx: {
          borderRadius: {
            xs: 0,
            sm: 3,
          },
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },

          py: 1.25,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          borderBottom: "1px solid #eef0f4",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: "#eef2ff",
              color: "#6d28d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonAddIcon />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              Create Student
            </Typography>

            <Typography
              sx={{
                fontSize: 11.5,
                color: "#94a3b8",
              }}
            >
              Add student and optional guardian account
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: {
            xs: 2,
            sm: 3,
          },
        }}
      >
        <Box
          sx={{
            p: 1.5,
            mb: 1.25,
            borderRadius: 2,
            bgcolor: "#f8fafc",
            border: "1px solid #eef0f4",
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 800,
              color: "#334155",
              mb: 0.5,
            }}
          >
            Student Information
          </Typography>

          <Typography
            sx={{
              fontSize: 11.5,
              color: "#94a3b8",
            }}
          >
            Basic login and admission details.
          </Typography>
        </Box>

        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAddIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="password"
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || "Minimum 6 characters"}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              select
              label="Class"
              name="classId"
              value={form.classId}
              onChange={handleChange}
              error={!!errors.classId}
              helperText={errors.classId}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ClassIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>
                Select Class
              </MenuItem>

              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.className} - {c.section}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date of Birth"
              name="dateOfBirth"
              InputLabelProps={{
                shrink: true,
              }}
              value={form.dateOfBirth}
              onChange={handleChange}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CakeIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="City"
              name="city"
              value={form.city}
              onChange={handleChange}
              sx={inputSx}
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
            <Divider sx={{ my: 0.5 }} />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FamilyRestroomIcon fontSize="small" color="action" />

              <Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#334155",
                  }}
                >
                  Parent / Guardian
                </Typography>

                <Typography
                  sx={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  Optional parent login
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Parent Name"
              name="parentName"
              value={form.parentName}
              onChange={handleChange}
              error={!!errors.parentName}
              helperText={errors.parentName}
              sx={inputSx}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Parent Email"
              name="parentEmail"
              type="email"
              value={form.parentEmail}
              onChange={handleChange}
              error={!!errors.parentEmail}
              helperText={errors.parentEmail}
              sx={inputSx}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Parent Phone"
              name="parentPhone"
              value={form.parentPhone}
              onChange={handleChange}
              placeholder="9876543210"
              error={!!errors.parentPhone}
              helperText={errors.parentPhone || "Used for SMS reminders"}
              sx={inputSx}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Parent Password"
              name="parentPassword"
              value={form.parentPassword}
              onChange={handleChange}
              helperText="Leave blank to auto-generate"
              sx={inputSx}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: 2,
            sm: 3,
          },
          py: 1.25,
          borderTop: "1px solid #eef0f4",
          gap: 1,
        }}
      >
        <Button
          onClick={handleClose}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <PersonAddIcon />
            )
          }
          sx={primaryButtonSx}
        >
          {isPending ? "Creating..." : "Create Student"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ======================================================
// DELETE DIALOG
// ======================================================

function DeleteStudentDialog({ student, open, onClose }) {
  const { mutate: deleteStudent, isPending } = useDeleteStudent();

  const handleConfirm = () => {
    if (!student) return;

    deleteStudent(student._id, {
      onSuccess: onClose,
    });
  };

  if (!student) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 800,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "#fef2f2",
            color: "#dc2626",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningAmberOutlinedIcon />
        </Box>
        Delete Student
      </DialogTitle>

      <DialogContent>
        <Typography
          sx={{
            fontSize: 13,
            color: "#6f6680",
            lineHeight: 1.7,
          }}
        >
          Are you sure you want to permanently delete{" "}
          <strong>{student.user?.name}</strong>
          {student.rollNumber ? ` (Roll No. ${student.rollNumber})` : ""}?
        </Typography>

        <Box
          sx={{
            mt: 1.25,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <Typography
            sx={{
              fontSize: 11.5,
              color: "#c2410c",
              fontWeight: 600,
            }}
          >
            This will remove the student's login, profile and uploaded
            documents. This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleConfirm}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
          }}
        >
          {isPending ? "Deleting..." : "Delete Permanently"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ======================================================
// EDIT FORM
// ======================================================

const EMPTY_EDIT_FORM = {
  phone: "",
  dateOfBirth: "",
  status: "ACTIVE",
  admissionNumber: "",
  admissionDate: "",
  previousSchool: "",
  house: "",
  aadharNumber: "",
  fatherName: "",
  motherName: "",
  guardianOccupation: "",
  category: "",
  religion: "",
  nationality: "Indian",
  transportMode: "",
  busRoute: "",
  medicalConditions: "",

  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
  },

  emergencyContact: {
    name: "",
    phone: "",
    relation: "",
  },
};

function toDateInput(value) {
  if (!value) return "";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())) return "";

  return d.toISOString().slice(0, 10);
}

function validateEditForm(form) {
  const errors = {};

  if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = "Enter a valid 10-digit mobile number";
  }

  if (form.aadharNumber && !AADHAR_REGEX.test(form.aadharNumber.trim())) {
    errors.aadharNumber = "Aadhar must be exactly 12 digits";
  }

  if (
    form.address?.pincode &&
    !PINCODE_REGEX.test(form.address.pincode.trim())
  ) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }

  if (
    form.emergencyContact?.phone &&
    !PHONE_REGEX.test(form.emergencyContact.phone.trim())
  ) {
    errors.emergencyPhone = "Enter a valid 10-digit mobile number";
  }

  if (form.dateOfBirth) {
    const dob = new Date(form.dateOfBirth);

    if (dob > new Date()) {
      errors.dateOfBirth = "Date of birth cannot be in the future";
    }
  }

  return errors;
}

// ======================================================
// EDIT STUDENT DIALOG
// ======================================================

function StudentEditDialog({ student, open, onClose }) {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const { mutate: updateStudent, isPending: updating } =
    useUpdateStudentByAdmin();

  const { mutate: uploadAadhar, isPending: uploadingAadhar } =
    useUploadStudentAadhar();

  const { mutate: uploadDocument, isPending: uploadingDocument } =
    useUploadStudentDocument();

  const { mutate: deleteDocument, isPending: deletingDocument } =
    useDeleteStudentDocument();

  const { mutate: downloadProfile, isPending: downloadingProfile } =
    useDownloadStudentProfile();

  const [tab, setTab] = useState(0);

  const [form, setForm] = useState(EMPTY_EDIT_FORM);

  const [errors, setErrors] = useState({});

  const [aadharFront, setAadharFront] = useState(null);

  const [aadharBack, setAadharBack] = useState(null);

  const [docType, setDocType] = useState("OTHER");

  const [docLabel, setDocLabel] = useState("");

  const [docFiles, setDocFiles] = useState([]);

  useEffect(() => {
    if (!student) return;

    setForm({
      phone: student.phone || "",
      dateOfBirth: toDateInput(student.dateOfBirth),
      status: student.status || "ACTIVE",
      admissionNumber: student.admissionNumber || "",
      admissionDate: toDateInput(student.admissionDate),
      previousSchool: student.previousSchool || "",
      house: student.house || "",
      aadharNumber: student.aadharNumber || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
      guardianOccupation: student.guardianOccupation || "",
      category: student.category || "",
      religion: student.religion || "",
      nationality: student.nationality || "Indian",
      transportMode: student.transportMode || "",
      busRoute: student.busRoute || "",
      medicalConditions: student.medicalConditions || "",

      address: {
        street: student.address?.street || "",
        city: student.address?.city || "",
        state: student.address?.state || "",
        pincode: student.address?.pincode || "",
      },

      emergencyContact: {
        name: student.emergencyContact?.name || "",
        phone: student.emergencyContact?.phone || "",
        relation: student.emergencyContact?.relation || "",
      },
    });

    setErrors({});
    setTab(0);
    setAadharFront(null);
    setAadharBack(null);
    setDocFiles([]);
    setDocLabel("");
    setDocType("OTHER");
  }, [student?._id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,

      address: {
        ...prev.address,
        [name]: value,
      },
    }));

    if (name === "pincode" && errors.pincode) {
      setErrors((prev) => ({
        ...prev,
        pincode: undefined,
      }));
    }
  };

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,

      emergencyContact: {
        ...prev.emergencyContact,
        [name]: value,
      },
    }));

    if (name === "phone" && errors.emergencyPhone) {
      setErrors((prev) => ({
        ...prev,
        emergencyPhone: undefined,
      }));
    }
  };

  const handleSave = () => {
    if (!student) return;

    const validationErrors = validateEditForm(form);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      setTab(0);
      return;
    }

    updateStudent(
      {
        studentId: student._id,
        data: form,
      },
      {
        onSuccess: onClose,
      },
    );
  };

  const handleAadharUpload = () => {
    if ((!aadharFront && !aadharBack) || !student) {
      return;
    }

    const formData = new FormData();

    if (aadharFront) {
      formData.append("aadharFront", aadharFront);
    }

    if (aadharBack) {
      formData.append("aadharBack", aadharBack);
    }

    uploadAadhar(
      {
        studentId: student._id,
        formData,
      },
      {
        onSuccess: () => {
          setAadharFront(null);
          setAadharBack(null);
        },
      },
    );
  };

  const handleDocumentUpload = () => {
    if (!docFiles.length || !student) {
      return;
    }

    const formData = new FormData();

    docFiles.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("type", docType);

    if (docLabel) {
      formData.append("label", docLabel);
    }

    uploadDocument(
      {
        studentId: student._id,
        formData,
      },
      {
        onSuccess: () => {
          setDocFiles([]);
          setDocLabel("");
        },
      },
    );
  };

  const handleDownloadProfile = () => {
    if (!student) return;

    downloadProfile({
      studentId: student._id,
      studentName: student.user?.name,
    });
  };

  if (!student) return null;

  const hasAnyPreview =
    student.profilePhoto ||
    student.aadharFrontUrl ||
    student.aadharBackUrl ||
    student.documents?.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          overflow: "hidden",
          height: isMobile ? "100%" : "auto",
          maxHeight: isMobile ? "100%" : "92vh",
        },
      }}
    >
      {/* HEADER */}

      <DialogTitle
        sx={{
          px: {
            xs: 1.5,
            sm: 2.5,
          },

          py: 1.5,

          borderBottom: "1px solid #eef0f4",

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
          <Badge
            overlap="circular"
            variant="dot"
            color={student.status === "ACTIVE" ? "success" : "default"}
          >
            <Avatar
              src={student.profilePhoto || undefined}
              sx={{
                width: 42,
                height: 42,
                fontSize: 14,
                fontWeight: 800,
                bgcolor: avatarColor(student.user?.name),
              }}
            >
              {getInitials(student.user?.name)}
            </Avatar>
          </Badge>

          <Box minWidth={0}>
            <Typography
              noWrap
              sx={{
                fontSize: 15,
                fontWeight: 800,
                color: "#172033",
              }}
            >
              {student.user?.name || "Student"}
            </Typography>

            <Stack
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{ mt: 0.25 }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: 11,
                  color: "#94a3b8",
                }}
              >
                {student.rollNumber ? `Roll ${student.rollNumber}` : "Student"}
              </Typography>

              {student.admissionNumber && (
                <>
                  <Typography
                    sx={{
                      color: "#cbd5e1",
                    }}
                  >
                    •
                  </Typography>

                  <Typography
                    noWrap
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    Adm. {student.admissionNumber}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.25}>
          <Tooltip title="Download profile">
            <span>
              <IconButton
                size="small"
                onClick={handleDownloadProfile}
                disabled={downloadingProfile}
                sx={{
                  bgcolor: "#f8fafc",
                }}
              >
                {downloadingProfile ? (
                  <CircularProgress size={18} />
                ) : (
                  <DownloadOutlinedIcon fontSize="small" />
                )}
              </IconButton>
            </span>
          </Tooltip>

          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      {/* TABS */}

      <Tabs
        value={tab}
        onChange={(_, value) => setTab(value)}
        variant="fullWidth"
        sx={{
          minHeight: 48,
          borderBottom: "1px solid #eef0f4",

          "& .MuiTab-root": {
            minHeight: 48,
            textTransform: "none",
            fontSize: 12.5,
            fontWeight: 700,
          },
        }}
      >
        <Tab label="Details" />

        <Tab
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>Documents</span>

              {student.documents?.length > 0 && (
                <Chip
                  label={student.documents.length}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                />
              )}
            </Stack>
          }
        />

        <Tab label="Preview" />
      </Tabs>

      <DialogContent
        sx={{
          p: {
            xs: 1.5,
            sm: 2.5,
          },

          bgcolor: "#fbfcfe",
        }}
      >
        {/* =================================================
            DETAILS
        ================================================= */}

        {tab === 0 && (
          <Stack spacing={2}>
            {/* PERSONAL */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1e293b",
                  mb: 1,
                }}
              >
                Personal & Admission
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Date of Birth"
                    name="dateOfBirth"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    error={!!errors.dateOfBirth}
                    helperText={errors.dateOfBirth}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    sx={inputSx}
                  >
                    {["ACTIVE", "LEFT", "GRADUATED"].map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="House"
                    name="house"
                    value={form.house}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Admission Number"
                    name="admissionNumber"
                    value={form.admissionNumber}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Admission Date"
                    name="admissionDate"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    value={form.admissionDate}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Previous School"
                    name="previousSchool"
                    value={form.previousSchool}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* FAMILY */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1e293b",
                  mb: 1,
                }}
              >
                Family & Identity
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Father's Name"
                    name="fatherName"
                    value={form.fatherName}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mother's Name"
                    name="motherName"
                    value={form.motherName}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Guardian Occupation"
                    name="guardianOccupation"
                    value={form.guardianOccupation}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Aadhar Number"
                    name="aadharNumber"
                    value={form.aadharNumber}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 12);

                      setForm((prev) => ({
                        ...prev,
                        aadharNumber: value,
                      }));
                    }}
                    inputProps={{
                      inputMode: "numeric",
                      maxLength: 12,
                    }}
                    error={!!errors.aadharNumber}
                    helperText={
                      errors.aadharNumber ||
                      `${form.aadharNumber.length}/12 digits`
                    }
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Category"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    sx={inputSx}
                  >
                    <MenuItem value="">—</MenuItem>

                    {["GENERAL", "OBC", "SC", "ST", "EWS"].map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Religion"
                    name="religion"
                    value={form.religion}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nationality"
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* ADDRESS */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1e293b",
                  mb: 1,
                }}
              >
                Address
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Street"
                    name="street"
                    value={form.address.street}
                    onChange={handleAddressChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="City"
                    name="city"
                    value={form.address.city}
                    onChange={handleAddressChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="State"
                    name="state"
                    value={form.address.state}
                    onChange={handleAddressChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Pincode"
                    name="pincode"
                    value={form.address.pincode}
                    onChange={handleAddressChange}
                    error={!!errors.pincode}
                    helperText={errors.pincode}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* EMERGENCY + TRANSPORT */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#1e293b",
                  mb: 1,
                }}
              >
                Emergency & Transport
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Contact"
                    name="name"
                    value={form.emergencyContact.name}
                    onChange={handleEmergencyChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Emergency Phone"
                    name="phone"
                    value={form.emergencyContact.phone}
                    onChange={handleEmergencyChange}
                    error={!!errors.emergencyPhone}
                    helperText={errors.emergencyPhone}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Relation"
                    name="relation"
                    value={form.emergencyContact.relation}
                    onChange={handleEmergencyChange}
                    sx={inputSx}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Transport Mode"
                    name="transportMode"
                    value={form.transportMode}
                    onChange={handleChange}
                    sx={inputSx}
                  >
                    <MenuItem value="">—</MenuItem>

                    <MenuItem value="SCHOOL_BUS">School Bus</MenuItem>

                    <MenuItem value="SELF">Self</MenuItem>

                    <MenuItem value="WALKING">Walking</MenuItem>
                  </TextField>
                </Grid>

                {form.transportMode === "SCHOOL_BUS" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Bus Route"
                      name="busRoute"
                      value={form.busRoute}
                      onChange={handleChange}
                      sx={inputSx}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Medical Conditions / Notes"
                    name="medicalConditions"
                    value={form.medicalConditions}
                    onChange={handleChange}
                    multiline
                    minRows={3}
                    inputProps={{
                      maxLength: 500,
                    }}
                    helperText={`${form.medicalConditions.length}/500`}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>
            </Box>
          </Stack>
        )}

        {/* =================================================
            DOCUMENTS
        ================================================= */}

        {tab === 1 && (
          <Stack spacing={2}>
            {/* AADHAR */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "#eef2ff",
                    color: "#6d28d9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BadgeOutlinedIcon />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Aadhar Card
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    Upload front and back
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={{
                      minHeight: 46,
                      borderRadius: 2,
                      textTransform: "none",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {aadharFront ? aadharFront.name : "Choose Front"}

                    <input
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) =>
                        setAadharFront(e.target.files?.[0] || null)
                      }
                    />
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={{
                      minHeight: 46,
                      borderRadius: 2,
                      textTransform: "none",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {aadharBack ? aadharBack.name : "Choose Back"}

                    <input
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) =>
                        setAadharBack(e.target.files?.[0] || null)
                      }
                    />
                  </Button>
                </Grid>

                {(aadharFront || aadharBack) && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleAadharUpload}
                      disabled={uploadingAadhar}
                      sx={{
                        ...primaryButtonSx,
                        minHeight: 44,
                      }}
                    >
                      {uploadingAadhar ? "Uploading..." : "Upload Aadhar"}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* OTHER DOCUMENTS */}

            <Box
              sx={{
                p: {
                  xs: 1.5,
                  sm: 2,
                },
                bgcolor: "#fff",
                borderRadius: 2.5,
                border: "1px solid #e8ebf0",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 1 }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    bgcolor: "#f5f3ff",
                    color: "#7c3aed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UploadFileOutlinedIcon />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    Other Documents
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 11,
                      color: "#94a3b8",
                    }}
                  >
                    Certificates and marksheets
                  </Typography>
                </Box>
              </Stack>

              {student.documents?.length > 0 && (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {student.documents.map((doc) => (
                    <Stack
                      key={doc._id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        bgcolor: "#f8fafc",
                        border: "1px solid #eef0f4",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        minWidth={0}
                      >
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            flexShrink: 0,
                            borderRadius: 1.5,
                            bgcolor: "#eef2ff",
                            color: "#6d28d9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PictureAsPdfOutlinedIcon
                            sx={{
                              fontSize: 18,
                            }}
                          />
                        </Box>

                        <Box minWidth={0}>
                          <Typography
                            noWrap
                            sx={{
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {doc.type === "OTHER"
                              ? doc.label || "Other"
                              : DOCUMENT_TYPE_LABELS[doc.type] || doc.type}
                          </Typography>

                          <Typography
                            sx={{
                              fontSize: 10.5,
                              color: "#94a3b8",
                            }}
                          >
                            Uploaded document
                          </Typography>
                        </Box>
                      </Stack>

                      <IconButton
                        size="small"
                        onClick={() =>
                          deleteDocument({
                            studentId: student._id,
                            documentId: doc._id,
                          })
                        }
                        disabled={deletingDocument}
                        sx={{
                          color: "#dc2626",
                          bgcolor: "#fef2f2",
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              )}

              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label="Document Type"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    sx={inputSx}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {docType === "OTHER" && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Document Label"
                      value={docLabel}
                      onChange={(e) => setDocLabel(e.target.value)}
                      sx={inputSx}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Button
                    component="label"
                    fullWidth
                    variant="outlined"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={{
                      minHeight: 46,
                      borderRadius: 2,
                      textTransform: "none",
                    }}
                  >
                    {docFiles.length
                      ? `${docFiles.length} file(s) selected`
                      : "Choose Documents"}

                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      onChange={(e) =>
                        setDocFiles(Array.from(e.target.files || []))
                      }
                    />
                  </Button>
                </Grid>

                {docFiles.length > 0 && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleDocumentUpload}
                      disabled={uploadingDocument}
                      sx={{
                        ...primaryButtonSx,
                        minHeight: 44,
                      }}
                    >
                      {uploadingDocument ? "Uploading..." : "Upload Documents"}
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Stack>
        )}

        {/* =================================================
            PREVIEW
        ================================================= */}

        {tab === 2 && (
          <Box>
            {!hasAnyPreview ? (
              <Box
                sx={{
                  textAlign: "center",
                  py: {
                    xs: 7,
                    sm: 9,
                  },
                  px: 2,
                }}
              >
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    mx: "auto",
                    mb: 1.25,
                    borderRadius: 3,
                    bgcolor: "#eef2ff",
                    color: "#6d28d9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UploadFileOutlinedIcon
                    sx={{
                      fontSize: 32,
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#334155",
                    mb: 0.5,
                  }}
                >
                  No documents yet
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "#94a3b8",
                    maxWidth: 360,
                    mx: "auto",
                  }}
                >
                  Upload Aadhar or other documents from the Documents tab.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={1.5}>
                {student.profilePhoto && (
                  <Grid item xs={6} sm={4}>
                    <PreviewItem
                      url={student.profilePhoto}
                      title="Profile Photo"
                      downloadName={safeFileName(
                        student.user?.name,
                        "profile_photo.jpg",
                      )}
                    />
                  </Grid>
                )}

                {student.aadharFrontUrl && (
                  <Grid item xs={6} sm={4}>
                    <PreviewItem
                      url={student.aadharFrontUrl}
                      title="Aadhar — Front"
                      downloadName={safeFileName(
                        student.user?.name,
                        "aadhar_front",
                      )}
                    />
                  </Grid>
                )}

                {student.aadharBackUrl && (
                  <Grid item xs={6} sm={4}>
                    <PreviewItem
                      url={student.aadharBackUrl}
                      title="Aadhar — Back"
                      downloadName={safeFileName(
                        student.user?.name,
                        "aadhar_back",
                      )}
                    />
                  </Grid>
                )}

                {student.documents?.map((doc) => (
                  <Grid item xs={6} sm={4} key={doc._id}>
                    <PreviewItem
                      url={doc.url}
                      title={
                        doc.type === "OTHER"
                          ? doc.label || "Other"
                          : DOCUMENT_TYPE_LABELS[doc.type] || doc.type
                      }
                      downloadName={safeFileName(
                        student.user?.name,
                        doc.type === "OTHER"
                          ? doc.label || "document"
                          : doc.type.toLowerCase(),
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: {
            xs: 1.5,
            sm: 2.5,
          },

          py: 1.5,

          borderTop: "1px solid #eef0f4",

          bgcolor: "#fff",
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Close
        </Button>

        {tab === 0 && (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={updating}
            sx={primaryButtonSx}
          >
            {updating ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ======================================================
// MOBILE STUDENT CARD
// ======================================================

function StudentMobileCard({ student, onView, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const aadharComplete = !!student.aadharFrontUrl && !!student.aadharBackUrl;

  const aadharPartial =
    (!!student.aadharFrontUrl || !!student.aadharBackUrl) && !aadharComplete;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2.5,
        border: "1px solid #e8e1f2",
        overflow: "hidden",
        bgcolor: "#fff",
      }}
    >
      <CardContent sx={{ p: 1.75 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            src={student.profilePhoto || undefined}
            sx={{
              width: 44,
              height: 44,
              fontSize: 13,
              fontWeight: 800,
              bgcolor: avatarColor(student.user?.name),
            }}
          >
            {getInitials(student.user?.name)}
          </Avatar>

          <Box minWidth={0} flex={1}>
            <Typography
              noWrap
              sx={{
                fontSize: 14,
                fontWeight: 800,
                color: "#1e293b",
              }}
            >
              {student.user?.name || "—"}
            </Typography>

            <Typography
              noWrap
              sx={{
                fontSize: 11,
                color: "#94a3b8",
                mt: 0.25,
              }}
            >
              {student.user?.email || "No email"}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={() => setExpanded((value) => !value)}
            sx={{
              bgcolor: "#f8fafc",
            }}
          >
            {expanded ? (
              <KeyboardArrowUpIcon fontSize="small" />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" />
            )}
          </IconButton>
        </Stack>

        <Stack
          direction="row"
          spacing={0.75}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 1.5 }}
        >
          <Chip
            size="small"
            label={`Roll ${student.rollNumber ?? "—"}`}
            sx={{
              height: 25,
              fontSize: 10.5,
              fontWeight: 700,
              bgcolor: "#f1f5f9",
            }}
          />

          <Chip
            size="small"
            label={student.status || "ACTIVE"}
            color={student.status === "ACTIVE" ? "success" : "default"}
            sx={{
              height: 25,
              fontSize: 10.5,
              fontWeight: 700,
            }}
          />

          <Chip
            size="small"
            label={
              aadharComplete
                ? "Aadhar Complete"
                : aadharPartial
                  ? "Aadhar Partial"
                  : "Aadhar Missing"
            }
            color={
              aadharComplete ? "success" : aadharPartial ? "warning" : "warning"
            }
            variant={aadharComplete || aadharPartial ? "filled" : "outlined"}
            sx={{
              height: 25,
              fontSize: 10.5,
              fontWeight: 700,
            }}
          />
        </Stack>

        <Collapse in={expanded}>
          <Divider sx={{ my: 1.5 }} />

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94a3b8",
                }}
              >
                Admission No.
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  mt: 0.25,
                }}
              >
                {student.admissionNumber || "—"}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94a3b8",
                }}
              >
                Phone
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  mt: 0.25,
                }}
              >
                {student.phone || "—"}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94a3b8",
                }}
              >
                Blood Group
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  mt: 0.25,
                }}
              >
                {student.bloodGroup || "—"}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94a3b8",
                }}
              >
                Documents
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#334155",
                  mt: 0.25,
                }}
              >
                {student.documents?.length || 0}
              </Typography>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>

      <CardActions
        sx={{
          px: 1.5,
          py: 1,
          bgcolor: "#fafbfc",
          borderTop: "1px solid #eef0f4",
          gap: 0.75,
        }}
      >
        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<VisibilityOutlinedIcon />}
          onClick={onView}
          sx={{
            textTransform: "none",
            borderRadius: 1.75,
            fontSize: 11.5,
          }}
        >
          View
        </Button>

        <Button
          fullWidth
          size="small"
          variant="outlined"
          startIcon={<EditOutlinedIcon />}
          onClick={onEdit}
          sx={{
            textTransform: "none",
            borderRadius: 1.75,
            fontSize: 11.5,
          }}
        >
          Edit
        </Button>

        <IconButton
          size="small"
          onClick={onDelete}
          sx={{
            color: "#dc2626",
            bgcolor: "#fef2f2",
            borderRadius: 1.75,
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );
}

// ======================================================
// DESKTOP TABLE
// ======================================================

function StudentDesktopTable({ students, loading, onView, onEdit, onDelete }) {
  return (
    <Table
      sx={{
        minWidth: 900,
      }}
    >
      <TableHead>
        <TableRow
          sx={{
            backgroundColor: "#3b1578",
            "& th": {
              color: "#fff",
              fontWeight: 400,
              fontSize: 10,
              py: 1,
              borderBottom: "none",
              whiteSpace: "nowrap",
            },
          }}
        >
          {[
            "Roll No",
            "Student",
            "Contact",
            "Blood Group",
            "Aadhar",
            "Status",
            "Action",
          ].map((heading, index) => (
            <TableCell
              key={heading}
              align={index === 6 ? "right" : "left"}
              sx={{
                fontSize: 10.5,
                fontWeight: 800,
                color: "#6f6680",
                textTransform: "uppercase",
                letterSpacing: ".05em",
                borderBottom: "1px solid #eef0f4",
                py: 1.5,
              }}
            >
              {heading}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>

      <TableBody>
        {loading &&
          Array.from({
            length: 5,
          }).map((_, index) => (
            <TableRow key={index}>
              <TableCell colSpan={7}>
                <Box
                  sx={{
                    height: 48,
                    bgcolor: "#f8fafc",
                    borderRadius: 1.5,
                    animation: "pulse 1.5s infinite",
                    "@keyframes pulse": {
                      "0%": {
                        opacity: 0.5,
                      },
                      "50%": {
                        opacity: 1,
                      },
                      "100%": {
                        opacity: 0.5,
                      },
                    },
                  }}
                />
              </TableCell>
            </TableRow>
          ))}

        {!loading &&
          students.map((student) => {
            const aadharComplete =
              !!student.aadharFrontUrl && !!student.aadharBackUrl;

            const aadharPartial =
              (!!student.aadharFrontUrl || !!student.aadharBackUrl) &&
              !aadharComplete;

            return (
              <TableRow
                key={student._id}
                hover
                sx={{
                  "& td": {
                    borderBottom: "1px solid #f1f3f7",
                    py: 1.4,
                  },

                  transition: "background .15s",
                }}
              >
                <TableCell>
                  <Chip
                    label={student.rollNumber ?? "—"}
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#334155",
                      fontWeight: 800,
                      fontSize: 11,
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      src={student.profilePhoto || undefined}
                      sx={{
                        width: 38,
                        height: 38,
                        fontSize: 12,
                        fontWeight: 800,
                        bgcolor: avatarColor(student.user?.name),
                      }}
                    >
                      {getInitials(student.user?.name)}
                    </Avatar>

                    <Box minWidth={0}>
                      <Typography
                        noWrap
                        sx={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#1e293b",
                        }}
                      >
                        {student.user?.name || "—"}
                      </Typography>

                      <Typography
                        noWrap
                        sx={{
                          fontSize: 10.5,
                          color: "#94a3b8",
                        }}
                      >
                        {student.admissionNumber
                          ? `Adm. ${student.admissionNumber}`
                          : "Student"}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography
                    noWrap
                    sx={{
                      maxWidth: 220,
                      fontSize: 12,
                      color: "#475569",
                    }}
                  >
                    {student.user?.email || "—"}
                  </Typography>

                  {student.phone && (
                    <Typography
                      sx={{
                        fontSize: 10.5,
                        color: "#94a3b8",
                        mt: 0.25,
                      }}
                    >
                      {student.phone}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  {student.bloodGroup ? (
                    <Chip
                      label={student.bloodGroup}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        fontSize: 10.5,
                        borderRadius: 1.5,
                      }}
                    />
                  ) : (
                    <Typography color="text.disabled">—</Typography>
                  )}
                </TableCell>

                <TableCell>
                  {aadharComplete ? (
                    <Chip
                      icon={<CheckCircleOutlinedIcon />}
                      label="Complete"
                      size="small"
                      color="success"
                      sx={{
                        fontWeight: 700,
                        fontSize: 10.5,
                      }}
                    />
                  ) : aadharPartial ? (
                    <Chip
                      label="Partial"
                      size="small"
                      color="warning"
                      sx={{
                        fontWeight: 700,
                        fontSize: 10.5,
                      }}
                    />
                  ) : (
                    <Chip
                      label="Missing"
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{
                        fontWeight: 700,
                        fontSize: 10.5,
                      }}
                    />
                  )}
                </TableCell>

                <TableCell>
                  <Chip
                    label={student.status || "ACTIVE"}
                    size="small"
                    color={student.status === "ACTIVE" ? "success" : "default"}
                    sx={{
                      fontWeight: 700,
                      fontSize: 10.5,
                    }}
                  />
                </TableCell>

                <TableCell align="right">
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={0.25}
                  >
                    <Tooltip title="View profile">
                      <IconButton
                        size="small"
                        onClick={() => onView(student)}
                        sx={{
                          color: "#6f6680",
                          "&:hover": {
                            bgcolor: "#eef2ff",
                            color: "#6d28d9",
                          },
                        }}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit student">
                      <IconButton
                        size="small"
                        onClick={() => onEdit(student)}
                        sx={{
                          color: "#6f6680",
                          "&:hover": {
                            bgcolor: "#ecfdf5",
                            color: "#059669",
                          },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete student">
                      <IconButton
                        size="small"
                        onClick={() => onDelete(student)}
                        sx={{
                          color: "#94a3b8",
                          "&:hover": {
                            bgcolor: "#fef2f2",
                            color: "#dc2626",
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
      </TableBody>
    </Table>
  );
}

// ======================================================
// EMPTY STATE
// ======================================================

function EmptyState({ type = "class", search, onClear, onAdd }) {
  const noClass = type === "class";

  return (
    <Box
      sx={{
        py: {
          xs: 6,
          sm: 8,
        },
        px: 2,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 68,
          height: 68,
          mx: "auto",
          mb: 1.25,
          borderRadius: 3,
          bgcolor: noClass ? "#eef2ff" : "#f8fafc",
          color: noClass ? "#6d28d9" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {noClass ? (
          <ClassIcon sx={{ fontSize: 30 }} />
        ) : (
          <SearchIcon sx={{ fontSize: 30 }} />
        )}
      </Box>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 800,
          color: "#334155",
          mb: 0.5,
        }}
      >
        {noClass
          ? "Select a class"
          : search
            ? "No students found"
            : "No students in this class"}
      </Typography>

      <Typography
        sx={{
          color: "#94a3b8",
          fontSize: 12,
          maxWidth: 380,
          mx: "auto",
        }}
      >
        {noClass
          ? "Choose a class above to view its students."
          : search
            ? "Try a different name, email, admission or roll number."
            : "Add a student to get started."}
      </Typography>

      {!noClass && search && (
        <Button
          size="small"
          onClick={onClear}
          sx={{
            mt: 1.5,
            textTransform: "none",
            borderRadius: 2,
          }}
        >
          Clear Search
        </Button>
      )}

      {!noClass && !search && (
        <Button
          size="small"
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={onAdd}
          sx={{
            mt: 1.5,
            ...primaryButtonSx,
          }}
        >
          Add Student
        </Button>
      )}
    </Box>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function StudentsPage() {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const { data: classes = [] } = useClasses();

  const [viewClassId, setViewClassId] = useState("");

  const [search, setSearch] = useState("");

  
  // Server-side pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const {
    data,
    isLoading: studentsLoading,
    isFetching: studentsFetching,
    refetch: refetchStudents,
  } = useStudents(
    {
      page,
      limit: rowsPerPage,
      search,
      classId: viewClassId,
      status: "",
    },
    {
      enabled: Boolean(viewClassId),
    },
  );

  const students = data?.students ?? [];

  const pagination = data?.pagination ?? {
    page: 1,
    limit: rowsPerPage,
    total: 0,
    totalPages: 0,
  };

  const totalStudents = Number(pagination.total) || 0;
  const totalPages = Number(pagination.totalPages) || 0;

  const [createOpen, setCreateOpen] = useState(false);

  const [editStudent, setEditStudent] = useState(null);

  const [viewStudent, setViewStudent] = useState(null);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const importStudentsMutation = useImportStudents();
const exportStudentsMutation = useExportStudents();

const excelInputRef = useRef(null);

  const stats = useMemo(() => {
    const active = students.filter((s) => s.status === "ACTIVE").length;

    const completeAadhar = students.filter(
      (s) => s.aadharFrontUrl && s.aadharBackUrl,
    ).length;

    const missingAadhar = students.filter(
      (s) => !s.aadharFrontUrl && !s.aadharBackUrl,
    ).length;

    return {
      total: totalStudents,
      active,
      completeAadhar,
      missingAadhar,
    };
  }, [students, totalStudents]);

  const selectedClass = classes.find((c) => c._id === viewClassId);

  const clearFilters = () => {
    setSearch("");
    setViewClassId("");
    setPage(1);
  };

  const handleExcelImport = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const fileName = file.name.toLowerCase();

  if (
    !fileName.endsWith(".xlsx") &&
    !fileName.endsWith(".xls")
  ) {
    toast.error("Please select a valid Excel file");
    event.target.value = "";
    return;
  }

  const formData = new FormData();

  formData.append("file", file);

  importStudentsMutation.mutate(formData);

  event.target.value = "";
};
const handleExcelExport = () => {
  exportStudentsMutation.mutate({
    search,
    classId: viewClassId,
    status: "",
  });
};
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f7f5fc",

        px: { xs: 0.75, sm: 1, md: 1.5, lg: 2 },

        py: { xs: 0.75, sm: 1, md: 1.5 },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 1800,
          mx: "auto",
        }}
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            borderRadius: {
              xs: 2.5,
              md: 3.5,
            },

            p: { xs: 1.25, sm: 1.5, md: 1.75 },

            mb: 1,

            border: "1px solid #e8e1f2",

            background: "linear-gradient(135deg,#ffffff 0%,#faf7ff 100%)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            justifyContent="space-between"
            spacing={1}
          >
            <Stack direction="row" alignItems="center" spacing={1} minWidth={0}>
              <Box
                sx={{
                  width: {
                    xs: 44,
                    sm: 50,
                  },

                  height: {
                    xs: 44,
                    sm: 50,
                  },

                  flexShrink: 0,

                  borderRadius: 2.5,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background: "linear-gradient(135deg,#6d28d9,#8b5cf6)",

                  boxShadow: "0 8px 20px rgba(49,80,253,.18)",
                }}
              >
                <SchoolIcon
                  sx={{
                    color: "#fff",
                    fontSize: {
                      xs: 23,
                      sm: 27,
                    },
                  }}
                />
              </Box>

              <Box minWidth={0}>
                <Typography
                  sx={{
                    fontSize: {
                      xs: 20,
                      sm: 24,
                      md: 28,
                    },

                    fontWeight: 850,

                    color: "#24163a",

                    lineHeight: 1.1,
                  }}
                >
                  Students
                </Typography>

                <Typography
                  sx={{
                    mt: 0.4,
                    color: "#6f6680",
                    fontSize: {
                      xs: 11.5,
                      sm: 13,
                    },
                  }}
                >
                  Manage profiles, documents and student records.
                </Typography>
              </Box>
            </Stack>
<input
  ref={excelInputRef}
  type="file"
  accept=".xlsx,.xls"
  hidden
  onChange={handleExcelImport}
/>

<Button
  variant="outlined"
  startIcon={<UploadFileOutlinedIcon />}
  onClick={() => excelInputRef.current?.click()}
  disabled={importStudentsMutation.isPending}
  sx={{
    textTransform: "none",
    fontWeight: 600,
  }}
>
  {importStudentsMutation.isPending
    ? "Importing..."
    : "Import Excel"}
</Button>

<Button
  variant="outlined"
  startIcon={<DownloadOutlinedIcon />}
  onClick={handleExcelExport}
  disabled={exportStudentsMutation.isPending}
  sx={{
    textTransform: "none",
    fontWeight: 600,
  }}
>
  {exportStudentsMutation.isPending
    ? "Exporting..."
    : "Export Excel"}
</Button>
            <Button
              variant="contained"
              size={isMobile ? "medium" : "large"}
              fullWidth={isMobile}
              startIcon={<PersonAddIcon />}
              onClick={() => setCreateOpen(true)}
              sx={{
                ...primaryButtonSx,
                px: 2.25,
                py: 1,
                minWidth: {
                  sm: 145,
                },
              }}
            >
              Add Student
            </Button>
          </Stack>
        </Paper>

        {/* =================================================
            STATS
        ================================================= */}

        <Grid
          container
          spacing={{
            xs: 1,
            sm: 1.5,
          }}
          sx={{ mb: 1 }}
        >
          {[
            {
              title: "Total",
              desktopTitle: "Total Students",
              value: stats.total,
              icon: <GroupsIcon />,
              color: "#6d28d9",
              bg: "#eef2ff",
            },

            {
              title: "Active",
              desktopTitle: "Active Students",
              value: stats.active,
              icon: <PersonOutlineOutlinedIcon />,
              color: "#059669",
              bg: "#ecfdf5",
            },

            {
              title: "Aadhar",
              desktopTitle: "Aadhar Complete",
              value: stats.completeAadhar,
              icon: <BadgeOutlinedIcon />,
              color: "#7c3aed",
              bg: "#f5f3ff",
            },

            {
              title: "Missing",
              desktopTitle: "Aadhar Missing",
              value: stats.missingAadhar,
              icon: <WarningAmberOutlinedIcon />,
              color: "#d97706",
              bg: "#fffbeb",
            },
          ].map((item) => (
            <Grid item xs={6} sm={6} md={3} key={item.title}>
              <Paper
                elevation={0}
                sx={{
                  p: {
                    xs: 1.25,
                    sm: 1.75,
                  },

                  borderRadius: {
                    xs: 2,
                    md: 2.5,
                  },

                  border: "1px solid #e8e1f2",

                  height: "100%",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={{
                    xs: 1,
                    sm: 1.25,
                  }}
                >
                  <Box
                    sx={{
                      width: {
                        xs: 36,
                        sm: 42,
                      },

                      height: {
                        xs: 36,
                        sm: 42,
                      },

                      flexShrink: 0,

                      borderRadius: 2,

                      bgcolor: item.bg,

                      color: item.color,

                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </Box>

                  <Box minWidth={0}>
                    <Typography
                      noWrap
                      sx={{
                        fontSize: {
                          xs: 10,
                          sm: 11.5,
                        },

                        color: "#6f6680",

                        fontWeight: 700,
                      }}
                    >
                      {isMobile ? item.title : item.desktopTitle}
                    </Typography>

                    <Typography
                      sx={{
                        fontSize: {
                          xs: 18,
                          sm: 22,
                        },

                        fontWeight: 850,

                        color: "#24163a",

                        lineHeight: 1.2,
                      }}
                    >
                      {viewClassId ? item.value : "—"}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* =================================================
            MAIN DIRECTORY
        ================================================= */}

        <Paper
          elevation={0}
          sx={{
            borderRadius: {
              xs: 2.5,
              md: 3,
            },

            border: "1px solid #e8e1f2",

            overflow: "hidden",
          }}
        >
          {/* TOOLBAR */}

          <Box
            sx={{
              p: {
                xs: 1.5,
                sm: 2,
                md: 2.25,
              },

              borderBottom: "1px solid #eef0f4",

              bgcolor: "#fff",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                lg: "row",
              }}
              justifyContent="space-between"
              spacing={1.5}
            >
              {/* TITLE */}

              <Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1.5,
                      bgcolor: "#eef2ff",
                      color: "#6d28d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <GroupsIcon fontSize="small" />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        fontWeight: 850,
                        fontSize: 15,
                      }}
                    >
                      Student Directory
                    </Typography>

                    {selectedClass && (
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          color: "#94a3b8",
                          mt: 0.1,
                        }}
                      >
                        {selectedClass.className} • Section{" "}
                        {selectedClass.section}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>

              {/* FILTERS */}

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
                sx={{
                  width: {
                    xs: "100%",
                    lg: "auto",
                  },
                }}
              >
             <FormControl
  size="small"
  sx={{
    minWidth: {
      xs: "100%",
      sm: 220,
    },
    ...inputSx,
  }}
>
  <InputLabel>Select Class</InputLabel>

  <Select
    value={viewClassId}
    label="Select Class"
    onChange={(e) => {
      setViewClassId(e.target.value);
      setSearch("");
      setPage(1);
    }}
    startAdornment={
      <InputAdornment position="start">
        <ClassIcon fontSize="small" color="action" />
      </InputAdornment>
    }
  >
    {/* ALL CLASSES */}
    <MenuItem value="">
      All Classes
    </MenuItem>

    {/* INDIVIDUAL CLASSES */}
    {classes.map((c) => (
      <MenuItem key={c._id} value={c._id}>
        {c.className} - {c.section}
      </MenuItem>
    ))}
  </Select>
</FormControl>

                <TextField
                  size="small"
                  value={search}
                  disabled={!viewClassId}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder={
                    isMobile ? "Search..." : "Search name, email or roll..."
                  }
                  sx={{
                    width: {
                      xs: "100%",
                      sm: 260,
                    },

                    ...inputSx,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),

                    endAdornment: search ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearch("");
                            setPage(1);
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />

                {(search || viewClassId) && (
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    startIcon={<FilterAltOutlinedIcon />}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      minWidth: {
                        xs: "100%",
                        sm: "auto",
                      },
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* RESULT BAR */}

          {viewClassId && (
            <Box
              sx={{
                px: {
                  xs: 1.5,
                  sm: 2.25,
                },

                py: 1,

                bgcolor: "#fafbff",

                borderBottom: "1px solid #eef0f4",
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
              >
                {/* <Typography
                  sx={{
                    fontSize: 11.5,
                    color: "#6f6680",
                  }}
                >
                  Showing{" "}
                  <strong>
                    {totalStudents === 0
                      ? 0
                      : (page - 1) * rowsPerPage + 1}
                  </strong>
                  {totalStudents > 0 && "–"}
                  <strong>
                    {Math.min(
                      page * rowsPerPage,
                      totalStudents,
                    )}
                  </strong>{" "}
                  of{" "}
                  <strong>{totalStudents}</strong>
                </Typography> */}

                {search && (
                  <Chip
                    size="small"
                    label={`Search: "${search}"`}
                    onDelete={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    sx={{
                      fontSize: 10.5,
                      maxWidth: {
                        xs: 180,
                        sm: "none",
                      },
                    }}
                  />
                )}
              </Stack>
            </Box>
          )}

          {/* =================================================
              MOBILE LIST
          ================================================= */}
          {/* =========================================================
    STUDENTS CONTENT
========================================================= */}

          {isMobile ? (
            <Box
              sx={{
                p: { xs: 1, sm: 1.5 },
                bgcolor: "#F7F5FC",
              }}
            >
              {!viewClassId ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "1px solid #EAE5F2",
                  }}
                >
                  <EmptyState />
                </Paper>
              ) : studentsLoading ? (
                <Stack spacing={1}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        height: 125,
                        borderRadius: 2,
                        bgcolor: "#EEEAF5",
                        animation: "studentPulse 1.5s ease-in-out infinite",

                        "@keyframes studentPulse": {
                          "0%": {
                            opacity: 0.55,
                          },
                          "50%": {
                            opacity: 1,
                          },
                          "100%": {
                            opacity: 0.55,
                          },
                        },
                      }}
                    />
                  ))}
                </Stack>
              ) : students.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: "1px solid #EAE5F2",
                  }}
                >
                  <EmptyState
                    type="search"
                    search={search}
                    onClear={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    onAdd={() => setCreateOpen(true)}
                  />
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {students.map((student) => (
                    <StudentMobileCard
                      key={student._id}
                      student={student}
                      onView={() => setViewStudent(student)}
                      onEdit={() => setEditStudent(student)}
                      onDelete={() => setDeleteCandidate(student)}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          ) : (
            /* =========================================================
     DESKTOP / TABLET
  ========================================================= */

            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                bgcolor: "#fff",
              }}
            >
              {!viewClassId ? (
                <EmptyState />
              ) : studentsLoading ? (
                <StudentDesktopTable
                  students={[]}
                  loading
                  onView={() => {}}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ) : students.length === 0 ? (
                <EmptyState
                  type="search"
                  search={search}
                  onClear={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  onAdd={() => setCreateOpen(true)}
                />
              ) : (
                <StudentDesktopTable
                  students={students}
                  loading={studentsLoading}
                  onView={setViewStudent}
                  onEdit={setEditStudent}
                  onDelete={setDeleteCandidate}
                />
              )}
            </Box>
          )}

          {/* =========================================================
    PAGINATION FOOTER
========================================================= */}

          {viewClassId && totalStudents > 0 && (
            <Box
              sx={{
                px: { xs: 1, sm: 1.5, md: 2 },
                py: { xs: 1, sm: 1.15 },
                borderTop: "1px solid #E8E3F0",
                bgcolor: "#FAF9FC",
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
                spacing={{ xs: 1, md: 1.5 }}
              >
                {/* LEFT INFO */}
                <Box
                  sx={{
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: { xs: "center", md: "flex-start" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: 10.5, sm: 11.5 },
                      color: "#6B6375",
                      lineHeight: 1.3,
                      whiteSpace: { xs: "normal", md: "nowrap" },
                      textAlign: { xs: "center", md: "left" },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 700,
                        color: "#5B21B6",
                      }}
                    >
                      {selectedClass
                        ? `${selectedClass.className} - ${selectedClass.section}`
                        : "Student Directory"}
                    </Box>
                    {" • "}
                    Showing{" "}
                    <Box component="strong" sx={{ color: "#292331" }}>
                      {(page - 1) * rowsPerPage + 1}
                    </Box>
                    {" – "}
                    <Box component="strong" sx={{ color: "#292331" }}>
                      {Math.min(page * rowsPerPage, totalStudents)}
                    </Box>
                    {" of "}
                    <Box component="strong" sx={{ color: "#292331" }}>
                      {totalStudents}
                    </Box>
                  </Typography>
                </Box>

                {/* RIGHT CONTROLS */}
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent={{ xs: "center", md: "flex-end" }}
                  spacing={{ xs: 0.75, sm: 1 }}
                  sx={{
                    flexWrap: "wrap",
                    rowGap: 0.75,
                  }}
                >
                  {/* ROWS */}
                  <FormControl
                    size="small"
                    sx={{
                      minWidth: 78,

                      "& .MuiInputLabel-root": {
                        fontSize: 11,
                      },

                      "& .MuiOutlinedInput-root": {
                        height: 32,
                        borderRadius: 1.5,
                        bgcolor: "#fff",
                        fontSize: 11.5,

                        "& fieldset": {
                          borderColor: "#D9D1E5",
                        },

                        "&:hover fieldset": {
                          borderColor: "#7C3AED",
                        },

                        "&.Mui-focused fieldset": {
                          borderColor: "#6D28D9",
                        },
                      },
                    }}
                  >
                    <InputLabel>Rows</InputLabel>

                    <Select
                      value={rowsPerPage}
                      label="Rows"
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setPage(1);
                      }}
                      sx={{
                        bgcolor: "#fff",
                        borderRadius: 1.5,
                      }}
                    >
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                      <MenuItem value={100}>100</MenuItem>
                    </Select>
                  </FormControl>

                  {/* PAGINATION */}
                  <Pagination
                    count={totalPages}
                    page={Math.min(page, Math.max(totalPages, 1))}
                    onChange={(_, value) => setPage(value)}
                    disabled={studentsFetching}
                    shape="rounded"
                    size={isMobile ? "small" : "small"}
                    siblingCount={isMobile ? 0 : 1}
                    boundaryCount={1}
                    sx={{
                      "& .MuiPaginationItem-root": {
                        minWidth: 30,
                        height: 30,
                        fontSize: 11.5,
                        borderRadius: 1.5,
                        fontWeight: 600,
                      },

                      "& .Mui-selected": {
                        bgcolor: "#6D28D9 !important",
                        color: "#fff",

                        "&:hover": {
                          bgcolor: "#5B21B6 !important",
                        },
                      },
                    }}
                  />

                  {/* REFRESH */}
                  {/*  <Button
          size="small"
          variant="outlined"
          startIcon={
            studentsFetching ? (
              <CircularProgress
                size={13}
                color="inherit"
              />
            ) : (
              <RefreshOutlinedIcon sx={{ fontSize: 16 }} />
            )
          }
          onClick={() => refetchStudents()}
          disabled={studentsFetching}
          sx={{
            height: 32,
            minWidth: 78,
            px: 1.25,
            borderRadius: 1.5,
            textTransform: "none",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#5B21B6",
            borderColor: "#C9B9DF",
            bgcolor: "#fff",

            "&:hover": {
              borderColor: "#6D28D9",
              bgcolor: "#F5F0FA",
            },

            "& .MuiButton-startIcon": {
              mr: 0.5,
            },
          }}
        >
          Refresh
        </Button> */}
                </Stack>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>

      {/* =================================================
          DIALOGS
      ================================================= */}

      <CreateStudentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        classes={classes}
      />

      <StudentEditDialog
        student={editStudent}
        open={!!editStudent}
        onClose={() => setEditStudent(null)}
      />

      <ProfileViewDialog
        profile={viewStudent}
        type="student"
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
      />

      <DeleteStudentDialog
        student={deleteCandidate}
        open={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
      />
    </Box>
  );
}
