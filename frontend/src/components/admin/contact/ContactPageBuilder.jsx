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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createContactPage, updateContactPage } from "@/services/contactPageService";
import { getForms } from "@/services/formService";

const SOCIAL_OPTIONS = [
  "facebook",
  "instagram",
  "twitter",
  "youtube",
  "linkedin",
  "whatsapp",
  "telegram",
  "pinterest",
];

const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const slugify = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

const emptyAddress = () => ({ id: crypto.randomUUID(), label: "", addressLine: "", mapEmbedUrl: "", showOnPage: true });
const emptyPhone = () => ({ id: crypto.randomUUID(), label: "", number: "", enableCall: true, enableWhatsapp: true });
const emptyEmail = () => ({ id: crypto.randomUUID(), label: "", address: "" });
const emptySocial = () => ({ id: crypto.randomUUID(), platform: "facebook", url: "" });

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function ContactPageBuilder({ editData, clearEdit }) {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState(true);

  const [addresses, setAddresses] = useState([emptyAddress()]);
  const [phones, setPhones] = useState([emptyPhone()]);
  const [emails, setEmails] = useState([emptyEmail()]);
  const [socialLinks, setSocialLinks] = useState([]);

  const [contactFormId, setContactFormId] = useState("");
  const [layoutStyle, setLayoutStyle] = useState("split");
  const [primaryColor, setPrimaryColor] = useState("#18181b");

  const [viewRoles, setViewRoles] = useState([]);

  const { data: formsData } = useQuery({
    queryKey: ["forms", "for-contact-page"],
    queryFn: async () => {
      const res = await getForms({ limit: 100 });
      return res.data;
    },
  });

  const forms = formsData?.data?.data || [];

  useEffect(() => {
    if (!editData) {
      setTab(0);
      setTitle("");
      setSubtitle("");
      setSlug("");
      setStatus(true);
      setAddresses([emptyAddress()]);
      setPhones([emptyPhone()]);
      setEmails([emptyEmail()]);
      setSocialLinks([]);
      setContactFormId("");
      setLayoutStyle("split");
      setPrimaryColor("#18181b");
      setViewRoles([]);
      return;
    }

    setTitle(editData.title || "");
    setSubtitle(editData.subtitle || "");
    setSlug(editData.slug || "");
    setStatus(editData.status ?? true);
    setAddresses(editData.addresses?.length ? editData.addresses : [emptyAddress()]);
    setPhones(editData.phones?.length ? editData.phones : [emptyPhone()]);
    setEmails(editData.emails?.length ? editData.emails : [emptyEmail()]);
    setSocialLinks(editData.socialLinks || []);
    setContactFormId(editData.contactFormId?._id || editData.contactFormId || "");
    setLayoutStyle(editData.layout?.style || "split");
    setPrimaryColor(editData.layout?.primaryColor || "#18181b");
    setViewRoles(editData.accessControl?.viewRoles || []);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) =>
      editData ? updateContactPage(editData._id, payload) : createContactPage(payload),
    onSuccess: () => {
      toast.success(editData ? "Contact page updated" : "Contact page created");
      queryClient.invalidateQueries({ queryKey: ["contact-pages"] });
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  // ---- generic list helpers (used for addresses/phones/emails/social) ----
  const addItem = (setter, factory) => setter((prev) => [...prev, factory()]);
  const updateItem = (setter, id, patch) =>
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const removeItem = (setter, id) => setter((prev) => prev.filter((item) => item.id !== id));

  const toggleRole = (role) =>
    setViewRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));

  const previewSlug = slugify(slug || title) || "your-page-title";

  const handleSubmit = () => {
    if (!title.trim()) { toast.error("Title is required"); setTab(0); return; }

    for (const a of addresses) {
      if (a.label.trim() && !a.addressLine.trim()) {
        toast.error(`Address "${a.label}" needs an address line`);
        setTab(1);
        return;
      }
    }

    for (const p of phones) {
      if (p.label.trim() && !p.number.trim()) {
        toast.error(`Phone "${p.label}" needs a number`);
        setTab(2);
        return;
      }
    }

    mutation.mutate({
      title,
      subtitle,
      slug,
      status,
      addresses: addresses.filter((a) => a.label.trim() && a.addressLine.trim()),
      phones: phones.filter((p) => p.label.trim() && p.number.trim()),
      emails: emails.filter((e) => e.label.trim() && e.address.trim()),
      socialLinks: socialLinks.filter((s) => s.url.trim()),
      contactFormId: contactFormId || null,
      layout: { style: layoutStyle, primaryColor },
      accessControl: { viewRoles },
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Contact Page" : "Create Contact Page"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Address, phone, email, social links, map, and an optional enquiry form.
            </Typography>
          </Box>
          {editData && (
            <Chip label={`Editing: ${editData.title}`} size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />
          )}
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1, borderBottom: "1px solid #e4e4e7" }}>
          <Tab label="Basics" />
          <Tab label="Address & Map" />
          <Tab label="Phone" />
          <Tab label="Email" />
          <Tab label="Social" />
          <Tab label="Form & Layout" />
          <Tab label="Access" />
        </Tabs>

        {/* ---- BASICS ---- */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Title" placeholder="Get in Touch" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Public Route"
                placeholder="Leave empty to auto-generate"
                helperText={`Will be available at /contact/${previewSlug}`}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Subtitle (optional)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active" />
            </Grid>
          </Grid>
        </TabPanel>

        {/* ---- ADDRESS & MAP ---- */}
        <TabPanel value={tab} index={1}>
          <Stack spacing={2}>
            {addresses.map((a, i) => (
              <Card key={a.id} variant="outlined" sx={{ p: 2, border: "1px solid #e4e4e7" }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Stack spacing={1.5} sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5}>
                      <TextField size="small" label="Label" placeholder="Head Office" value={a.label} onChange={(e) => updateItem(setAddresses, a.id, { label: e.target.value })} sx={{ width: 220 }} />
                      <FormControlLabel control={<Switch size="small" checked={a.showOnPage !== false} onChange={(e) => updateItem(setAddresses, a.id, { showOnPage: e.target.checked })} />} label="Show" />
                    </Stack>
                    <TextField size="small" fullWidth multiline rows={2} label="Address" value={a.addressLine} onChange={(e) => updateItem(setAddresses, a.id, { addressLine: e.target.value })} />
                    <TextField
                      size="small"
                      fullWidth
                      label="Google Maps Embed URL (optional)"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      helperText="Google Maps → Share → Embed a map → copy the src URL"
                      value={a.mapEmbedUrl}
                      onChange={(e) => updateItem(setAddresses, a.id, { mapEmbedUrl: e.target.value })}
                    />
                  </Stack>
                  <IconButton size="small" onClick={() => removeItem(setAddresses, a.id)} sx={{ color: "#dc2626" }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Card>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={() => addItem(setAddresses, emptyAddress)} sx={{ mt: 2, textTransform: "none", color: "#3f3f46" }}>
            Add Address
          </Button>
        </TabPanel>

        {/* ---- PHONE ---- */}
        <TabPanel value={tab} index={2}>
          <Stack spacing={1.5}>
            {phones.map((p) => (
              <Stack key={p.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
                <TextField size="small" label="Label" placeholder="Front Desk" value={p.label} onChange={(e) => updateItem(setPhones, p.id, { label: e.target.value })} sx={{ width: 180 }} />
                <TextField size="small" label="Number" placeholder="+91 98765 43210" value={p.number} onChange={(e) => updateItem(setPhones, p.id, { number: e.target.value })} sx={{ flex: 1 }} />
                <FormControlLabel control={<Switch size="small" checked={p.enableCall !== false} onChange={(e) => updateItem(setPhones, p.id, { enableCall: e.target.checked })} />} label="Call" />
                <FormControlLabel control={<Switch size="small" checked={p.enableWhatsapp !== false} onChange={(e) => updateItem(setPhones, p.id, { enableWhatsapp: e.target.checked })} />} label="WhatsApp" />
                <IconButton size="small" onClick={() => removeItem(setPhones, p.id)} sx={{ color: "#dc2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={() => addItem(setPhones, emptyPhone)} sx={{ mt: 2, textTransform: "none", color: "#3f3f46" }}>
            Add Phone
          </Button>
        </TabPanel>

        {/* ---- EMAIL ---- */}
        <TabPanel value={tab} index={3}>
          <Stack spacing={1.5}>
            {emails.map((e) => (
              <Stack key={e.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
                <TextField size="small" label="Label" placeholder="Admissions" value={e.label} onChange={(ev) => updateItem(setEmails, e.id, { label: ev.target.value })} sx={{ width: 220 }} />
                <TextField size="small" label="Email Address" placeholder="admissions@school.edu" value={e.address} onChange={(ev) => updateItem(setEmails, e.id, { address: ev.target.value })} sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => removeItem(setEmails, e.id)} sx={{ color: "#dc2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={() => addItem(setEmails, emptyEmail)} sx={{ mt: 2, textTransform: "none", color: "#3f3f46" }}>
            Add Email
          </Button>
        </TabPanel>

        {/* ---- SOCIAL ---- */}
        <TabPanel value={tab} index={4}>
          <Stack spacing={1.5}>
            {socialLinks.map((s) => (
              <Stack key={s.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1.5, border: "1px solid #e4e4e7", borderRadius: 1.5 }}>
                <TextField select size="small" label="Platform" value={s.platform} onChange={(e) => updateItem(setSocialLinks, s.id, { platform: e.target.value })} sx={{ width: 180 }}>
                  {SOCIAL_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt} sx={{ textTransform: "capitalize" }}>{opt}</MenuItem>
                  ))}
                </TextField>
                <TextField size="small" label="URL" placeholder="https://facebook.com/yourschool" value={s.url} onChange={(e) => updateItem(setSocialLinks, s.id, { url: e.target.value })} sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => removeItem(setSocialLinks, s.id)} sx={{ color: "#dc2626" }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Button startIcon={<AddIcon />} onClick={() => addItem(setSocialLinks, emptySocial)} sx={{ mt: 2, textTransform: "none", color: "#3f3f46" }}>
            Add Social Link
          </Button>
        </TabPanel>

        {/* ---- FORM & LAYOUT ---- */}
        <TabPanel value={tab} index={5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Enquiry Form (optional)"
                helperText="Create/manage forms under Forms → the entries table there also covers submissions from this page"
                value={contactFormId}
                onChange={(e) => setContactFormId(e.target.value)}
              >
                <MenuItem value="">No form — details only</MenuItem>
                {forms.map((f) => (
                  <MenuItem key={f._id} value={f._id}>{f.title}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField select fullWidth size="small" label="Layout" value={layoutStyle} onChange={(e) => setLayoutStyle(e.target.value)}>
                <MenuItem value="split">Split (details beside form)</MenuItem>
                <MenuItem value="stacked">Stacked (form below details)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField fullWidth size="small" label="Accent Color" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} sx={{ "& input": { height: 28, cursor: "pointer" } }} />
            </Grid>
          </Grid>
        </TabPanel>

        {/* ---- ACCESS ---- */}
        <TabPanel value={tab} index={6}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Who can view this page?</Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1.5 }}>Leave unchecked — contact pages are public by default.</Typography>
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
          {mutation.isPending ? "Saving..." : editData ? "Update Contact Page" : "Save Contact Page"}
        </Button>
      </CardContent>
    </Card>
  );
}