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
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
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
  FingerprintOutlined,
  PublicOutlined,
  EditOutlined,
  VisibilityOutlined,
  CloseOutlined,
  UploadFileOutlined,
  AccountBalanceOutlined,
  ContactEmergencyOutlined,
} from "@mui/icons-material";

import GroupsIcon from "@mui/icons-material/Groups";

import {
  useCreateTeacher,
  useAllTeachers,
  useUpdateTeacherByAdmin,
  useUploadTeacherDocument,
} from "@/hooks/useTeacher";

// ======================================================
// INITIAL FORM
// ======================================================

const emptyForm = {
  name: "",
  email: "",
  password: "",

  qualification: "",
  specialization: "",
  employmentType: "FULL_TIME",
  previousInstitutions: "",

  phone: "",
  alternatePhone: "",
  personalEmail: "",

  street: "",
  city: "",
  state: "",
  pincode: "",

  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",

  employeeId: "",
  joiningDate: "",
  experienceYears: "",

  aadharNumber: "",
  panNumber: "",
  nationality: "Indian",
  category: "",
  religion: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  maritalStatus: "",

  bankAccount: "",
  ifsc: "",
  bankName: "",
  accountHolderName: "",
};

const documentTypes = [
  {
    value: "aadharCard",
    label: "Aadhar Card",
  },
  {
    value: "panCard",
    label: "PAN Card",
  },
  {
    value: "resume",
    label: "Resume",
  },
  {
    value: "degreeCertificate",
    label: "Degree Certificate",
  },
  {
    value: "experienceCertificate",
    label: "Experience Certificate",
  },
  {
    value: "offerLetter",
    label: "Offer Letter",
  },
  {
    value: "joiningLetter",
    label: "Joining Letter",
  },
  {
    value: "appointmentLetter",
    label: "Appointment Letter",
  },
  {
    value: "other",
    label: "Other",
  },
];

// ======================================================
// HELPERS
// ======================================================

function getFormFromTeacher(teacher) {
  const address = teacher?.address || {};
  const emergency =
    teacher?.emergencyContact || {};

  return {
    name: teacher?.user?.name || "",
    email: teacher?.user?.email || "",
    password: "",

    qualification:
      teacher?.qualification || "",

    specialization:
      teacher?.specialization || "",

    employmentType:
      teacher?.employmentType ||
      "FULL_TIME",

    previousInstitutions: Array.isArray(
      teacher?.previousInstitutions
    )
      ? teacher.previousInstitutions.join(", ")
      : "",

    phone: teacher?.phone || "",
    alternatePhone:
      teacher?.alternatePhone || "",

    personalEmail:
      teacher?.personalEmail || "",

    street: address.street || "",
    city: address.city || "",
    state: address.state || "",
    pincode: address.pincode || "",

    emergencyName:
      emergency.name || "",

    emergencyPhone:
      emergency.phone || "",

    emergencyRelation:
      emergency.relation || "",

    employeeId:
      teacher?.employeeId || "",

    joiningDate: teacher?.joiningDate
      ? teacher.joiningDate.substring(0, 10)
      : "",

    experienceYears:
      teacher?.experienceYears ?? "",

    aadharNumber:
      teacher?.aadharNumber || "",

    panNumber:
      teacher?.panNumber || "",

    nationality:
      teacher?.nationality || "Indian",

    category:
      teacher?.category || "",

    religion:
      teacher?.religion || "",

    dateOfBirth: teacher?.dateOfBirth
      ? teacher.dateOfBirth.substring(0, 10)
      : "",

    gender:
      teacher?.gender || "",

    bloodGroup:
      teacher?.bloodGroup || "",

    maritalStatus:
      teacher?.maritalStatus || "",

    bankAccount:
      teacher?.bankAccount || "",

    ifsc:
      teacher?.ifsc || "",

    bankName:
      teacher?.bankName || "",

    accountHolderName:
      teacher?.accountHolderName || "",
  };
}

function getPayload(form, isEdit = false) {
  const payload = {
    name: form.name.trim(),
    email: form.email.trim(),

    qualification:
      form.qualification.trim(),

    specialization:
      form.specialization.trim(),

    employmentType:
      form.employmentType,

    previousInstitutions:
      form.previousInstitutions
        ? form.previousInstitutions
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : [],

    phone: form.phone.trim(),

    alternatePhone:
      form.alternatePhone.trim(),

    personalEmail:
      form.personalEmail.trim(),

    address: {
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    },

    emergencyContact: {
      name: form.emergencyName.trim(),
      phone: form.emergencyPhone.trim(),
      relation:
        form.emergencyRelation.trim(),
    },

    employeeId:
      form.employeeId.trim(),

    joiningDate:
      form.joiningDate || null,

    experienceYears:
      form.experienceYears === ""
        ? 0
        : Number(form.experienceYears),

    aadharNumber:
      form.aadharNumber.trim(),

    panNumber:
      form.panNumber.trim(),

    nationality:
      form.nationality.trim(),

    category:
      form.category,

    religion:
      form.religion.trim(),

    dateOfBirth:
      form.dateOfBirth || null,

    gender:
      form.gender,

    bloodGroup:
      form.bloodGroup,

    maritalStatus:
      form.maritalStatus,

    bankAccount:
      form.bankAccount.trim(),

    ifsc:
      form.ifsc.trim(),

    bankName:
      form.bankName.trim(),

    accountHolderName:
      form.accountHolderName.trim(),
  };

  // Password only while creating.
  if (!isEdit && form.password) {
    payload.password = form.password;
  }

  return payload;
}

// ======================================================
// FIELD COMPONENT
// ======================================================

function Field({
  label,
  name,
  value,
  onChange,
  icon,
  type = "text",
  ...props
}) {
  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      InputLabelProps={
        type === "date"
          ? { shrink: true }
          : undefined
      }
      InputProps={
        icon
          ? {
              startAdornment: (
                <InputAdornment position="start">
                  {icon}
                </InputAdornment>
              ),
            }
          : undefined
      }
      {...props}
    />
  );
}

// ======================================================
// PAGE
// ======================================================

export default function TeachersPage() {
  const {
    mutate: createTeacher,
    isPending: creating,
  } = useCreateTeacher();

  const {
    data: teachers = [],
    isLoading,
  } = useAllTeachers();

  const {
    mutate: updateTeacher,
    isPending: updating,
  } = useUpdateTeacherByAdmin();

  const {
    mutate: uploadDocument,
    isPending: uploading,
  } = useUploadTeacherDocument();

  const [form, setForm] =
    useState(emptyForm);

  const [errors, setErrors] =
    useState({});

  const [viewTeacher, setViewTeacher] =
    useState(null);

  const [editTeacher, setEditTeacher] =
    useState(null);

  const [documentTeacher, setDocumentTeacher] =
    useState(null);

  const [documentType, setDocumentType] =
    useState("aadharCard");

  const [documentFile, setDocumentFile] =
    useState(null);

  const [documentName, setDocumentName] =
    useState("");

  // ====================================================
  // CHANGE
  // ====================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // ====================================================
  // VALIDATE
  // ====================================================

  const validate = (isEdit = false) => {
    const next = {};

    if (!form.name.trim()) {
      next.name =
        "Teacher name is required";
    }

    if (!form.email.trim()) {
      next.email =
        "Email is required";
    }

    if (!isEdit && !form.password) {
      next.password =
        "Password is required";
    }

    if (
      !isEdit &&
      form.password &&
      form.password.length < 6
    ) {
      next.password =
        "Minimum 6 characters";
    }

    if (!form.qualification.trim()) {
      next.qualification =
        "Qualification is required";
    }

    if (
      form.phone &&
      !/^[6-9]\d{9}$/.test(
        form.phone.trim()
      )
    ) {
      next.phone =
        "Enter valid 10 digit mobile number";
    }

    if (
      form.pincode &&
      !/^\d{6}$/.test(
        form.pincode.trim()
      )
    ) {
      next.pincode =
        "Enter valid 6 digit pincode";
    }

    if (
      form.aadharNumber &&
      !/^\d{12}$/.test(
        form.aadharNumber.trim()
      )
    ) {
      next.aadharNumber =
        "Aadhar must contain 12 digits";
    }

    if (
      form.panNumber &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(
        form.panNumber.trim()
      )
    ) {
      next.panNumber =
        "Enter valid PAN number";
    }

    if (
      form.experienceYears !== "" &&
      Number(form.experienceYears) < 0
    ) {
      next.experienceYears =
        "Experience cannot be negative";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  // ====================================================
  // CREATE
  // ====================================================

  const handleCreate = () => {
    if (!validate(false)) return;

    createTeacher(
      getPayload(form, false),
      {
        onSuccess: () => {
          setForm(emptyForm);
          setErrors({});
        },
      }
    );
  };

  // ====================================================
  // EDIT OPEN
  // ====================================================

  const handleEditOpen = (teacher) => {
    setEditTeacher(teacher);
    setForm(
      getFormFromTeacher(teacher)
    );
    setErrors({});
  };

  // ====================================================
  // EDIT SAVE
  // ====================================================

  const handleUpdate = () => {
    if (!validate(true)) return;

    updateTeacher(
      {
        teacherId:
          editTeacher._id,

        data: getPayload(
          form,
          true
        ),
      },
      {
        onSuccess: () => {
          setEditTeacher(null);
          setForm(emptyForm);
          setErrors({});
        },
      }
    );
  };

  // ====================================================
  // DOCUMENT UPLOAD
  // ====================================================

  const handleDocumentUpload = () => {
    if (!documentTeacher) return;

    if (!documentFile) {
      return;
    }

    const fd = new FormData();

    fd.append(
      "file",
      documentFile
    );

    fd.append(
      "documentType",
      documentType
    );

    if (documentType === "other") {
      fd.append(
        "name",
        documentName ||
          documentFile.name
      );
    }

    uploadDocument(
      {
        teacherId:
          documentTeacher._id,

        formData: fd,
      },
      {
        onSuccess: () => {
          setDocumentTeacher(null);
          setDocumentFile(null);
          setDocumentName("");
          setDocumentType(
            "aadharCard"
          );
        },
      }
    );
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        bgcolor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={800}
        >
          Teacher Management
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Create, view, edit and manage
          complete teacher information.
        </Typography>
      </Box>

      <Grid
        container
        spacing={3}
      >
        {/* ==============================================
            CREATE FORM
        ============================================== */}

        <Grid
          item
          xs={12}
          lg={7}
        >
          <Card
            elevation={0}
            sx={{
              border:
                "1px solid #e2e8f0",
              borderRadius: 3,
            }}
          >
            <CardContent
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Create Teacher
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 3 }}
              >
                Fill complete teacher
                information.
              </Typography>

              {/* BASIC */}

              <SectionTitle>
                Basic Information
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={6}>
                  <Field
                    label="Teacher Name"
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    icon={
                      <PersonOutline />
                    }
                    error={
                      !!errors.name
                    }
                    helperText={
                      errors.name
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={
                      handleChange
                    }
                    icon={
                      <EmailOutlined />
                    }
                    error={
                      !!errors.email
                    }
                    helperText={
                      errors.email
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Password"
                    name="password"
                    type="password"
                    value={
                      form.password
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <LockOutlined />
                    }
                    error={
                      !!errors.password
                    }
                    helperText={
                      errors.password
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Phone"
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <PhoneOutlined />
                    }
                    inputProps={{
                      maxLength: 10,
                    }}
                    error={
                      !!errors.phone
                    }
                    helperText={
                      errors.phone
                    }
                  />
                </Grid>
              </Grid>

              {/* PROFESSIONAL */}

              <SectionTitle>
                Professional Information
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={6}>
                  <Field
                    label="Qualification"
                    name="qualification"
                    value={
                      form.qualification
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <SchoolOutlined />
                    }
                    error={
                      !!errors.qualification
                    }
                    helperText={
                      errors.qualification
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Specialization"
                    name="specialization"
                    value={
                      form.specialization
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Employment Type"
                    name="employmentType"
                    value={
                      form.employmentType
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <MenuItem value="FULL_TIME">
                      Full Time
                    </MenuItem>

                    <MenuItem value="PART_TIME">
                      Part Time
                    </MenuItem>

                    <MenuItem value="CONTRACT">
                      Contract
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Previous Institutions"
                    name="previousInstitutions"
                    value={
                      form.previousInstitutions
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="School A, School B"
                  />
                </Grid>
              </Grid>

              {/* ADDRESS */}

              <SectionTitle>
                Address
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12}>
                  <Field
                    label="Street"
                    name="street"
                    value={
                      form.street
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="City"
                    name="city"
                    value={
                      form.city
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <LocationCityOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="State"
                    name="state"
                    value={
                      form.state
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={
                      form.pincode
                    }
                    onChange={
                      handleChange
                    }
                    inputProps={{
                      maxLength: 6,
                    }}
                    error={
                      !!errors.pincode
                    }
                    helperText={
                      errors.pincode
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Alternate Phone"
                    name="alternatePhone"
                    value={
                      form.alternatePhone
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Personal Email"
                    name="personalEmail"
                    type="email"
                    value={
                      form.personalEmail
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>
              </Grid>

              {/* EMPLOYMENT */}

              <SectionTitle>
                Employment Details
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={4}>
                  <Field
                    label="Employee ID"
                    name="employeeId"
                    value={
                      form.employeeId
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <BadgeOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Joining Date"
                    name="joiningDate"
                    type="date"
                    value={
                      form.joiningDate
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <EventOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Experience Years"
                    name="experienceYears"
                    type="number"
                    value={
                      form.experienceYears
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <WorkHistoryOutlined />
                    }
                    error={
                      !!errors.experienceYears
                    }
                    helperText={
                      errors.experienceYears
                    }
                  />
                </Grid>
              </Grid>

              {/* IDENTITY */}

              <SectionTitle>
                Identity & Personal
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={6}>
                  <Field
                    label="Aadhar Number"
                    name="aadharNumber"
                    value={
                      form.aadharNumber
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <FingerprintOutlined />
                    }
                    inputProps={{
                      maxLength: 12,
                    }}
                    error={
                      !!errors.aadharNumber
                    }
                    helperText={
                      errors.aadharNumber
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="PAN Number"
                    name="panNumber"
                    value={
                      form.panNumber
                    }
                    onChange={
                      handleChange
                    }
                    inputProps={{
                      maxLength: 10,
                    }}
                    error={
                      !!errors.panNumber
                    }
                    helperText={
                      errors.panNumber
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Nationality"
                    name="nationality"
                    value={
                      form.nationality
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <PublicOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Category"
                    name="category"
                    value={
                      form.category
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <MenuItem value="">
                      Select
                    </MenuItem>

                    {[
                      "GENERAL",
                      "OBC",
                      "SC",
                      "ST",
                      "EWS",
                    ].map((x) => (
                      <MenuItem
                        key={x}
                        value={x}
                      >
                        {x}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Religion"
                    name="religion"
                    value={
                      form.religion
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Date of Birth"
                    name="dateOfBirth"
                    type="date"
                    value={
                      form.dateOfBirth
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Gender"
                    name="gender"
                    value={
                      form.gender
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <MenuItem value="">
                      Select
                    </MenuItem>
                    <MenuItem value="MALE">
                      Male
                    </MenuItem>
                    <MenuItem value="FEMALE">
                      Female
                    </MenuItem>
                    <MenuItem value="OTHER">
                      Other
                    </MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Blood Group"
                    name="bloodGroup"
                    value={
                      form.bloodGroup
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <MenuItem value="">
                      Select
                    </MenuItem>

                    {[
                      "A+",
                      "A-",
                      "B+",
                      "B-",
                      "AB+",
                      "AB-",
                      "O+",
                      "O-",
                    ].map((x) => (
                      <MenuItem
                        key={x}
                        value={x}
                      >
                        {x}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Marital Status"
                    name="maritalStatus"
                    value={
                      form.maritalStatus
                    }
                    onChange={
                      handleChange
                    }
                  >
                    <MenuItem value="">
                      Select
                    </MenuItem>

                    <MenuItem value="SINGLE">
                      Single
                    </MenuItem>

                    <MenuItem value="MARRIED">
                      Married
                    </MenuItem>

                    <MenuItem value="DIVORCED">
                      Divorced
                    </MenuItem>

                    <MenuItem value="WIDOWED">
                      Widowed
                    </MenuItem>
                  </TextField>
                </Grid>
              </Grid>

              {/* EMERGENCY */}

              <SectionTitle>
                Emergency Contact
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={4}>
                  <Field
                    label="Contact Name"
                    name="emergencyName"
                    value={
                      form.emergencyName
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <ContactEmergencyOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Contact Phone"
                    name="emergencyPhone"
                    value={
                      form.emergencyPhone
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <Field
                    label="Relation"
                    name="emergencyRelation"
                    value={
                      form.emergencyRelation
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>
              </Grid>

              {/* PAYROLL */}

              <SectionTitle>
                Bank / Payroll
              </SectionTitle>

              <Grid
                container
                spacing={2}
              >
                <Grid item xs={12} md={6}>
                  <Field
                    label="Bank Account"
                    name="bankAccount"
                    value={
                      form.bankAccount
                    }
                    onChange={
                      handleChange
                    }
                    icon={
                      <AccountBalanceOutlined />
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="IFSC"
                    name="ifsc"
                    value={
                      form.ifsc
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Bank Name"
                    name="bankName"
                    value={
                      form.bankName
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Field
                    label="Account Holder Name"
                    name="accountHolderName"
                    value={
                      form.accountHolderName
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Button
                fullWidth
                variant="contained"
                startIcon={
                  <SaveOutlined />
                }
                onClick={
                  handleCreate
                }
                disabled={creating}
                sx={{
                  py: 1.3,
                  textTransform:
                    "none",
                  fontWeight: 700,
                }}
              >
                {creating
                  ? "Creating..."
                  : "Create Teacher"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* ==============================================
            TEACHERS TABLE
        ============================================== */}

        <Grid
          item
          xs={12}
          lg={5}
        >
          <Card
            elevation={0}
            sx={{
              border:
                "1px solid #e2e8f0",
              borderRadius: 3,
            }}
          >
            <CardContent>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                mb={2}
              >
                <GroupsIcon color="primary" />

                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  All Teachers
                </Typography>

                <Chip
                  label={
                    teachers.length
                  }
                  size="small"
                  color="primary"
                />
              </Stack>

              <Divider sx={{ mb: 2 }} />

              <Box
                sx={{
                  overflowX:
                    "auto",
                }}
              >
                <Table
                  size="small"
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor:
                          "#f8fafc",
                      }}
                    >
                      <TableCell>
                        <b>Name</b>
                      </TableCell>

                      <TableCell>
                        <b>Employee ID</b>
                      </TableCell>

                      <TableCell>
                        <b>Status</b>
                      </TableCell>

                      <TableCell align="right">
                        <b>Actions</b>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          align="center"
                        >
                          <CircularProgress
                            size={25}
                          />
                        </TableCell>
                      </TableRow>
                    )}

                    {!isLoading &&
                      teachers.map(
                        (teacher) => (
                          <TableRow
                            key={
                              teacher._id
                            }
                            hover
                          >
                            <TableCell>
                              <Typography
                                fontWeight={
                                  600
                                }
                                variant="body2"
                              >
                                {teacher
                                  .user
                                  ?.name ||
                                  "—"}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {teacher
                                  .user
                                  ?.email ||
                                  "—"}
                              </Typography>
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={
                                  teacher.employeeId ||
                                  "—"
                                }
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>

                            <TableCell>
                              <Chip
                                label={
                                  teacher
                                    .user
                                    ?.isActive
                                    ? "Active"
                                    : "Inactive"
                                }
                                size="small"
                                color={
                                  teacher
                                    .user
                                    ?.isActive
                                    ? "success"
                                    : "default"
                                }
                              />
                            </TableCell>

                            <TableCell align="right">
                              <Tooltip title="View">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setViewTeacher(
                                      teacher
                                    )
                                  }
                                >
                                  <VisibilityOutlined />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() =>
                                    handleEditOpen(
                                      teacher
                                    )
                                  }
                                >
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Documents">
                                <IconButton
                                  size="small"
                                  color="secondary"
                                  onClick={() =>
                                    setDocumentTeacher(
                                      teacher
                                    )
                                  }
                                >
                                  <UploadFileOutlined />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        )
                      )}

                    {!isLoading &&
                      teachers.length ===
                        0 && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            align="center"
                            sx={{
                              py: 5,
                            }}
                          >
                            No teachers
                            found
                          </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ==================================================
          VIEW DIALOG
      ================================================== */}

      <TeacherViewDialog
        teacher={viewTeacher}
        onClose={() =>
          setViewTeacher(null)
        }
      />

      {/* ==================================================
          EDIT DIALOG
      ================================================== */}

      <Dialog
        open={!!editTeacher}
        onClose={() =>
          setEditTeacher(null)
        }
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Edit Teacher
        </DialogTitle>

        <DialogContent dividers>
          <Grid
            container
            spacing={2}
            sx={{ pt: 1 }}
          >
            {[
              ["name", "Name"],
              ["email", "Email"],
              [
                "qualification",
                "Qualification",
              ],
              [
                "specialization",
                "Specialization",
              ],
              [
                "phone",
                "Phone",
              ],
              [
                "alternatePhone",
                "Alternate Phone",
              ],
              [
                "personalEmail",
                "Personal Email",
              ],
              [
                "employeeId",
                "Employee ID",
              ],
              [
                "experienceYears",
                "Experience Years",
              ],
              [
                "aadharNumber",
                "Aadhar Number",
              ],
              [
                "panNumber",
                "PAN Number",
              ],
              [
                "nationality",
                "Nationality",
              ],
              [
                "religion",
                "Religion",
              ],
              [
                "street",
                "Street",
              ],
              ["city", "City"],
              ["state", "State"],
              [
                "pincode",
                "Pincode",
              ],
              [
                "emergencyName",
                "Emergency Name",
              ],
              [
                "emergencyPhone",
                "Emergency Phone",
              ],
              [
                "emergencyRelation",
                "Emergency Relation",
              ],
              [
                "bankAccount",
                "Bank Account",
              ],
              ["ifsc", "IFSC"],
              [
                "bankName",
                "Bank Name",
              ],
              [
                "accountHolderName",
                "Account Holder Name",
              ],
            ].map(
              ([name, label]) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  key={name}
                >
                  <TextField
                    fullWidth
                    label={label}
                    name={name}
                    value={
                      form[name] ?? ""
                    }
                    onChange={
                      handleChange
                    }
                  />
                </Grid>
              )
            )}

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Joining Date"
                name="joiningDate"
                value={
                  form.joiningDate
                }
                onChange={
                  handleChange
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Date of Birth"
                name="dateOfBirth"
                value={
                  form.dateOfBirth
                }
                onChange={
                  handleChange
                }
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Employment Type"
                name="employmentType"
                value={
                  form.employmentType
                }
                onChange={
                  handleChange
                }
              >
                <MenuItem value="FULL_TIME">
                  Full Time
                </MenuItem>

                <MenuItem value="PART_TIME">
                  Part Time
                </MenuItem>

                <MenuItem value="CONTRACT">
                  Contract
                </MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Gender"
                name="gender"
                value={
                  form.gender
                }
                onChange={
                  handleChange
                }
              >
                <MenuItem value="">
                  Select
                </MenuItem>
                <MenuItem value="MALE">
                  Male
                </MenuItem>
                <MenuItem value="FEMALE">
                  Female
                </MenuItem>
                <MenuItem value="OTHER">
                  Other
                </MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Category"
                name="category"
                value={
                  form.category
                }
                onChange={
                  handleChange
                }
              >
                {[
                  "",
                  "GENERAL",
                  "OBC",
                  "SC",
                  "ST",
                  "EWS",
                ].map((x) => (
                  <MenuItem
                    key={x || "empty"}
                    value={x}
                  >
                    {x || "Select"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Blood Group"
                name="bloodGroup"
                value={
                  form.bloodGroup
                }
                onChange={
                  handleChange
                }
              >
                {[
                  "",
                  "A+",
                  "A-",
                  "B+",
                  "B-",
                  "AB+",
                  "AB-",
                  "O+",
                  "O-",
                ].map((x) => (
                  <MenuItem
                    key={x || "empty"}
                    value={x}
                  >
                    {x || "Select"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Marital Status"
                name="maritalStatus"
                value={
                  form.maritalStatus
                }
                onChange={
                  handleChange
                }
              >
                {[
                  "",
                  "SINGLE",
                  "MARRIED",
                  "DIVORCED",
                  "WIDOWED",
                ].map((x) => (
                  <MenuItem
                    key={x || "empty"}
                    value={x}
                  >
                    {x || "Select"}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setEditTeacher(null)
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={
              handleUpdate
            }
            disabled={updating}
          >
            {updating
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ==================================================
          DOCUMENT DIALOG
      ================================================== */}

      <Dialog
        open={!!documentTeacher}
        onClose={() =>
          setDocumentTeacher(null)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Upload Teacher Document
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Teacher:{" "}
            <b>
              {
                documentTeacher
                  ?.user?.name
              }
            </b>
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              select
              label="Document Type"
              value={
                documentType
              }
              onChange={(e) =>
                setDocumentType(
                  e.target.value
                )
              }
            >
              {documentTypes.map(
                (doc) => (
                  <MenuItem
                    key={
                      doc.value
                    }
                    value={
                      doc.value
                    }
                  >
                    {doc.label}
                  </MenuItem>
                )
              )}
            </TextField>

            {documentType ===
              "other" && (
              <TextField
                fullWidth
                label="Document Name"
                value={
                  documentName
                }
                onChange={(e) =>
                  setDocumentName(
                    e.target.value
                  )
                }
              />
            )}

            <Button
              component="label"
              variant="outlined"
              startIcon={
                <UploadFileOutlined />
              }
            >
              {documentFile
                ? documentFile.name
                : "Choose File"}

              <input
                hidden
                type="file"
                onChange={(e) =>
                  setDocumentFile(
                    e.target
                      .files?.[0] ||
                      null
                  )
                }
              />
            </Button>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() =>
              setDocumentTeacher(
                null
              )
            }
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={
              uploading ||
              !documentFile
            }
            onClick={
              handleDocumentUpload
            }
          >
            {uploading
              ? "Uploading..."
              : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ======================================================
// SECTION TITLE
// ======================================================

function SectionTitle({
  children,
}) {
  return (
    <Box
      sx={{
        mt: 3,
        mb: 2,
        pb: 1,
        borderBottom:
          "1px solid #e2e8f0",
      }}
    >
      <Typography
        fontSize={13}
        fontWeight={800}
        color="#475569"
      >
        {children}
      </Typography>
    </Box>
  );
}

// ======================================================
// VIEW DIALOG
// ======================================================

function TeacherViewDialog({
  teacher,
  onClose,
}) {
  if (!teacher) return null;

  const address =
    teacher.address || {};

  const emergency =
    teacher.emergencyContact || {};

  const Row = ({
    label,
    value,
  }) => (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        variant="body2"
        fontWeight={600}
      >
        {value || "—"}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={!!teacher}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="h6"
              fontWeight={800}
            >
              {teacher.user?.name ||
                "Teacher Profile"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Complete teacher
              information
            </Typography>
          </Box>

          <IconButton
            onClick={onClose}
          >
            <CloseOutlined />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs
          value={0}
          sx={{ mb: 3 }}
        >
          <Tab label="Profile" />
        </Tabs>

        <Grid
          container
          spacing={3}
        >
          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Basic Information
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12} sm={6}>
                <Row
                  label="Name"
                  value={
                    teacher.user
                      ?.name
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Email"
                  value={
                    teacher.user
                      ?.email
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Phone"
                  value={
                    teacher.phone
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Personal Email"
                  value={
                    teacher.personalEmail
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Professional
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12} sm={6}>
                <Row
                  label="Qualification"
                  value={
                    teacher.qualification
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Specialization"
                  value={
                    teacher.specialization
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Employment Type"
                  value={
                    teacher.employmentType
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Employee ID"
                  value={
                    teacher.employeeId
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Experience"
                  value={
                    teacher.experienceYears
                      ? `${teacher.experienceYears} years`
                      : "—"
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Joining Date"
                  value={
                    teacher.joiningDate
                      ? new Date(
                          teacher.joiningDate
                        ).toLocaleDateString()
                      : "—"
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Address
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12}>
                <Row
                  label="Street"
                  value={
                    address.street
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="City"
                  value={
                    address.city
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="State"
                  value={
                    address.state
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Pincode"
                  value={
                    address.pincode
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Identity
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12} sm={6}>
                <Row
                  label="Aadhar"
                  value={
                    teacher.aadharNumber
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="PAN"
                  value={
                    teacher.panNumber
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Nationality"
                  value={
                    teacher.nationality
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Category"
                  value={
                    teacher.category
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Religion"
                  value={
                    teacher.religion
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Gender"
                  value={
                    teacher.gender
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Blood Group"
                  value={
                    teacher.bloodGroup
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Marital Status"
                  value={
                    teacher.maritalStatus
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Emergency Contact
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12} sm={4}>
                <Row
                  label="Name"
                  value={
                    emergency.name
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Phone"
                  value={
                    emergency.phone
                  }
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Row
                  label="Relation"
                  value={
                    emergency.relation
                  }
                />
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          <Grid item xs={12}>
            <Typography
              fontWeight={800}
              sx={{ mb: 1.5 }}
            >
              Bank Details
            </Typography>

            <Grid
              container
              spacing={2}
            >
              <Grid item xs={12} sm={6}>
                <Row
                  label="Bank Name"
                  value={
                    teacher.bankName
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Account Holder"
                  value={
                    teacher.accountHolderName
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="Account Number"
                  value={
                    teacher.bankAccount
                  }
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Row
                  label="IFSC"
                  value={
                    teacher.ifsc
                  }
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}