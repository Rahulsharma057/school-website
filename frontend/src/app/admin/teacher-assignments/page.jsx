"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Typography,
  Paper,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  FormControl,
  InputLabel,
  FormHelperText,
  Divider,
  Stack,
  Chip,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";

import {
  Delete,
  PersonOutline,
  ClassOutlined,
  SubjectOutlined,
  AssignmentTurnedInOutlined,
} from "@mui/icons-material";

import { useClasses } from "@/hooks/useClasses";

import {
  useAssignTeacher,
  useAllAssignments,
  useRemoveAssignment,
} from "@/hooks/useTeacherAssignments";

import { useAllTeachers } from "@/hooks/useTeacher";

export default function TeacherAssignmentsPage() {
  const { data: teachers = [] } = useAllTeachers();
  const { data: classes = [] } = useClasses();

  const {
    mutate: assignTeacher,
    isPending,
  } = useAssignTeacher();

  const { data: assignments = [] } = useAllAssignments();

  const { mutate: removeAssignment } =
    useRemoveAssignment();

  const [form, setForm] = useState({
    teacherId: "",
    classId: "",
    subject: "",
    isClassTeacher: false,
  });

  const [errors, setErrors] = useState({});

  const handleTeacherChange = (e) => {
    setForm({
      ...form,
      teacherId: e.target.value,
    });

    if (errors.teacherId) {
      setErrors((prev) => ({
        ...prev,
        teacherId: "",
      }));
    }
  };

  const handleClassChange = (e) => {
    setForm({
      ...form,
      classId: e.target.value,
    });

    if (errors.classId) {
      setErrors((prev) => ({
        ...prev,
        classId: "",
      }));
    }
  };

  const handleSubjectChange = (e) => {
    setForm({
      ...form,
      subject: e.target.value,
    });
  };

  const handleClassTeacherChange = (e) => {
    setForm({
      ...form,
      isClassTeacher: e.target.checked,
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.teacherId) {
      newErrors.teacherId = "Please select a teacher";
    }

    if (!form.classId) {
      newErrors.classId = "Please select a class";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    assignTeacher(form, {
      onSuccess: () => {
        setForm({
          teacherId: "",
          classId: "",
          subject: "",
          isClassTeacher: false,
        });

        setErrors({});
      },
    });
  };

  const handleRemove = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this teacher assignment?"
    );

    if (!confirmed) return;

    removeAssignment(id);
  };

  return (
    <Box
      sx={{
        p: {
          xs: 2,
          sm: 3,
          md: 4,
        },
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          fontWeight={700}
          sx={{ mb: 0.5 }}
        >
          Teacher-Class Assignments
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Assign teachers to classes and manage their subjects.
        </Typography>
      </Box>

      {/* Assignment Form */}
      <Card
        elevation={0}
        sx={{
          maxWidth: 850,
          mb: 3,
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
          {/* Form Header */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <AssignmentTurnedInOutlined color="primary" />

            <Typography
              variant="h6"
              fontWeight={600}
            >
              Assign Teacher
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Select a teacher and class to create an assignment.
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2.5}>
            {/* Teacher */}
            <FormControl
              fullWidth
              error={Boolean(errors.teacherId)}
            >
              <InputLabel>Teacher</InputLabel>

              <Select
                value={form.teacherId}
                label="Teacher"
                onChange={handleTeacherChange}
                startAdornment={
                  <PersonOutline
                    color="action"
                    sx={{ mr: 1 }}
                  />
                }
              >
                <MenuItem value="">
                  <em>Select Teacher</em>
                </MenuItem>

                {teachers.map((teacher) => (
                  <MenuItem
                    key={teacher._id}
                    value={teacher._id}
                  >
                    {teacher.name}{" "}
                    {teacher.email
                      ? `(${teacher.email})`
                      : ""}
                  </MenuItem>
                ))}
              </Select>

              {errors.teacherId && (
                <FormHelperText>
                  {errors.teacherId}
                </FormHelperText>
              )}
            </FormControl>

            {/* Class */}
            <FormControl
              fullWidth
              error={Boolean(errors.classId)}
            >
              <InputLabel>Class</InputLabel>

              <Select
                value={form.classId}
                label="Class"
                onChange={handleClassChange}
                startAdornment={
                  <ClassOutlined
                    color="action"
                    sx={{ mr: 1 }}
                  />
                }
              >
                <MenuItem value="">
                  <em>Select Class</em>
                </MenuItem>

                {classes.map((classItem) => (
                  <MenuItem
                    key={classItem._id}
                    value={classItem._id}
                  >
                    {classItem.className} -{" "}
                    {classItem.section}
                  </MenuItem>
                ))}
              </Select>

              {errors.classId && (
                <FormHelperText>
                  {errors.classId}
                </FormHelperText>
              )}
            </FormControl>

            {/* Subject */}
            <TextField
              fullWidth
              label="Subject"
              value={form.subject}
              onChange={handleSubjectChange}
              placeholder="e.g. Mathematics"
              helperText="Optional"
              InputProps={{
                startAdornment: (
                  <SubjectOutlined
                    color="action"
                    sx={{ mr: 1 }}
                  />
                ),
              }}
            />

            {/* Class Teacher */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isClassTeacher}
                  onChange={handleClassTeacherChange}
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    Make Class Teacher
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Assign this teacher as the in-charge of
                    the selected class.
                  </Typography>
                </Box>
              }
            />

            {/* Button */}
            <Box>
              <Button
                variant="contained"
                startIcon={<AssignmentTurnedInOutlined />}
                onClick={handleSubmit}
                disabled={isPending}
                sx={{
                  minWidth: 150,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "none",
                  },
                }}
              >
                {isPending
                  ? "Assigning..."
                  : "Assign Teacher"}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          backgroundColor: "#fff",
          overflow: "hidden",
        }}
      >
        <CardContent
          sx={{
            p: 0,
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 3,
              },
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
            >
              Assigned Teachers
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              View and manage all teacher-class assignments.
            </Typography>
          </Box>

          <Divider />

          {/* Responsive Table */}
          <Box
            sx={{
              width: "100%",
              overflowX: "auto",
            }}
          >
            <Table
              sx={{
                minWidth: 750,
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Teacher
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Class
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Subject
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Class Teacher
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow
                    key={assignment._id}
                    hover
                  >
                    {/* Teacher */}
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {assignment.teacher?.name || "—"}
                      </Typography>

                      {assignment.teacher?.email && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {assignment.teacher.email}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Class */}
                    <TableCell>
                      <Typography variant="body2">
                        {assignment.class?.className || "—"}
                        {" - "}
                        {assignment.class?.section || "—"}
                      </Typography>
                    </TableCell>

                    {/* Subject */}
                    <TableCell>
                      {assignment.subject ? (
                        <Typography variant="body2">
                          {assignment.subject}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          —
                        </Typography>
                      )}
                    </TableCell>

                    {/* Class Teacher */}
                    <TableCell>
                      {assignment.isClassTeacher ? (
                        <Chip
                          label="Yes"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          label="No"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      <Tooltip title="Remove Assignment">
                        <IconButton
                          color="error"
                          onClick={() =>
                            handleRemove(assignment._id)
                          }
                          size="small"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}

                {/* Empty State */}
                {assignments.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      align="center"
                      sx={{ py: 6 }}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        color="text.secondary"
                      >
                        No assignments yet
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Assign a teacher to a class to see it
                        here.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}