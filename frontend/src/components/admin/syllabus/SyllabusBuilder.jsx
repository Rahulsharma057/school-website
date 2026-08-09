"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  FormControlLabel,
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createSyllabus, updateSyllabus } from "@/services/syllabusService";
import { getSchoolClasses } from "@/services/schoolClassService";

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const PLACEMENT_OPTIONS = [
  { value: "homepage", label: "Homepage" },
  { value: "academics-page", label: "Academics Page" },
  { value: "navbar-dropdown", label: "Navbar Dropdown" },
  { value: "footer", label: "Footer" },
  { value: "notice-board", label: "Notice Board" },
];

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const emptyTopic = () => ({ id: crypto.randomUUID(), title: "", description: "" });

const emptySubject = () => ({
  id: crypto.randomUUID(),
  name: "",
  topics: [emptyTopic()],
});

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function SyllabusBuilder({ editData, clearEdit }) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classId, setClassId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState(true);
  const [subjects, setSubjects] = useState([emptySubject()]);

  const [placements, setPlacements] = useState([]);
  const [viewRoles, setViewRoles] = useState([]);

  const { data: classesData } = useQuery({
    queryKey: ["school-classes"],
    queryFn: async () => {
      const res = await getSchoolClasses();
      return res.data;
    },
  });

  const classes = classesData?.data || [];

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
    setSchoolName(editData.schoolName || "");
    setClassId(editData.classId?._id || editData.classId || "");
    setAcademicYear(editData.academicYear || "");
    setDescription(editData.description || "");
    setSlug(editData.slug || "");
    setStatus(editData.status ?? true);
    setSubjects(
      editData.subjects?.length
        ? editData.subjects.map((s) => ({ ...s, topics: s.topics?.length ? s.topics : [emptyTopic()] }))
        : [emptySubject()],
    );
    setPlacements(editData.placements || []);
    setViewRoles(editData.accessControl?.viewRoles || []);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateSyllabus(editData._id, payload) : createSyllabus(payload),
    onSuccess: () => {
      toast.success(editData ? "Syllabus updated" : "Syllabus created");
      queryClient.invalidateQueries({ queryKey: ["syllabi"] });
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const addSubject = () => setSubjects((prev) => [...prev, emptySubject()]);
  const updateSubject = (id, patch) =>
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSubject = (id) => setSubjects((prev) => prev.filter((s) => s.id !== id));

  const moveSubject = (index, dir) => {
    setSubjects((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addTopic = (subjectId) =>
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, topics: [...s.topics, emptyTopic()] } : s)),
    );

  const updateTopic = (subjectId, topicId, patch) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId
          ? { ...s, topics: s.topics.map((t) => (t.id === topicId ? { ...t, ...patch } : t)) }
          : s,
      ),
    );

  const removeTopic = (subjectId, topicId) =>
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === subjectId ? { ...s, topics: s.topics.filter((t) => t.id !== topicId) } : s,
      ),
    );

  const togglePlacement = (value) =>
    setPlacements((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]));

  const toggleRole = (value) =>
    setViewRoles((prev) => (prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]));

  const previewSlug = slugify(slug || title) || "your-syllabus-title";

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Title is required"); setTab(0); return; }
    if (!schoolName.trim()) { toast.error("School name is required"); setTab(0); return; }
    if (!classId) { toast.error("Select a class"); setTab(0); return; }
    if (!subjects.length) { toast.error("Add at least one subject"); setTab(1); return; }

    for (const s of subjects) {
      if (!s.name.trim()) { toast.error("Every subject needs a name"); setTab(1); return; }
      for (const t of s.topics) {
        if (!t.title.trim()) { toast.error(`Every topic under "${s.name}" needs a title`); setTab(1); return; }
      }
    }

    mutation.mutate({
      title,
      schoolName,
      classId,
      academicYear,
      description,
      slug,
      status,
      subjects: subjects.map((s, i) => ({ ...s, order: i })),
      placements,
      accessControl: { viewRoles },
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Syllabus" : "Create Syllabus"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              A downloadable PDF is generated automatically from the subjects below.
            </Typography>
          </Box>
          {editData && (
            <Chip label={`Editing: ${editData.title}`} size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />
          )}
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1, borderBottom: "1px solid #e4e4e7" }}>
          <Tab label="Basics" />
          <Tab label="Subjects & Topics" />
          <Tab label="Placement" />
          <Tab label="Access" />
        </Tabs>

        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Title" placeholder="Annual Syllabus 2026-27" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField select fullWidth size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)}>
                {classes.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="School Name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Academic Year (optional)" placeholder="2026-27" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                size="small"
                label="Public Route"
                placeholder="Leave empty to auto-generate"
                helperText={`Will be available at /syllabus/${previewSlug}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <Stack spacing={2}>
            {subjects.map((subject, sIndex) => (
              <Card key={subject.id} variant="outlined" sx={{ border: "1px solid #e4e4e7", borderRadius: 2 }}>
                <Box sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <Chip label={`Subject ${sIndex + 1}`} size="small" sx={{ fontWeight: 700, bgcolor: "#18181b", color: "#fff" }} />
                    <TextField
                      size="small"
                      placeholder="Subject name (e.g. Mathematics)"
                      value={subject.name}
                      onChange={(e) => updateSubject(subject.id, { name: e.target.value })}
                      sx={{ flex: 1 }}
                    />
                    <Tooltip title="Move up">
                      <span>
                        <IconButton size="small" disabled={sIndex === 0} onClick={() => moveSubject(sIndex, -1)}>
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Move down">
                      <span>
                        <IconButton size="small" disabled={sIndex === subjects.length - 1} onClick={() => moveSubject(sIndex, 1)}>
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Remove subject">
                      <IconButton size="small" onClick={() => removeSubject(subject.id)} sx={{ color: "#dc2626" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack spacing={1} pl={2}>
                    {subject.topics.map((topic) => (
                      <Stack key={topic.id} direction="row" spacing={1} alignItems="flex-start">
                        <TextField
                          size="small"
                          placeholder="Topic title"
                          value={topic.title}
                          onChange={(e) => updateTopic(subject.id, topic.id, { title: e.target.value })}
                          sx={{ width: 240 }}
                        />
                        <TextField
                          size="small"
                          placeholder="Topic description (optional)"
                          value={topic.description}
                          onChange={(e) => updateTopic(subject.id, topic.id, { description: e.target.value })}
                          sx={{ flex: 1 }}
                        />
                        <IconButton size="small" onClick={() => removeTopic(subject.id, topic.id)} sx={{ color: "#dc2626" }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}

                    <Button size="small" startIcon={<AddIcon />} onClick={() => addTopic(subject.id)} sx={{ textTransform: "none", alignSelf: "flex-start", color: "#3f3f46" }}>
                      Add Topic
                    </Button>
                  </Stack>
                </Box>
              </Card>
            ))}
          </Stack>

          <Button
            startIcon={<AddIcon />}
            onClick={addSubject}
            variant="contained"
            disableElevation
            sx={{ mt: 2, bgcolor: "#18181b", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
          >
            Add Subject
          </Button>
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Where should this syllabus appear on the site?</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1.5 }}>
            Select every spot this should be linked from — the public page works regardless of what's selected here.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            {PLACEMENT_OPTIONS.map((p) => (
              <Chip
                key={p.value}
                label={p.label}
                clickable
                onClick={() => togglePlacement(p.value)}
                sx={{ fontWeight: 600, bgcolor: placements.includes(p.value) ? "#18181b" : "#f4f4f5", color: placements.includes(p.value) ? "#fff" : "#3f3f46" }}
              />
            ))}
          </Stack>
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Who can view this syllabus's public page?</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1.5 }}>Leave unchecked to keep it open to everyone (e.g. parents without an account).</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
            {ROLE_OPTIONS.map((role) => (
              <Chip
                key={role}
                label={role}
                clickable
                onClick={() => toggleRole(role)}
                sx={{ fontWeight: 600, bgcolor: viewRoles.includes(role) ? "#18181b" : "#f4f4f5", color: viewRoles.includes(role) ? "#fff" : "#3f3f46" }}
              />
            ))}
          </Stack>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Button
          sx={{ px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : editData ? "Update Syllabus" : "Save Syllabus"}
        </Button>
      </CardContent>
    </Card>
  );
}