"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  getFooter,
  updateFooter,
  uploadFooterLogo,
  removeFooterLogo,
  resetFooter,
} from "@/services/footerService";

import { SOCIAL_PLATFORM_OPTIONS, getSocialIcon } from "@/lib/socialIcons";
import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";

const uid = () => crypto.randomUUID();

const emptyLink = () => ({ id: uid(), label: "", url: "", openInNewTab: false });
const emptySection = () => ({ id: uid(), title: "New Section", links: [emptyLink()] });
const emptySocialLink = () => ({ id: uid(), platform: "facebook", label: "", url: "" });

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

// ---------------- Sortable link row (nested inside a section) ----------------

function SortableLinkRow({ link, updateLink, removeLink }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: link.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  return (
    <Stack ref={setNodeRef} style={style} direction="row" spacing={1} alignItems="center" mb={1}>
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <TextField
        size="small"
        placeholder="Label"
        value={link.label}
        onChange={(e) => updateLink({ label: e.target.value })}
        sx={{ flex: 1 }}
      />

      <TextField
        size="small"
        placeholder="/url or https://..."
        value={link.url}
        onChange={(e) => updateLink({ url: e.target.value })}
        sx={{ flex: 1.4 }}
      />

      <Tooltip title="Open in new tab">
        <Switch
          size="small"
          checked={link.openInNewTab}
          onChange={(e) => updateLink({ openInNewTab: e.target.checked })}
        />
      </Tooltip>

      <IconButton size="small" onClick={removeLink} sx={{ color: "#dc2626" }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

// ---------------- Sortable section card (drag to reorder sections) ----------------

function SortableSectionCard({ section, updateSection, removeSection }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  const linkSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateLink = (linkId, patch) =>
    updateSection({
      links: section.links.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    });

  const removeLink = (linkId) =>
    updateSection({ links: section.links.filter((l) => l.id !== linkId) });

  const addLink = () => updateSection({ links: [...section.links, emptyLink()] });

  const handleLinkDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = section.links.findIndex((l) => l.id === active.id);
    const newIndex = section.links.findIndex((l) => l.id === over.id);
    updateSection({ links: arrayMove(section.links, oldIndex, newIndex) });
  };

  return (
    <Card ref={setNodeRef} style={style} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e4e4e7" }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Tooltip title="Drag to reorder section">
            <IconButton
              size="small"
              {...attributes}
              {...listeners}
              sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa" }}
            >
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <TextField
            size="small"
            placeholder="Section title"
            value={section.title}
            onChange={(e) => updateSection({ title: e.target.value })}
            sx={{ flex: 1, maxWidth: 280 }}
          />

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Remove section">
            <IconButton size="small" onClick={removeSection} sx={{ color: "#dc2626" }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <DndContext sensors={linkSensors} collisionDetection={closestCenter} onDragEnd={handleLinkDragEnd}>
          <SortableContext items={section.links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            {section.links.map((link) => (
              <SortableLinkRow
                key={link.id}
                link={link}
                updateLink={(patch) => updateLink(link.id, patch)}
                removeLink={() => removeLink(link.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        <Button size="small" startIcon={<AddIcon />} onClick={addLink} sx={{ textTransform: "none", color: "#3f3f46", mt: 0.5 }}>
          Add Link
        </Button>
      </Box>
    </Card>
  );
}

// ---------------- Sortable social-link row ----------------

function SortableSocialRow({ item, updateItem, removeItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  const Icon = getSocialIcon(item.platform);

  return (
    <Stack ref={setNodeRef} style={style} direction="row" spacing={1.5} alignItems="center" mb={1.5}>
      <IconButton
        size="small"
        {...attributes}
        {...listeners}
        sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "#18181b", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon fontSize="small" />
      </Box>

      <TextField
        select
        size="small"
        value={item.platform}
        onChange={(e) => updateItem({ platform: e.target.value })}
        sx={{ width: 170 }}
      >
        {SOCIAL_PLATFORM_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </TextField>

      {item.platform === "custom" && (
        <TextField
          size="small"
          placeholder="Label (e.g. Discord)"
          value={item.label}
          onChange={(e) => updateItem({ label: e.target.value })}
          sx={{ width: 160 }}
        />
      )}

      <TextField
        size="small"
        placeholder="https://..."
        value={item.url}
        onChange={(e) => updateItem({ url: e.target.value })}
        sx={{ flex: 1 }}
      />

      <IconButton size="small" onClick={removeItem} sx={{ color: "#dc2626" }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

// ==================================================================
// Main builder
// ==================================================================

export default function FooterBuilder() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const [sections, setSections] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [showLogo, setShowLogo] = useState(true);
  const [description, setDescription] = useState("");
  const [copyrightText, setCopyrightText] = useState("");
  const [style, setStyle] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["footer", "admin"],
    queryFn: async () => (await getFooter()).data,
  });

  useEffect(() => {
    const footer = data?.data;
    if (!footer) return;

    setSections(footer.sections || []);
    setSocialLinks(footer.socialLinks || []);
    setShowLogo(footer.branding?.showLogo ?? true);
    setDescription(footer.branding?.description || "");
    setCopyrightText(footer.copyrightText || "");
    setStyle(footer.style || {});
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload) => updateFooter(payload),
    onSuccess: () => {
      toast.success("Footer saved");
      queryClient.invalidateQueries({ queryKey: ["footer"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Could not save footer"),
  });

  const logoUploadMutation = useMutation({
    mutationFn: (file) => uploadFooterLogo(file),
    onSuccess: () => {
      toast.success("Logo uploaded");
      queryClient.invalidateQueries({ queryKey: ["footer"] });
    },
    onError: () => toast.error("Logo upload failed"),
  });

  const logoRemoveMutation = useMutation({
    mutationFn: () => removeFooterLogo(),
    onSuccess: () => {
      toast.success("Logo removed");
      queryClient.invalidateQueries({ queryKey: ["footer"] });
    },
    onError: () => toast.error("Could not remove logo"),
  });

  const resetMutation = useMutation({
    mutationFn: () => resetFooter(),
    onSuccess: (res) => {
      toast.success("Footer reset to default");
      queryClient.setQueryData(["footer", "admin"], res);
      setResetConfirmOpen(false);
    },
    onError: () => toast.error("Reset failed"),
  });

  const sectionSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const socialSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateSection = (id, patch) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSection = (id) => setSections((prev) => prev.filter((s) => s.id !== id));
  const addSection = () => setSections((prev) => [...prev, emptySection()]);

  const handleSectionDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    setSections((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const updateSocial = (id, patch) =>
    setSocialLinks((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSocial = (id) => setSocialLinks((prev) => prev.filter((s) => s.id !== id));
  const addSocial = () => setSocialLinks((prev) => [...prev, emptySocialLink()]);

  const handleSocialDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = socialLinks.findIndex((s) => s.id === active.id);
    const newIndex = socialLinks.findIndex((s) => s.id === over.id);
    setSocialLinks((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  const setStyleField = (patch) => setStyle((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    for (const section of sections) {
      if (!section.title.trim()) {
        toast.error("Every section needs a title");
        setTab(0);
        return;
      }
      for (const link of section.links) {
        if (!link.label.trim() || !link.url.trim()) {
          toast.error(`Every link in "${section.title}" needs a label and URL`);
          setTab(0);
          return;
        }
      }
    }

    for (const social of socialLinks) {
      if (!social.url.trim()) {
        toast.error("Every social link needs a URL");
        setTab(1);
        return;
      }
    }

    saveMutation.mutate({
      sections,
      socialLinks,
      branding: { showLogo, description },
      copyrightText,
      style,
    });
  };

  if (isLoading) return <LoadingSkeleton />;

  const footer = data?.data;

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>Footer</Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Fully customizable — sections, links, social icons, branding, and colors.
            </Typography>
          </Box>

          <Button
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => setResetConfirmOpen(true)}
            sx={{ textTransform: "none", color: "#dc2626", border: "1px solid #fecaca" }}
          >
            Reset to Default
          </Button>
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1, borderBottom: "1px solid #e4e4e7" }}>
          <Tab label="Sections & Links" />
          <Tab label="Social Links" />
          <Tab label="Branding" />
          <Tab label="Style" />
        </Tabs>

        {/* ============= TAB 0: SECTIONS & LINKS ============= */}
        <TabPanel value={tab} index={0}>
          <DndContext sensors={sectionSensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <Stack spacing={2}>
                {sections.map((section) => (
                  <SortableSectionCard
                    key={section.id}
                    section={section}
                    updateSection={(patch) => updateSection(section.id, patch)}
                    removeSection={() => removeSection(section.id)}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>

          <Button
            startIcon={<AddIcon />}
            onClick={addSection}
            variant="contained"
            disableElevation
            sx={{ mt: 2, bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
          >
            Add Section
          </Button>
        </TabPanel>

        {/* ============= TAB 1: SOCIAL LINKS ============= */}
        <TabPanel value={tab} index={1}>
          <DndContext sensors={socialSensors} collisionDetection={closestCenter} onDragEnd={handleSocialDragEnd}>
            <SortableContext items={socialLinks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {socialLinks.map((item) => (
                <SortableSocialRow
                  key={item.id}
                  item={item}
                  updateItem={(patch) => updateSocial(item.id, patch)}
                  removeItem={() => removeSocial(item.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            startIcon={<AddIcon />}
            onClick={addSocial}
            variant="contained"
            disableElevation
            sx={{ mt: 1, bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
          >
            Add Social Link
          </Button>
        </TabPanel>

        {/* ============= TAB 2: BRANDING ============= */}
        <TabPanel value={tab} index={2}>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            {footer?.branding?.logoUrl ? (
              <Box component="img" src={footer.branding.logoUrl} alt="Logo" sx={{ width: 64, height: 64, objectFit: "contain", border: "1px solid #e4e4e7", borderRadius: 1.5, p: 1 }} />
            ) : (
              <Box sx={{ width: 64, height: 64, border: "1px dashed #d4d4d8", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa" }}>
                <CloudUploadIcon fontSize="small" />
              </Box>
            )}

            <Button component="label" size="small" disabled={logoUploadMutation.isPending} sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}>
              {logoUploadMutation.isPending ? "Uploading..." : "Upload Logo"}
              <input hidden type="file" accept="image/*" onChange={(e) => e.target.files[0] && logoUploadMutation.mutate(e.target.files[0])} />
            </Button>

            {footer?.branding?.logoUrl && (
              <Button size="small" onClick={() => logoRemoveMutation.mutate()} disabled={logoRemoveMutation.isPending} sx={{ textTransform: "none", color: "#dc2626" }}>
                Remove
              </Button>
            )}
          </Stack>

          <FormControlLabel
            control={<Switch checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />}
            label="Show logo in footer"
            sx={{ mb: 2, display: "block" }}
          />

          <TextField
            fullWidth
            size="small"
            multiline
            rows={2}
            label="Tagline / Description"
            placeholder="A short line about your school, shown under the logo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </TabPanel>

        {/* ============= TAB 3: STYLE ============= */}
        <TabPanel value={tab} index={3}>
          <Grid container spacing={2.5}>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Background</Typography>
              <TextField fullWidth size="small" type="color" value={style.bgColor || "#18181b"} onChange={(e) => setStyleField({ bgColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Heading Text</Typography>
              <TextField fullWidth size="small" type="color" value={style.headingColor || "#ffffff"} onChange={(e) => setStyleField({ headingColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Body Text</Typography>
              <TextField fullWidth size="small" type="color" value={style.textColor || "#d4d4d8"} onChange={(e) => setStyleField({ textColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Border</Typography>
              <TextField fullWidth size="small" type="color" value={style.borderColor || "#27272a"} onChange={(e) => setStyleField({ borderColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Link</Typography>
              <TextField fullWidth size="small" type="color" value={style.linkColor || "#a1a1aa"} onChange={(e) => setStyleField({ linkColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, mb: 0.5 }}>Link Hover</Typography>
              <TextField fullWidth size="small" type="color" value={style.linkHoverColor || "#ffffff"} onChange={(e) => setStyleField({ linkHoverColor: e.target.value })} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Columns" value={style.columns || 4} onChange={(e) => setStyleField({ columns: Number(e.target.value) })}>
                {[2, 3, 4, 5, 6].map((c) => (
                  <MenuItem key={c} value={c}>{c} columns</MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Alignment" value={style.alignment || "left"} onChange={(e) => setStyleField({ alignment: e.target.value })}>
                <MenuItem value="left">Left</MenuItem>
                <MenuItem value="center">Center</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Padding" value={style.padding || "comfortable"} onChange={(e) => setStyleField({ padding: e.target.value })}>
                <MenuItem value="compact">Compact</MenuItem>
                <MenuItem value="comfortable">Comfortable</MenuItem>
                <MenuItem value="spacious">Spacious</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={style.showDivider ?? true} onChange={(e) => setStyleField({ showDivider: e.target.checked })} />}
                label="Show divider line above copyright bar"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Copyright Text"
                helperText="Use {year} to auto-insert the current year"
                value={copyrightText}
                onChange={(e) => setCopyrightText(e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Button
          sx={{ px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
          disableElevation
          disabled={saveMutation.isPending}
          onClick={handleSave}
        >
          {saveMutation.isPending ? "Saving..." : "Save Footer"}
        </Button>
      </CardContent>

      <ConfirmationDialog
        open={resetConfirmOpen}
        title="Reset Footer to Default"
        message="This replaces all sections, links, social links, branding, and colors with the default footer. This cannot be undone."
        loading={resetMutation.isPending}
        confirmText="Reset to Default"
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={() => resetMutation.mutate()}
      />
    </Card>
  );
}
