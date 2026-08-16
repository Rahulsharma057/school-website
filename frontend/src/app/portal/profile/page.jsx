"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Avatar,
  Grid,
  TextField,
  Button,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  Alert,
} from "@mui/material";

import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";

import {
  useMyStudentProfile,
  useUpdateMyStudentProfile,
  useUploadMyStudentProfilePhoto,
} from "@/hooks/useStudent";

import {
  useMyTeacherProfile,
  useUpdateMyTeacherProfile,
  useUploadMyTeacherProfilePhoto,
} from "@/hooks/useTeacher";

// ======================================================
// HELPERS
// ======================================================

const getInitials = (name = "") => {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return initials || "U";
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const safeValue = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
};

const MAX_PHOTO_SIZE_MB = 5;
const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const validatePhotoFile = (file) => {
  if (!file) return "";

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return "Only JPG, PNG or WEBP images are allowed.";
  }

  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return `Image must be smaller than ${MAX_PHOTO_SIZE_MB}MB.`;
  }

  return "";
};

// ======================================================
// SECTION CARD
// ======================================================

function SectionCard({
  icon,
  title,
  subtitle,
  action,
  children,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.75,
          sm: 2.5,
          md: 3,
        },

        borderRadius: {
          xs: 2.5,
          md: 3,
        },

        border: "1px solid #e5e7eb",

        backgroundColor: "#fff",

        mb: {
          xs: 2,
          md: 2.5,
        },

        boxShadow:
          "0 2px 10px rgba(15, 23, 42, 0.03)",
      }}
    >
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={{
          xs: 1.5,
          sm: 2,
        }}
        alignItems={{
          xs: "stretch",
          sm: "center",
        }}
        justifyContent="space-between"
        sx={{
          mb: 2,
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          sx={{
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              minWidth: 38,

              borderRadius: 2,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              backgroundColor: "#eef2ff",
              color: "#3150fd",
            }}
          >
            {icon}
          </Box>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: 15,
                  sm: 16,
                },

                fontWeight: 700,
                color: "#111827",
              }}
            >
              {title}
            </Typography>

            {subtitle && (
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#6b7280",
                  mt: 0.25,
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {action && (
          <Box
            sx={{
              alignSelf: {
                xs: "flex-start",
                sm: "center",
              },
              width: {
                xs: "100%",
                sm: "auto",
              },
            }}
          >
            {action}
          </Box>
        )}
      </Stack>

      <Divider
        sx={{
          mb: 2.5,
        }}
      />

      {children}
    </Paper>
  );
}

// ======================================================
// READ FIELD
// ======================================================

function ReadField({
  label,
  value,
  icon,
}) {
  const displayValue = safeValue(value);

  return (
    <Box
      sx={{
        p: {
          xs: 1.25,
          sm: 1.5,
        },

        borderRadius: 2,

        backgroundColor: "#f8fafc",
        border: "1px solid #eef0f3",

        minHeight: 66,

        transition: "all 0.2s ease",

        "&:hover": {
          borderColor: "#dbe1ea",
          backgroundColor: "#f6f8fb",
        },
      }}
    >
      <Stack
        direction="row"
        spacing={0.6}
        alignItems="center"
        sx={{
          mb: 0.5,
        }}
      >
        {icon && (
          <Box
            sx={{
              display: "flex",
              color: "#64748b",
            }}
          >
            {icon}
          </Box>
        )}

        <Typography
          sx={{
            fontSize: 11.5,
            color: "#6b7280",
            fontWeight: 600,

            textTransform: "uppercase",
            letterSpacing: 0.25,
          }}
        >
          {label}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontSize: 14,
          fontWeight: 600,

          color:
            displayValue === "—"
              ? "#9ca3af"
              : "#1f2937",

          wordBreak: "break-word",
          lineHeight: 1.45,
        }}
      >
        {displayValue}
      </Typography>
    </Box>
  );
}

// ======================================================
// PROFILE HEADER
// ======================================================

function ProfileHeader({
  profile,
  type,
}) {
  const name =
    profile?.user?.name || "User";

  const email =
    profile?.user?.email || "";

  const isStudent =
    type === "student";

  const roleLabel = isStudent
    ? "Student"
    : "Teacher";

  const className =
    profile?.class?.className;

  const section =
    profile?.class?.section;

  return (
    <Paper
      elevation={0}
      sx={{
        p: {
          xs: 1.75,
          sm: 2.5,
          md: 3,
        },

        borderRadius: {
          xs: 2.5,
          md: 3,
        },

        border: "1px solid #e5e7eb",

        mb: {
          xs: 2,
          md: 2.5,
        },

        overflow: "hidden",
        position: "relative",

        background:
          "linear-gradient(135deg, #ffffff 0%, #f5f7ff 100%)",
      }}
    >
      {/* Decorative Circle */}
      <Box
        sx={{
          position: "absolute",

          width: {
            xs: 130,
            sm: 180,
          },

          height: {
            xs: 130,
            sm: 180,
          },

          borderRadius: "50%",

          backgroundColor: "#3150fd",

          opacity: 0.035,

          right: {
            xs: -60,
            sm: -70,
          },

          top: {
            xs: -60,
            sm: -80,
          },
        }}
      />

      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={{
          xs: 2,
          sm: 2.5,
        }}
        alignItems={{
          xs: "flex-start",
          sm: "center",
        }}
        sx={{
          position: "relative",
        }}
      >
        {/* Avatar */}
        <Avatar
          src={
            profile?.profilePhoto ||
            undefined
          }
          alt={name}
          sx={{
            width: {
              xs: 72,
              sm: 82,
            },

            height: {
              xs: 72,
              sm: 82,
            },

            fontSize: {
              xs: 24,
              sm: 28,
            },

            fontWeight: 700,

            bgcolor: "#3150fd",

            border:
              "4px solid #ffffff",

            boxShadow:
              "0 4px 15px rgba(49, 80, 253, 0.18)",

            flexShrink: 0,
          }}
        >
          {getInitials(name)}
        </Avatar>

        {/* User Info */}
        <Box
          sx={{
            minWidth: 0,
            flex: 1,
            width: "100%",
          }}
        >
          <Typography
            sx={{
              fontSize: {
                xs: 21,
                sm: 24,
                md: 26,
              },

              lineHeight: 1.2,

              fontWeight: 750,

              color: "#111827",

              wordBreak: "break-word",
            }}
          >
            {name}
          </Typography>

          {/* Email */}
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              mt: 0.75,
              color: "#6b7280",
              minWidth: 0,
            }}
          >
            <EmailOutlinedIcon
              sx={{
                fontSize: 16,
                flexShrink: 0,
              }}
            />

            <Typography
              sx={{
                fontSize: 13,
                color: "#6b7280",

                overflow: "hidden",
                textOverflow: "ellipsis",

                wordBreak: "break-word",
              }}
            >
              {email ||
                "No email available"}
            </Typography>
          </Stack>

          {/* Chips */}
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            sx={{
              mt: 1.5,
            }}
          >
            <Chip
              size="small"
              icon={
                <PersonOutlineOutlinedIcon />
              }
              label={roleLabel}
              sx={{
                height: 28,
                fontWeight: 600,

                backgroundColor:
                  "#eef2ff",

                color: "#3150fd",

                "& .MuiChip-icon": {
                  color: "#3150fd",
                  fontSize: 17,
                },
              }}
            />

            {isStudent && (
              <>
                <Chip
                  size="small"
                  label={`${safeValue(
                    className
                  )} - ${safeValue(
                    section
                  )}`}
                  variant="outlined"
                  sx={{
                    height: 28,
                    fontWeight: 600,
                  }}
                />

                <Chip
                  size="small"
                  label={`Roll No. ${safeValue(
                    profile?.rollNumber
                  )}`}
                  variant="outlined"
                  sx={{
                    height: 28,
                    fontWeight: 600,
                  }}
                />
              </>
            )}

            {!isStudent &&
              profile?.qualification && (
                <Chip
                  size="small"
                  label={
                    profile.qualification
                  }
                  variant="outlined"
                  sx={{
                    height: 28,
                    fontWeight: 600,
                  }}
                />
              )}

            {!isStudent &&
              profile?.classTeacherOf
                ?.className && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Class Teacher: ${
                    profile.classTeacherOf
                      .className
                  } - ${
                    profile.classTeacherOf
                      .section || "—"
                  }`}
                  sx={{
                    height: 28,
                    fontWeight: 600,

                    maxWidth: {
                      xs: "100%",
                      sm: "none",
                    },

                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                    },
                  }}
                />
              )}

            <Chip
              size="small"
              label={
                profile?.status ||
                "—"
              }
              color={
                profile?.status ===
                "ACTIVE"
                  ? "success"
                  : "default"
              }
              sx={{
                height: 28,
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

// ======================================================
// PROFILE PHOTO UPLOADER
// (replaces the old URL-based ProfilePhotoPreview)
// ======================================================

function ProfilePhotoUploader({
  currentUrl,
  name,
  onUpload,
  isUploading,
}) {
  const fileInputRef = useRef(null);

  const [previewUrl, setPreviewUrl] =
    useState(null);

  const [localError, setLocalError] =
    useState("");

  // Revoke object URL on unmount / change to avoid memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handlePickClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    // reset input so choosing the same file again still fires onChange
    event.target.value = "";

    if (!file) return;

    const error = validatePhotoFile(file);

    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(URL.createObjectURL(file));

    onUpload(file);
  };

  const displayUrl = previewUrl || currentUrl;

  return (
    <Box
      sx={{
        mt: 0.5,

        display: "flex",
        alignItems: "center",
        gap: 1.5,

        p: 1.5,

        borderRadius: 2,

        backgroundColor: "#f8fafc",

        border: "1px solid #eef0f3",

        flexWrap: "wrap",
      }}
    >
      <Avatar
        src={displayUrl || undefined}
        alt={name || "Profile"}
        sx={{
          width: 56,
          height: 56,
          bgcolor: "#3150fd",
          flexShrink: 0,
        }}
      >
        {getInitials(name)}
      </Avatar>

      <Box
        sx={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          Profile photo
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            color: localError
              ? "#dc2626"
              : "#6b7280",
            mt: 0.25,
          }}
        >
          {localError ||
            "JPG, PNG or WEBP, up to 5MB."}
        </Typography>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        hidden
        onChange={handleFileChange}
      />

      <Button
        size="small"
        variant="outlined"
        onClick={handlePickClick}
        disabled={isUploading}
        startIcon={
          isUploading ? (
            <CircularProgress
              size={14}
              color="inherit"
            />
          ) : (
            <PhotoCameraOutlinedIcon fontSize="small" />
          )
        }
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 1.5,
        }}
      >
        {isUploading
          ? "Uploading..."
          : "Change Photo"}
      </Button>
    </Box>
  );
}

// ======================================================
// EDIT ACTIONS
// ======================================================

function EditActions({
  editing,
  isPending,
  onEdit,
  onCancel,
  onSave,
}) {
  if (!editing) {
    return (
      <Button
        size="small"
        variant="outlined"
        startIcon={
          <EditOutlinedIcon />
        }
        onClick={onEdit}
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 1.5,
          px: 2,

          width: {
            xs: "100%",
            sm: "auto",
          },
        }}
      >
        Edit
      </Button>
    );
  }

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        width: {
          xs: "100%",
          sm: "auto",
        },
      }}
    >
      <Tooltip title="Cancel">
        <span>
          <IconButton
            size="small"
            onClick={onCancel}
            disabled={isPending}
            sx={{
              border:
                "1px solid #e5e7eb",
              borderRadius: 1.5,
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Button
        size="small"
        variant="contained"
        startIcon={
          isPending ? (
            <CircularProgress
              size={15}
              color="inherit"
            />
          ) : (
            <SaveOutlinedIcon />
          )
        }
        onClick={onSave}
        disabled={isPending}
        sx={{
          textTransform: "none",
          fontWeight: 600,

          borderRadius: 1.5,

          boxShadow: "none",

          px: 2,

          flex: {
            xs: 1,
            sm: "initial",
          },
        }}
      >
        {isPending
          ? "Saving..."
          : "Save Changes"}
      </Button>
    </Stack>
  );
}

// ======================================================
// DOCUMENT CARD
// ======================================================

function DocumentCard({
  url,
  title,
}) {
  return (
    <Box
      sx={{
        mt: 0.5,

        p: 1.5,

        borderRadius: 2,

        backgroundColor: "#f8fafc",

        border:
          "1px solid #eef0f3",

        display: "flex",

        flexDirection: {
          xs: "column",
          sm: "row",
        },

        alignItems: {
          xs: "flex-start",
          sm: "center",
        },

        justifyContent:
          "space-between",

        gap: 1.5,
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 11.5,
            color: "#6b7280",
            fontWeight: 600,
            textTransform:
              "uppercase",
            mb: 0.25,
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            fontSize: 12.5,
            color: "#64748b",
          }}
        >
          Official document
        </Typography>
      </Box>

      <Button
        size="small"
        variant="outlined"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 1.5,

          width: {
            xs: "100%",
            sm: "auto",
          },
        }}
      >
        View Document
      </Button>
    </Box>
  );
}

// ======================================================
// STUDENT
// ======================================================

const STUDENT_EMPTY_FORM = {
  bloodGroup: "",
  bio: "",
};

function StudentProfileView() {
  const {
    data: profile,
    isLoading,
    isError,
  } = useMyStudentProfile();

  const {
    mutate: updateProfile,
    isPending,
  } = useUpdateMyStudentProfile();

  const {
    mutate: uploadPhoto,
    isPending: isUploadingPhoto,
  } = useUploadMyStudentProfilePhoto();

  const [editing, setEditing] =
    useState(false);

  const [form, setForm] = useState(
    STUDENT_EMPTY_FORM
  );

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    if (!profile || editing) return;

    setForm({
      bloodGroup:
        profile.bloodGroup || "",

      bio: profile.bio || "",
    });
  }, [profile, editing]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormError("");

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    if (!profile) return;

    setForm({
      bloodGroup:
        profile.bloodGroup || "",

      bio: profile.bio || "",
    });

    setFormError("");
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      bloodGroup:
        profile?.bloodGroup || "",

      bio: profile?.bio || "",
    });

    setFormError("");
    setEditing(false);
  };

  const handlePhotoUpload = (file) => {
    const formData = new FormData();
    // backend multer expects field name "file"
    formData.append("file", file);

    uploadPhoto(formData);
  };

  const handleSave = () => {
    if (isPending) return;

    const bio = form.bio.trim();

    if (bio.length > 300) {
      setFormError(
        "Bio cannot be more than 300 characters."
      );
      return;
    }

    setFormError("");

    updateProfile(
      {
        bloodGroup:
          form.bloodGroup.trim(),

        bio,
      },
      {
        onSuccess: () => {
          setEditing(false);
        },
      }
    );
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (isError || !profile) {
    return <ProfileError />;
  }

  return (
    <Box>
      <ProfileHeader
        profile={profile}
        type="student"
      />

      {/* EDITABLE DETAILS */}
      <SectionCard
        icon={
          <EditOutlinedIcon fontSize="small" />
        }
        title="Your Details"
        subtitle="You can update these details yourself"
        action={
          <EditActions
            editing={editing}
            isPending={isPending}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        }
      >
        {formError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {formError}
          </Alert>
        )}

        <ProfilePhotoUploader
          currentUrl={profile.profilePhoto}
          name={profile?.user?.name}
          onUpload={handlePhotoUpload}
          isUploading={isUploadingPhoto}
        />

        <Box sx={{ mt: 2.5 }}>
          {editing ? (
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  select
                  SelectProps={{
                    native: true,
                  }}
                  label="Blood Group"
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={
                    handleChange
                  }
                >
                  <option value="">
                    Select Blood Group
                  </option>

                  {[
                    "A+",
                    "A-",
                    "B+",
                    "B-",
                    "AB+",
                    "AB-",
                    "O+",
                    "O-",
                  ].map(
                    (bloodGroup) => (
                      <option
                        key={bloodGroup}
                        value={bloodGroup}
                      >
                        {bloodGroup}
                      </option>
                    )
                  )}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bio"
                  name="bio"
                  value={form.bio}
                  onChange={
                    handleChange
                  }
                  multiline
                  minRows={3}
                  inputProps={{
                    maxLength: 300,
                  }}
                  helperText={`${form.bio.length}/300`}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <ReadField
                  label="Blood Group"
                  value={
                    profile.bloodGroup
                  }
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  sm: 6,
                }}
              >
                <ReadField
                  label="Profile Status"
                  value={
                    profile.status
                  }
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <ReadField
                  label="Bio"
                  value={profile.bio}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </SectionCard>

      {/* OFFICIAL DETAILS */}
      <SectionCard
        icon={
          <LockOutlinedIcon fontSize="small" />
        }
        title="Official Details"
        subtitle="These details are managed by the school admin"
      >
        <Grid container spacing={1.5}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Phone"
              value={profile.phone}
              icon={
                <PhoneOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="City"
              value={
                profile.address?.city
              }
              icon={
                <LocationOnOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Admission Number"
              value={
                profile.admissionNumber
              }
              icon={
                <BadgeOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Admission Date"
              value={formatDate(
                profile.admissionDate
              )}
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Date of Birth"
              value={formatDate(
                profile.dateOfBirth
              )}
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="House"
              value={profile.house}
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Previous School"
              value={
                profile.previousSchool
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Parent / Guardian"
              value={
                profile.parent?.name
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Father's Name"
              value={
                profile.fatherName
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Mother's Name"
              value={
                profile.motherName
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Emergency Contact"
              value={
                profile
                  .emergencyContact
                  ?.name
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Emergency Phone"
              value={
                profile
                  .emergencyContact
                  ?.phone
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Category"
              value={
                profile.category
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Religion"
              value={
                profile.religion
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Aadhar Number"
              value={
                profile.aadharNumber
              }
            />
          </Grid>

          {profile.aadharCardUrl && (
            <Grid size={{ xs: 12 }}>
              <DocumentCard
                url={
                  profile.aadharCardUrl
                }
                title="Aadhar Card"
              />
            </Grid>
          )}
        </Grid>
      </SectionCard>
    </Box>
  );
}

// ======================================================
// TEACHER
// ======================================================

const TEACHER_EMPTY_FORM = {
  bio: "",
};

function TeacherProfileView() {
  const {
    data: profile,
    isLoading,
    isError,
  } = useMyTeacherProfile();

  const {
    mutate: updateProfile,
    isPending,
  } = useUpdateMyTeacherProfile();

  const {
    mutate: uploadPhoto,
    isPending: isUploadingPhoto,
  } = useUploadMyTeacherProfilePhoto();

  const [editing, setEditing] =
    useState(false);

  const [form, setForm] = useState(
    TEACHER_EMPTY_FORM
  );

  const [formError, setFormError] =
    useState("");

  useEffect(() => {
    if (!profile || editing) return;

    setForm({
      bio: profile.bio || "",
    });
  }, [profile, editing]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormError("");

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    if (!profile) return;

    setForm({
      bio: profile.bio || "",
    });

    setFormError("");
    setEditing(true);
  };

  const handleCancel = () => {
    setForm({
      bio: profile?.bio || "",
    });

    setFormError("");
    setEditing(false);
  };

  const handlePhotoUpload = (file) => {
    const formData = new FormData();
    // backend multer expects field name "file"
    formData.append("file", file);

    uploadPhoto(formData);
  };

  const handleSave = () => {
    if (isPending) return;

    const bio = form.bio.trim();

    if (bio.length > 300) {
      setFormError(
        "Bio cannot be more than 300 characters."
      );
      return;
    }

    setFormError("");

    updateProfile(
      {
        bio,
      },
      {
        onSuccess: () => {
          setEditing(false);
        },
      }
    );
  };

  if (isLoading) {
    return <ProfileLoading />;
  }

  if (isError || !profile) {
    return <ProfileError />;
  }

  return (
    <Box>
      <ProfileHeader
        profile={profile}
        type="teacher"
      />

      {/* EDITABLE DETAILS */}
      <SectionCard
        icon={
          <EditOutlinedIcon fontSize="small" />
        }
        title="Your Details"
        subtitle="You can update these details yourself"
        action={
          <EditActions
            editing={editing}
            isPending={isPending}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        }
      >
        {formError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              borderRadius: 2,
            }}
          >
            {formError}
          </Alert>
        )}

        <ProfilePhotoUploader
          currentUrl={profile.profilePhoto}
          name={profile?.user?.name}
          onUpload={handlePhotoUpload}
          isUploading={isUploadingPhoto}
        />

        <Box sx={{ mt: 2.5 }}>
          {editing ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Bio"
                  name="bio"
                  value={form.bio}
                  onChange={
                    handleChange
                  }
                  multiline
                  minRows={3}
                  inputProps={{
                    maxLength: 300,
                  }}
                  helperText={`${form.bio.length}/300`}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <ReadField
                  label="Bio"
                  value={profile.bio}
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </SectionCard>

      {/* OFFICIAL DETAILS */}
      <SectionCard
        icon={
          <LockOutlinedIcon fontSize="small" />
        }
        title="Official Details"
        subtitle="These details are managed by the school admin"
      >
        <Grid container spacing={1.5}>
          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Phone"
              value={profile.phone}
              icon={
                <PhoneOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="City"
              value={
                profile.address?.city
              }
              icon={
                <LocationOnOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Employee ID"
              value={
                profile.employeeId
              }
              icon={
                <BadgeOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Joining Date"
              value={formatDate(
                profile.joiningDate
              )}
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ fontSize: 15 }}
                />
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Experience"
              value={
                profile.experienceYears
                  ? `${profile.experienceYears} yrs`
                  : ""
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Qualification"
              value={
                profile.qualification
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Subjects"
              value={
                profile.subjects?.length
                  ? profile.subjects.join(
                      ", "
                    )
                  : ""
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Emergency Contact"
              value={
                profile
                  .emergencyContact
                  ?.name
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Emergency Phone"
              value={
                profile
                  .emergencyContact
                  ?.phone
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Category"
              value={
                profile.category
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Religion"
              value={
                profile.religion
              }
            />
          </Grid>

          <Grid
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <ReadField
              label="Aadhar Number"
              value={
                profile.aadharNumber
              }
            />
          </Grid>

          {profile.aadharCardUrl && (
            <Grid size={{ xs: 12 }}>
              <DocumentCard
                url={
                  profile.aadharCardUrl
                }
                title="Aadhar Card"
              />
            </Grid>
          )}
        </Grid>
      </SectionCard>
    </Box>
  );
}

// ======================================================
// LOADING
// ======================================================

function ProfileLoading() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",

        justifyContent: "center",
        alignItems: "center",

        py: 10,

        gap: 1.5,
      }}
    >
      <CircularProgress size={32} />

      <Typography
        sx={{
          fontSize: 13,
          color: "#6b7280",
        }}
      >
        Loading profile...
      </Typography>
    </Box>
  );
}

// ======================================================
// ERROR
// ======================================================

function ProfileError() {
  return (
    <Alert
      severity="error"
      sx={{
        borderRadius: 2.5,
      }}
    >
      Unable to load your profile.
      Please try again later.
    </Alert>
  );
}

// ======================================================
// PAGE
// ======================================================

export default function ProfilePage() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  if (authLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f8fafc",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const role = user?.role;

  return (
    <Box
      sx={{
        minHeight: "100vh",

        backgroundColor: "#f8fafc",

        p: {
          xs: 1.25,
          sm: 2.5,
          md: 3,
          lg: 4,
        },

        overflowX: "hidden",
      }}
    >
      {/* PAGE HEADER */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 1100,

          mx: "auto",

          mb: {
            xs: 2,
            md: 3,
          },
        }}
      >
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
        >
          <Box
            sx={{
              width: 40,
              height: 40,

              borderRadius: 2,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              backgroundColor:
                "#eef2ff",

              color: "#3150fd",

              flexShrink: 0,
            }}
          >
            <PersonOutlineOutlinedIcon />
          </Box>

          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: {
                  xs: 22,
                  sm: 25,
                  md: 28,
                },

                fontWeight: 750,

                color: "#111827",

                lineHeight: 1.2,
              }}
            >
              My Profile
            </Typography>

            <Typography
              sx={{
                mt: 0.5,

                fontSize: {
                  xs: 12.5,
                  sm: 14,
                },

                color: "#6b7280",
              }}
            >
              View and update your
              profile details.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* CONTENT */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 1100,
          mx: "auto",
        }}
      >
        {role === "STUDENT" && (
          <StudentProfileView />
        )}

        {role === "TEACHER" && (
          <TeacherProfileView />
        )}

        {!["STUDENT", "TEACHER"].includes(
          role
        ) && (
          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },

              borderRadius: 3,

              border:
                "1px solid #e5e7eb",

              backgroundColor:
                "#ffffff",
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "#3150fd",

                  width: {
                    xs: 60,
                    sm: 68,
                  },

                  height: {
                    xs: 60,
                    sm: 68,
                  },

                  fontWeight: 700,
                }}
              >
                {getInitials(
                  user?.name
                )}
              </Avatar>

              <Box
                sx={{
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: 17,

                    wordBreak:
                      "break-word",
                  }}
                >
                  {user?.name || "User"}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 13,
                    color: "#6b7280",
                    mt: 0.25,

                    wordBreak:
                      "break-word",
                  }}
                >
                  {user?.email ||
                    "No email available"}
                </Typography>

                <Chip
                  icon={
                    <SchoolOutlinedIcon fontSize="small" />
                  }
                  size="small"
                  label={
                    user?.role || "USER"
                  }
                  sx={{
                    mt: 1,

                    height: 28,

                    fontWeight: 600,
                  }}
                />
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>
    </Box>
  );
}
