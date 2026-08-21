"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SubjectIcon from "@mui/icons-material/MenuBook";
import TopicIcon from "@mui/icons-material/Topic";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "react-toastify";

import {
  createSyllabus,
  updateSyllabus,
} from "@/services/syllabusService";

import {
  getSchoolClasses,
} from "@/services/schoolClassService";

const ROLE_OPTIONS = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "VIEWER",
];

const PLACEMENT_OPTIONS = [
  {
    value: "homepage",
    label: "Homepage",
  },
  {
    value: "academics-page",
    label: "Academics Page",
  },
  {
    value: "navbar-dropdown",
    label: "Navbar Dropdown",
  },
  {
    value: "footer",
    label: "Footer",
  },
  {
    value: "notice-board",
    label: "Notice Board",
  },
];

const uid = () => {
  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
};

const emptySubtopic = () => ({
  id: uid(),
  title: "",
  description: "",
});

const emptyTopic = () => ({
  id: uid(),
  title: "",
  description: "",
  subtopics: [emptySubtopic()],
});

const emptySubject = () => ({
  id: uid(),
  name: "",
  topics: [emptyTopic()],
});

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

function TabPanel({
  value,
  index,
  children,
}) {
  if (value !== index) return null;

  return (
    <Box sx={{ pt: 3 }}>
      {children}
    </Box>
  );
}

export default function SyllabusBuilder({
  editData,
  clearEdit,
}) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] =
    useState("");
  const [description, setDescription] =
    useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState(true);

  const [subjects, setSubjects] = useState([
    emptySubject(),
  ]);

  const [placements, setPlacements] =
    useState([]);

  const [viewRoles, setViewRoles] =
    useState([]);

  const {
    data: classesData,
    isLoading: classesLoading,
  } = useQuery({
    queryKey: [
      "school-classes",
      { includeInactive: false },
    ],

    queryFn: async () => {
      const res = await getSchoolClasses({
        includeInactive: "false",
      });

      return res.data;
    },
  });

  const classes = Array.isArray(
    classesData?.data
  )
    ? classesData.data
    : [];

  useEffect(() => {
    if (!editData) {
      setTab(0);
      setTitle("");
      setSchoolName("");
      setClassId("");
      setAcademicYear("");
      setDescription("");
      setSlug("");
      setStatus(true);
      setSubjects([emptySubject()]);
      setPlacements([]);
      setViewRoles([]);

      return;
    }

    setTitle(editData.title || "");

    setSchoolName(
      editData.schoolName || ""
    );

    setClassId(
      editData.classId?._id ||
        editData.classId ||
        ""
    );

    setAcademicYear(
      editData.academicYear || ""
    );

    setDescription(
      editData.description || ""
    );

    setSlug(editData.slug || "");

    setStatus(
      editData.status ?? true
    );

    setSubjects(
      editData.subjects?.length
        ? editData.subjects.map(
            (subject) => ({
              ...subject,

              topics:
                subject.topics?.length
                  ? subject.topics.map(
                      (topic) => ({
                        ...topic,

                        subtopics:
                          topic.subtopics
                            ?.length
                            ? topic.subtopics
                            : [emptySubtopic()],
                      })
                    )
                  : [emptyTopic()],
            })
          )
        : [emptySubject()]
    );

    setPlacements(
      editData.placements || []
    );

    setViewRoles(
      editData.accessControl
        ?.viewRoles || []
    );
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData
        ? updateSyllabus(
            editData._id,
            payload
          )
        : createSyllabus(payload),

    onSuccess: () => {
      toast.success(
        editData
          ? "Syllabus updated successfully"
          : "Syllabus created successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["syllabi"],
      });

      clearEdit?.();
    },

    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          "Something went wrong"
      );
    },
  });

  // ================= SUBJECT =================

  const addSubject = () => {
    setSubjects((prev) => [
      ...prev,
      emptySubject(),
    ]);
  };

  const updateSubject = (
    subjectId,
    patch
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              ...patch,
            }
          : subject
      )
    );
  };

  const removeSubject = (
    subjectId
  ) => {
    setSubjects((prev) =>
      prev.filter(
        (subject) =>
          subject.id !== subjectId
      )
    );
  };

  const moveSubject = (
    index,
    direction
  ) => {
    setSubjects((prev) => {
      const next = [...prev];
      const target =
        index + direction;

      if (
        target < 0 ||
        target >= next.length
      ) {
        return prev;
      }

      [
        next[index],
        next[target],
      ] = [
        next[target],
        next[index],
      ];

      return next;
    });
  };

  // ================= TOPIC =================

  const addTopic = (
    subjectId
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: [
                ...(subject.topics || []),
                emptyTopic(),
              ],
            }
          : subject
      )
    );
  };

  const updateTopic = (
    subjectId,
    topicId,
    patch
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,

              topics:
                subject.topics.map(
                  (topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,
                          ...patch,
                        }
                      : topic
                ),
            }
          : subject
      )
    );
  };

  const removeTopic = (
    subjectId,
    topicId
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,

              topics:
                subject.topics.filter(
                  (topic) =>
                    topic.id !== topicId
                ),
            }
          : subject
      )
    );
  };

  // ================= SUBTOPIC =================

  const addSubtopic = (
    subjectId,
    topicId
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,

              topics:
                subject.topics.map(
                  (topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,

                          subtopics: [
                            ...(topic.subtopics ||
                              []),
                            emptySubtopic(),
                          ],
                        }
                      : topic
                ),
            }
          : subject
      )
    );
  };

  const updateSubtopic = (
    subjectId,
    topicId,
    subtopicId,
    patch
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,

              topics:
                subject.topics.map(
                  (topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,

                          subtopics:
                            topic.subtopics.map(
                              (
                                subtopic
                              ) =>
                                subtopic.id ===
                                subtopicId
                                  ? {
                                      ...subtopic,
                                      ...patch,
                                    }
                                  : subtopic
                            ),
                        }
                      : topic
                ),
            }
          : subject
      )
    );
  };

  const removeSubtopic = (
    subjectId,
    topicId,
    subtopicId
  ) => {
    setSubjects((prev) =>
      prev.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,

              topics:
                subject.topics.map(
                  (topic) =>
                    topic.id === topicId
                      ? {
                          ...topic,

                          subtopics:
                            topic.subtopics.filter(
                              (subtopic) =>
                                subtopic.id !==
                                subtopicId
                            ),
                        }
                      : topic
                ),
            }
          : subject
      )
    );
  };

  // ================= PLACEMENT =================

  const togglePlacement = (
    value
  ) => {
    setPlacements((prev) =>
      prev.includes(value)
        ? prev.filter(
            (item) => item !== value
          )
        : [...prev, value]
    );
  };

  const toggleRole = (value) => {
    setViewRoles((prev) =>
      prev.includes(value)
        ? prev.filter(
            (item) => item !== value
          )
        : [...prev, value]
    );
  };

  // ================= SUBMIT =================

  const previewSlug =
    slugify(slug || title) ||
    "your-syllabus-title";

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      setTab(0);
      return;
    }

    if (!schoolName.trim()) {
      toast.error(
        "School name is required"
      );
      setTab(0);
      return;
    }

    if (!classId) {
      toast.error(
        "Please select a class"
      );
      setTab(0);
      return;
    }

    if (!subjects.length) {
      toast.error(
        "Add at least one subject"
      );
      setTab(1);
      return;
    }

    for (const subject of subjects) {
      if (!subject.name.trim()) {
        toast.error(
          "Every subject needs a name"
        );
        setTab(1);
        return;
      }

      for (const topic of subject.topics ||
        []) {
        if (!topic.title.trim()) {
          toast.error(
            `Every topic under "${subject.name}" needs a title`
          );
          setTab(1);
          return;
        }

        for (const subtopic of topic.subtopics ||
          []) {
          if (!subtopic.title.trim()) {
            toast.error(
              `Every subtopic under "${topic.title}" needs a title`
            );
            setTab(1);
            return;
          }
        }
      }
    }

    const payload = {
      title: title.trim(),

      schoolName:
        schoolName.trim(),

      classId,

      academicYear:
        academicYear.trim(),

      description:
        description.trim(),

      slug: slug.trim(),

      status,

      subjects: subjects.map(
        (subject, subjectIndex) => ({
          id: subject.id,

          name: subject.name.trim(),

          order: subjectIndex,

          topics: (
            subject.topics || []
          ).map(
            (
              topic,
              topicIndex
            ) => ({
              id: topic.id,

              title:
                topic.title.trim(),

              description:
                topic.description?.trim() ||
                "",

              order: topicIndex,

              subtopics: (
                topic.subtopics || []
              ).map(
                (
                  subtopic,
                  subtopicIndex
                ) => ({
                  id: subtopic.id,

                  title:
                    subtopic.title.trim(),

                  description:
                    subtopic.description?.trim() ||
                    "",

                  order:
                    subtopicIndex,
                })
              ),
            })
          ),
        })
      ),

      placements,

      accessControl: {
        viewRoles,
      },
    };

    mutation.mutate(payload);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        borderColor: "#e4e4e7",
        boxShadow: "none",
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
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
          spacing={1}
          mb={2}
        >
          <Box>
            <Typography
              variant="h5"
              fontWeight={800}
            >
              {editData
                ? "Update Syllabus"
                : "Create Syllabus"}
            </Typography>

            <Typography
              sx={{
                fontSize: 13,
                color: "#71717a",
              }}
            >
              Subject → Topic → Subtopic
            </Typography>
          </Box>

          {editData && (
            <Chip
              label={`Editing: ${editData.title}`}
              size="small"
              sx={{
                bgcolor: "#7e22ce",
                color: "#fff",
                fontWeight: 700,
              }}
            />
          )}
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, value) =>
            setTab(value)
          }
          variant="scrollable"
          sx={{
            borderBottom:
              "1px solid #e4e4e7",
          }}
        >
          <Tab label="Basics" />
          <Tab label="Subjects & Topics" />
          <Tab label="Placement" />
          <Tab label="Access" />
        </Tabs>

        {/* ================= BASICS ================= */}

        <TabPanel
          value={tab}
          index={0}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Syllabus Title"
                placeholder="Annual Syllabus 2026-27"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Class"
                value={classId}
                onChange={(e) =>
                  setClassId(
                    e.target.value
                  )
                }
                disabled={classesLoading}
                helperText={
                  classesLoading
                    ? "Loading classes..."
                    : "Classes come from School Class module"
                }
              >
                {classes.map((c) => (
                  <MenuItem
                    key={c._id}
                    value={c._id}
                  >
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="School Name"
                value={schoolName}
                onChange={(e) =>
                  setSchoolName(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Academic Year"
                placeholder="2026-27"
                value={academicYear}
                onChange={(e) =>
                  setAcademicYear(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                label="Public Route"
                placeholder="Leave empty to auto-generate"
                helperText={`/syllabus/${previewSlug}`}
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value
                  )
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.checked
                      )
                    }
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Description"
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* ================= SUBJECTS ================= */}

        <TabPanel
          value={tab}
          index={1}
        >
          <Stack spacing={2}>
            {subjects.map(
              (
                subject,
                subjectIndex
              ) => (
                <Card
                  key={subject.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    borderColor:
                      "#ddd6fe",
                    overflow: "hidden",
                  }}
                >
                  {/* SUBJECT HEADER */}

                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#faf5ff",
                    }}
                  >
                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      alignItems={{
                        xs: "stretch",
                        sm: "center",
                      }}
                      spacing={1}
                    >
                      <Chip
                        icon={
                          <SubjectIcon />
                        }
                        label={`Subject ${
                          subjectIndex + 1
                        }`}
                        sx={{
                          bgcolor:
                            "#7e22ce",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Mathematics"
                        value={
                          subject.name
                        }
                        onChange={(e) =>
                          updateSubject(
                            subject.id,
                            {
                              name:
                                e.target
                                  .value,
                            }
                          )
                        }
                        sx={{
                          bgcolor: "#fff",
                        }}
                      />

                      <Stack
                        direction="row"
                        spacing={0.5}
                      >
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                subjectIndex ===
                                0
                              }
                              onClick={() =>
                                moveSubject(
                                  subjectIndex,
                                  -1
                                )
                              }
                            >
                              <ArrowUpwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                subjectIndex ===
                                subjects.length -
                                  1
                              }
                              onClick={() =>
                                moveSubject(
                                  subjectIndex,
                                  1
                                )
                              }
                            >
                              <ArrowDownwardIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Delete subject">
                          <IconButton
                            size="small"
                            onClick={() =>
                              removeSubject(
                                subject.id
                              )
                            }
                            sx={{
                              color:
                                "#dc2626",
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      {(
                        subject.topics ||
                        []
                      ).map(
                        (
                          topic,
                          topicIndex
                        ) => (
                          <Box
                            key={
                              topic.id
                            }
                            sx={{
                              border:
                                "1px solid #e4e4e7",
                              borderRadius: 2,
                              p: 1.5,
                              bgcolor:
                                "#fff",
                            }}
                          >
                            {/* TOPIC */}

                            <Stack
                              direction={{
                                xs: "column",
                                sm: "row",
                              }}
                              spacing={1}
                              alignItems={{
                                xs: "stretch",
                                sm: "center",
                              }}
                            >
                              <Chip
                                icon={
                                  <TopicIcon />
                                }
                                label={`Topic ${
                                  topicIndex +
                                  1
                                }`}
                                size="small"
                                sx={{
                                  bgcolor:
                                    "#f3e8ff",
                                  color:
                                    "#7e22ce",
                                  fontWeight: 700,
                                }}
                              />

                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Real Numbers"
                                value={
                                  topic.title
                                }
                                onChange={(
                                  e
                                ) =>
                                  updateTopic(
                                    subject.id,
                                    topic.id,
                                    {
                                      title:
                                        e
                                          .target
                                          .value,
                                    }
                                  )
                                }
                              />

                              <IconButton
                                size="small"
                                onClick={() =>
                                  removeTopic(
                                    subject.id,
                                    topic.id
                                  )
                                }
                                sx={{
                                  color:
                                    "#dc2626",
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>

                            <TextField
                              fullWidth
                              size="small"
                              multiline
                              rows={2}
                              placeholder="Topic description..."
                              value={
                                topic.description ||
                                ""
                              }
                              onChange={(
                                e
                              ) =>
                                updateTopic(
                                  subject.id,
                                  topic.id,
                                  {
                                    description:
                                      e
                                        .target
                                        .value,
                                  }
                                )
                              }
                              sx={{
                                mt: 1,
                              }}
                            />

                            {/* SUBTOPICS */}

                            <Box
                              sx={{
                                mt: 2,
                                ml: {
                                  xs: 0,
                                  sm: 3,
                                },
                                pl: {
                                  xs: 0,
                                  sm: 2,
                                },
                                borderLeft: {
                                  xs: "none",
                                  sm: "2px solid #ede9fe",
                                },
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color:
                                    "#71717a",
                                  mb: 1,
                                  textTransform:
                                    "uppercase",
                                }}
                              >
                                Subtopics
                              </Typography>

                              <Stack spacing={1}>
                                {(
                                  topic.subtopics ||
                                  []
                                ).map(
                                  (
                                    subtopic,
                                    subtopicIndex
                                  ) => (
                                    <Stack
                                      key={
                                        subtopic.id
                                      }
                                      direction={{
                                        xs: "column",
                                        sm: "row",
                                      }}
                                      spacing={
                                        1
                                      }
                                    >
                                      <Chip
                                        label={
                                          subtopicIndex +
                                          1
                                        }
                                        size="small"
                                        sx={{
                                          width:
                                            28,
                                          bgcolor:
                                            "#f4f4f5",
                                          fontWeight: 700,
                                        }}
                                      />

                                      <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Euclid's Division Lemma"
                                        value={
                                          subtopic.title
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateSubtopic(
                                            subject.id,
                                            topic.id,
                                            subtopic.id,
                                            {
                                              title:
                                                e
                                                  .target
                                                  .value,
                                            }
                                          )
                                        }
                                      />

                                      <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Subtopic description..."
                                        value={
                                          subtopic.description ||
                                          ""
                                        }
                                        onChange={(
                                          e
                                        ) =>
                                          updateSubtopic(
                                            subject.id,
                                            topic.id,
                                            subtopic.id,
                                            {
                                              description:
                                                e
                                                  .target
                                                  .value,
                                            }
                                          )
                                        }
                                      />

                                      <IconButton
                                        size="small"
                                        onClick={() =>
                                          removeSubtopic(
                                            subject.id,
                                            topic.id,
                                            subtopic.id
                                          )
                                        }
                                        sx={{
                                          color:
                                            "#dc2626",
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                  )
                                )}
                              </Stack>

                              <Button
                                size="small"
                                startIcon={
                                  <AddIcon />
                                }
                                onClick={() =>
                                  addSubtopic(
                                    subject.id,
                                    topic.id
                                  )
                                }
                                sx={{
                                  mt: 1,
                                  textTransform:
                                    "none",
                                  color:
                                    "#7e22ce",
                                  fontWeight: 700,
                                }}
                              >
                                Add Subtopic
                              </Button>
                            </Box>
                          </Box>
                        )
                      )}
                    </Stack>

                    <Button
                      size="small"
                      startIcon={
                        <AddIcon />
                      }
                      onClick={() =>
                        addTopic(
                          subject.id
                        )
                      }
                      sx={{
                        mt: 2,
                        textTransform:
                          "none",
                        color:
                          "#52525b",
                        fontWeight: 700,
                      }}
                    >
                      Add Topic
                    </Button>
                  </Box>
                </Card>
              )
            )}
          </Stack>

          <Button
            variant="contained"
            startIcon={
              <AddIcon />
            }
            onClick={addSubject}
            sx={{
              mt: 2,
              bgcolor: "#7e22ce",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "#6b21a8",
              },
            }}
          >
            Add Subject
          </Button>
        </TabPanel>

        {/* ================= PLACEMENT ================= */}

        <TabPanel
          value={tab}
          index={2}
        >
          <Typography
            fontWeight={700}
            mb={0.5}
          >
            Where should this syllabus appear?
          </Typography>

          <Typography
            sx={{
              fontSize: 12,
              color: "#71717a",
              mb: 2,
            }}
          >
            Select one or more locations.
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            rowGap={1}
          >
            {PLACEMENT_OPTIONS.map(
              (item) => {
                const active =
                  placements.includes(
                    item.value
                  );

                return (
                  <Chip
                    key={item.value}
                    label={item.label}
                    clickable
                    onClick={() =>
                      togglePlacement(
                        item.value
                      )
                    }
                    sx={{
                      fontWeight: 700,
                      bgcolor: active
                        ? "#7e22ce"
                        : "#f4f4f5",
                      color: active
                        ? "#fff"
                        : "#3f3f46",
                    }}
                  />
                );
              }
            )}
          </Stack>
        </TabPanel>

        {/* ================= ACCESS ================= */}

        <TabPanel
          value={tab}
          index={3}
        >
          <Typography
            fontWeight={700}
            mb={0.5}
          >
            Who can view this syllabus?
          </Typography>

          <Typography
            sx={{
              fontSize: 12,
              color: "#71717a",
              mb: 2,
            }}
          >
            Leave empty for public access.
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            rowGap={1}
          >
            {ROLE_OPTIONS.map(
              (role) => {
                const active =
                  viewRoles.includes(
                    role
                  );

                return (
                  <Chip
                    key={role}
                    label={role}
                    clickable
                    onClick={() =>
                      toggleRole(role)
                    }
                    sx={{
                      fontWeight: 700,
                      bgcolor: active
                        ? "#18181b"
                        : "#f4f4f5",
                      color: active
                        ? "#fff"
                        : "#3f3f46",
                    }}
                  />
                );
              }
            )}
          </Stack>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
        >
          <Button
            variant="contained"
            disableElevation
            disabled={
              mutation.isPending
            }
            onClick={handleSubmit}
            sx={{
              px: 4,
              py: 1.3,
              bgcolor: "#7e22ce",
              textTransform: "none",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "#6b21a8",
              },
            }}
          >
            {mutation.isPending
              ? "Saving..."
              : editData
              ? "Update Syllabus"
              : "Save Syllabus"}
          </Button>

          {editData && (
            <Button
              variant="outlined"
              onClick={() =>
                clearEdit?.()
              }
              sx={{
                textTransform:
                  "none",
                fontWeight: 700,
              }}
            >
              Cancel Edit
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}