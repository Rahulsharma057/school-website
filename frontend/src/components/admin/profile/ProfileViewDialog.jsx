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
  Chip,
  Stack,
  Avatar,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import FamilyRestroomOutlinedIcon from "@mui/icons-material/FamilyRestroomOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DirectionsBusOutlinedIcon from "@mui/icons-material/DirectionsBusOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

import { useDownloadStudentProfile } from "@/hooks/useStudent";

// ======================================================
// HELPERS
// ======================================================

const DOCUMENT_TYPE_LABELS = {
  BIRTH_CERTIFICATE: "Birth Certificate",
  TRANSFER_CERTIFICATE: "Transfer Certificate",
  MARKSHEET: "Marksheet",
  CASTE_CERTIFICATE: "Caste Certificate",
  MEDICAL_CERTIFICATE: "Medical Certificate",
  OTHER: "Other",
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("") || "?";

const AVATAR_COLORS = [
  "#3150fd",
  "#00897b",
  "#e65100",
  "#8e24aa",
  "#c62828",
  "#00838f",
];

const avatarColor = (name = "") => {
  const code = name?.trim()?.charCodeAt(0);
  const index = Number.isFinite(code)
    ? code % AVATAR_COLORS.length
    : 0;

  return AVATAR_COLORS[index];
};

function formatDate(date) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskAadhar(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (digits.length !== 12) {
    return value || "—";
  }

  return `XXXX XXXX ${digits.slice(-4)}`;
}

// ======================================================
// SECTION TITLE
// ======================================================

function SectionTitle({ icon, title, subtitle }) {
  return (
    <Box sx={{ mb: 1.75 }}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 1.5,
            bgcolor: "#eef2ff",
            color: "#3150fd",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1e293b",
              lineHeight: 1.3,
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                fontSize: 11.5,
                color: "#94a3b8",
                mt: 0.25,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

// ======================================================
// FIELD
// ======================================================

function Field({
  label,
  value,
  icon,
  fullWidth = false,
  highlight = false,
}) {
  return (
    <Grid item xs={12} sm={fullWidth ? 12 : 6}>
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: highlight ? "#f0fdf4" : "#f8fafc",
          border: "1px solid",
          borderColor: highlight ? "#bbf7d0" : "#eef0f3",
          minHeight: 67,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {icon && (
            <Box
              sx={{
                color: "#64748b",
                display: "flex",
                mt: 0.15,
              }}
            >
              {icon}
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 10.5,
                color: "#94a3b8",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.3,
              }}
            >
              {label}
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#1e293b",
                fontWeight: 600,
                mt: 0.4,
                wordBreak: "break-word",
                lineHeight: 1.45,
              }}
            >
              {value || "—"}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Grid>
  );
}

// ======================================================
// DOCUMENT CARD
// ======================================================

function DocumentCard({ title, url, subtitle }) {
  if (!url) return null;

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid #e2e8f0",
        bgcolor: "#fff",
        transition: "all .2s ease",
        "&:hover": {
          borderColor: "#3150fd",
          boxShadow: "0 4px 14px rgba(49,80,253,.08)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{ minWidth: 0 }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              bgcolor: "#eef2ff",
              color: "#3150fd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DescriptionOutlinedIcon fontSize="small" />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "#1e293b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                sx={{
                  fontSize: 10.5,
                  color: "#94a3b8",
                  mt: 0.25,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 15 }} />}
          sx={{
            flexShrink: 0,
            textTransform: "none",
            borderRadius: 1.5,
            fontSize: 11.5,
            fontWeight: 600,
            minWidth: 70,
          }}
        >
          View
        </Button>
      </Stack>
    </Box>
  );
}

// ======================================================
// PROFILE VIEW
// ======================================================

export default function ProfileViewDialog({
  profile,
  type,
  open,
  onClose,
}) {
  const isTeacher = type === "teacher";

  const {
    mutate: downloadProfile,
    isPending: isDownloading,
  } = useDownloadStudentProfile();

  if (!profile) return null;

  const name = profile.user?.name || "Unnamed";

  const address = [
    profile.address?.street,
    profile.address?.city,
    profile.address?.state,
    profile.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const documentCount =
    (profile.documents?.length || 0) +
    (profile.aadharFrontUrl ? 1 : 0) +
    (profile.aadharBackUrl ? 1 : 0);

  const handleDownload = () => {
    downloadProfile({
      studentId: profile._id,
      studentName: name,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          maxHeight: "92vh",
          bgcolor: "#f8fafc",
        },
      }}
    >
      {/* ==================================================
          HEADER
      ================================================== */}

      <DialogTitle
        sx={{
          p: 0,
          bgcolor: "#fff",
          borderBottom: "1px solid #eef0f3",
        }}
      >
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2.25,
            background:
              "linear-gradient(135deg, #f8faff 0%, #ffffff 65%)",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            {/* PROFILE */}

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{ minWidth: 0 }}
            >
              <Avatar
                src={profile.profilePhoto || undefined}
                sx={{
                  width: 58,
                  height: 58,
                  fontSize: 19,
                  fontWeight: 700,
                  bgcolor: avatarColor(name),
                  border: "3px solid #fff",
                  boxShadow: "0 3px 12px rgba(0,0,0,.12)",
                }}
              >
                {getInitials(name)}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: 18, sm: 20 },
                    fontWeight: 800,
                    color: "#0f172a",
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                  }}
                >
                  {name}
                </Typography>

                <Stack
                  direction="row"
                  spacing={0.75}
                  flexWrap="wrap"
                  sx={{ mt: 0.75 }}
                >
                  <Chip
                    label={isTeacher ? "TEACHER" : "STUDENT"}
                    size="small"
                    sx={{
                      height: 23,
                      bgcolor: "#eef2ff",
                      color: "#3150fd",
                      fontWeight: 700,
                      fontSize: 10.5,
                    }}
                  />

                  {!isTeacher && profile.status && (
                    <Chip
                      label={profile.status}
                      size="small"
                      color={
                        profile.status === "ACTIVE"
                          ? "success"
                          : "default"
                      }
                      sx={{
                        height: 23,
                        fontWeight: 700,
                        fontSize: 10.5,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* ACTIONS */}

            <Stack direction="row" spacing={0.75}>
              {!isTeacher && (
                <Tooltip title="Download profile PDF">
                  <span>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      startIcon={
                        isDownloading ? (
                          <CircularProgress
                            size={14}
                            color="inherit"
                          />
                        ) : (
                          <DownloadOutlinedIcon fontSize="small" />
                        )
                      }
                      sx={{
                        textTransform: "none",
                        borderRadius: 1.75,
                        fontWeight: 700,
                        px: 1.75,
                      }}
                    >
                      {isDownloading
                        ? "Preparing..."
                        : "Download PDF"}
                    </Button>
                  </span>
                </Tooltip>
              )}

              <Tooltip title="Close">
                <IconButton
                  onClick={onClose}
                  size="small"
                  sx={{
                    border: "1px solid #e2e8f0",
                    bgcolor: "#fff",
                    "&:hover": {
                      bgcolor: "#f1f5f9",
                    },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>
        </Box>
      </DialogTitle>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "#f8fafc",
        }}
      >
        {/* QUICK INFO */}

        <Box
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: 2.5,
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            divider={
              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", sm: "block" } }}
              />
            }
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailOutlinedIcon
                sx={{ fontSize: 18, color: "#64748b" }}
              />
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#475569",
                  wordBreak: "break-word",
                }}
              >
                {profile.user?.email || "No email"}
              </Typography>
            </Stack>

            {profile.phone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <PhoneOutlinedIcon
                  sx={{ fontSize: 18, color: "#64748b" }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  {profile.phone}
                </Typography>
              </Stack>
            )}

            {!isTeacher && profile.rollNumber != null && (
              <Stack direction="row" spacing={1} alignItems="center">
                <BadgeOutlinedIcon
                  sx={{ fontSize: 18, color: "#64748b" }}
                />
                <Typography
                  sx={{
                    fontSize: 12.5,
                    color: "#475569",
                  }}
                >
                  Roll No. {profile.rollNumber}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* ==================================================
            PERSONAL INFORMATION
        ================================================== */}

        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            mb: 2,
            borderRadius: 2.5,
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
          }}
        >
          <SectionTitle
            icon={<PersonOutlineIconSafe />}
            title="Personal Information"
            subtitle="Basic identity and personal details"
          />

          <Grid container spacing={1.25}>
            {!isTeacher && (
              <>
                <Field
                  label="Blood Group"
                  value={profile.bloodGroup}
                />

                <Field
                  label="Date of Birth"
                  value={formatDate(profile.dateOfBirth)}
                  icon={
                    <CalendarMonthOutlinedIcon fontSize="small" />
                  }
                />
              </>
            )}

            <Field
              label="Aadhar Number"
              value={maskAadhar(profile.aadharNumber)}
              icon={
                <CreditCardOutlinedIcon fontSize="small" />
              }
            />

            <Field
              label="Category"
              value={profile.category}
            />

            <Field
              label="Religion"
              value={profile.religion}
            />

            <Field
              label="Nationality"
              value={profile.nationality}
            />
          </Grid>
        </Box>

        {/* ==================================================
            TEACHER DETAILS
        ================================================== */}

        {isTeacher && (
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              mb: 2,
              borderRadius: 2.5,
              bgcolor: "#fff",
              border: "1px solid #e2e8f0",
            }}
          >
            <SectionTitle
              icon={<SchoolOutlinedIcon fontSize="small" />}
              title="Professional Information"
              subtitle="Teacher employment and academic details"
            />

            <Grid container spacing={1.25}>
              <Field
                label="Qualification"
                value={profile.qualification}
              />

              <Field
                label="Employee ID"
                value={profile.employeeId}
              />

              <Field
                label="Experience"
                value={
                  profile.experienceYears != null
                    ? `${profile.experienceYears} years`
                    : ""
                }
              />

              <Field
                label="Subjects"
                value={profile.subjects?.join(", ")}
                fullWidth
              />
            </Grid>
          </Box>
        )}

        {/* ==================================================
            STUDENT DETAILS
        ================================================== */}

        {!isTeacher && (
          <>
            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2.5,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <SectionTitle
                icon={<SchoolOutlinedIcon fontSize="small" />}
                title="Academic Information"
                subtitle="Admission and school-related details"
              />

              <Grid container spacing={1.25}>
                <Field
                  label="Admission Number"
                  value={profile.admissionNumber}
                />

                <Field
                  label="Admission Date"
                  value={formatDate(profile.admissionDate)}
                />

                <Field
                  label="Previous School"
                  value={profile.previousSchool}
                />

                <Field
                  label="House"
                  value={profile.house}
                />

                <Field
                  label="Transport Mode"
                  value={
                    profile.transportMode === "SCHOOL_BUS"
                      ? "School Bus"
                      : profile.transportMode === "SELF"
                        ? "Self"
                        : profile.transportMode === "WALKING"
                          ? "Walking"
                          : profile.transportMode
                  }
                  icon={
                    <DirectionsBusOutlinedIcon fontSize="small" />
                  }
                />

                {profile.transportMode === "SCHOOL_BUS" && (
                  <Field
                    label="Bus Route"
                    value={profile.busRoute}
                  />
                )}
              </Grid>
            </Box>

            {/* FAMILY */}

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2.5,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <SectionTitle
                icon={
                  <FamilyRestroomOutlinedIcon fontSize="small" />
                }
                title="Family & Guardian"
                subtitle="Parent and guardian information"
              />

              <Grid container spacing={1.25}>
                <Field
                  label="Father's Name"
                  value={profile.fatherName}
                />

                <Field
                  label="Mother's Name"
                  value={profile.motherName}
                />

                <Field
                  label="Guardian Occupation"
                  value={profile.guardianOccupation}
                />

                <Field
                  label="Parent"
                  value={
                    profile.parent
                      ? `${profile.parent.name}${
                          profile.parent.phone
                            ? ` (${profile.parent.phone})`
                            : ""
                        }`
                      : ""
                  }
                />
              </Grid>
            </Box>

            {/* ADDRESS */}

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2.5,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <SectionTitle
                icon={
                  <LocationOnOutlinedIcon fontSize="small" />
                }
                title="Address"
                subtitle="Residential address"
              />

              <Grid container spacing={1.25}>
                <Field
                  label="Complete Address"
                  value={address}
                  fullWidth
                  icon={
                    <LocationOnOutlinedIcon fontSize="small" />
                  }
                />
              </Grid>
            </Box>

            {/* EMERGENCY */}

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2,
                borderRadius: 2.5,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <SectionTitle
                icon={
                  <WarningAmberOutlinedIcon fontSize="small" />
                }
                title="Emergency Contact"
                subtitle="Contact to be used in case of emergency"
              />

              <Grid container spacing={1.25}>
                <Field
                  label="Name"
                  value={profile.emergencyContact?.name}
                />

                <Field
                  label="Phone"
                  value={profile.emergencyContact?.phone}
                  icon={
                    <PhoneOutlinedIcon fontSize="small" />
                  }
                />

                <Field
                  label="Relation"
                  value={profile.emergencyContact?.relation}
                />
              </Grid>
            </Box>

            {/* MEDICAL */}

            {profile.medicalConditions && (
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 2,
                  borderRadius: 2.5,
                  bgcolor: "#fffbeb",
                  border: "1px solid #fde68a",
                }}
              >
                <SectionTitle
                  icon={
                    <WarningAmberOutlinedIcon fontSize="small" />
                  }
                  title="Medical Conditions / Notes"
                />

                <Typography
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: "#78350f",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {profile.medicalConditions}
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* ==================================================
            DOCUMENTS
        ================================================== */}

        <Box
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderRadius: 2.5,
            bgcolor: "#fff",
            border: "1px solid #e2e8f0",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.75 }}
          >
            <SectionTitle
              icon={
                <DescriptionOutlinedIcon fontSize="small" />
              }
              title="Documents"
              subtitle="Uploaded identity and supporting documents"
            />

            {!isTeacher && documentCount > 0 && (
              <Chip
                label={`${documentCount} file${
                  documentCount > 1 ? "s" : ""
                }`}
                size="small"
                sx={{
                  bgcolor: "#eef2ff",
                  color: "#3150fd",
                  fontWeight: 700,
                  fontSize: 10.5,
                }}
              />
            )}
          </Stack>

          {isTeacher ? (
            profile.aadharCardUrl ? (
              <DocumentCard
                title="Aadhar Card"
                subtitle="Identity document"
                url={profile.aadharCardUrl}
              />
            ) : (
              <EmptyDocuments />
            )
          ) : (
            <Stack spacing={1.25}>
              {profile.aadharFrontUrl && (
                <DocumentCard
                  title="Aadhar Card — Front"
                  subtitle="Aadhar identity document"
                  url={profile.aadharFrontUrl}
                />
              )}

              {profile.aadharBackUrl && (
                <DocumentCard
                  title="Aadhar Card — Back"
                  subtitle="Aadhar identity document"
                  url={profile.aadharBackUrl}
                />
              )}

              {profile.documents?.map((doc) => (
                <DocumentCard
                  key={doc._id}
                  title={
                    doc.type === "OTHER"
                      ? doc.label || "Other Document"
                      : DOCUMENT_TYPE_LABELS[doc.type] ||
                        doc.type
                  }
                  subtitle="Supporting document"
                  url={doc.url}
                />
              ))}

              {!profile.aadharFrontUrl &&
                !profile.aadharBackUrl &&
                !profile.documents?.length && <EmptyDocuments />}
            </Stack>
          )}
        </Box>
      </DialogContent>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <DialogActions
        sx={{
          px: { xs: 2, sm: 3 },
          py: 1.75,
          bgcolor: "#fff",
          borderTop: "1px solid #eef0f3",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            borderRadius: 1.75,
            fontWeight: 600,
            minWidth: 90,
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ======================================================
// SAFE ICON
// ======================================================

function PersonOutlineIconSafe() {
  return (
    <BadgeOutlinedIcon fontSize="small" />
  );
}

// ======================================================
// EMPTY DOCUMENTS
// ======================================================

function EmptyDocuments() {
  return (
    <Box
      sx={{
        py: 3.5,
        textAlign: "center",
        borderRadius: 2,
        bgcolor: "#f8fafc",
        border: "1px dashed #cbd5e1",
      }}
    >
      <DescriptionOutlinedIcon
        sx={{
          fontSize: 34,
          color: "#cbd5e1",
          mb: 0.75,
        }}
      />

      <Typography
        sx={{
          fontSize: 12.5,
          color: "#64748b",
          fontWeight: 500,
        }}
      >
        No documents uploaded yet
      </Typography>
    </Box>
  );
}