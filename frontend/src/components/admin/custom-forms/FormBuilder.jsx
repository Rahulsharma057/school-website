"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
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
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import TuneIcon from "@mui/icons-material/Tune";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TitleIcon from "@mui/icons-material/Title";

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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createForm, updateForm } from "@/services/formService";

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "file", label: "File Upload" },
  { value: "section", label: "Section Heading" },
];

const DEFAULT_DATATYPE_MAP = {
  text: "String",
  textarea: "String",
  email: "String",
  phone: "String",
  number: "Number",
  date: "Date",
  select: "String",
  radio: "String",
  checkbox: "Array",
  file: "String",
  section: "String",
};

const DATATYPE_OPTIONS = ["String", "Number", "Boolean", "Date", "Array"];
const ROLE_OPTIONS = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];

const LAYOUT_STYLES = [
  { value: "card", label: "Card (bordered)" },
  { value: "plain", label: "Plain" },
  { value: "minimal", label: "Minimal" },
];

const WIDTH_OPTIONS = [
  { value: "full", label: "Full width" },
  { value: "half", label: "Half width" },
  { value: "third", label: "One third" },
  { value: "quarter", label: "One quarter" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "is equal to" },
  { value: "notEquals", label: "is not equal to" },
  { value: "contains", label: "includes (checkbox)" },
];

const OPTIONS_TYPES = ["select", "radio", "checkbox"];
const TEXT_LENGTH_TYPES = ["text", "textarea", "email", "phone"];

const ALLOWED_FILE_TYPES = [
  { value: "image/jpeg", label: "JPEG Image" },
  { value: "image/png", label: "PNG Image" },
  { value: "image/webp", label: "WEBP Image" },
  { value: "image/gif", label: "GIF Image" },
  { value: "application/pdf", label: "PDF" },
  { value: "application/msword", label: "Word (.doc)" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word (.docx)" },
  { value: "application/vnd.ms-excel", label: "Excel (.xls)" },
  { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel (.xlsx)" },
];

const HARD_MAX_LENGTH = 10_000;
const HARD_MAX_FILE_SIZE_MB = 25;
const HARD_MAX_FILES_PER_FIELD = 10;

const slugify = (text = "") => text.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");
const slugifyName = (label) => label.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^\w]+/g, "");

const emptyConditional = () => ({ enabled: false, logic: "AND", rules: [], requiredWhenVisible: false });

const emptyField = () => ({
  id: crypto.randomUUID(),
  type: "text",
  dataType: "String",
  label: "",
  name: "",
  placeholder: "",
  helpText: "",
  required: false,
  options: [],
  width: "full",
  showInTable: true,
  minLength: null,
  maxLength: 500,
  min: null,
  max: null,
  accept: [],
  maxFileSizeMB: 5,
  maxFiles: 1,
  conditional: emptyConditional(),
});

// ================= OPTIONS EDITOR =================

function OptionsEditor({ options, onChange }) {
  const addOption = () => onChange([...(options || []), ""]);
  const updateOption = (index, value) => {
    const next = [...options];
    next[index] = value;
    onChange(next);
  };
  const removeOption = (index) => onChange(options.filter((_, i) => i !== index));
  const moveOption = (index, dir) => {
    const target = index + dir;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a", mb: 1 }}>
        OPTIONS {options?.length ? `(${options.length})` : ""}
      </Typography>

      {(!options || options.length === 0) && (
        <Box sx={{ border: "1px dashed #d4d4d8", borderRadius: 1.5, p: 2, textAlign: "center", mb: 1.5 }}>
          <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>No options yet — add at least one below.</Typography>
        </Box>
      )}

      <Stack spacing={1} mb={1.5}>
        {(options || []).map((opt, index) => (
          <Stack key={index} direction="row" spacing={0.5} alignItems="center">
            <Chip label={index + 1} size="small" sx={{ fontWeight: 700, bgcolor: "#f4f4f5", color: "#3f3f46", minWidth: 28 }} />
            <TextField size="small" fullWidth placeholder={`Option ${index + 1}`} value={opt} onChange={(e) => updateOption(index, e.target.value)} />
            <Tooltip title="Move up">
              <span>
                <IconButton size="small" disabled={index === 0} onClick={() => moveOption(index, -1)}>
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Move down">
              <span>
                <IconButton size="small" disabled={index === options.length - 1} onClick={() => moveOption(index, 1)}>
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Remove option">
              <IconButton size="small" onClick={() => removeOption(index)} sx={{ color: "#dc2626" }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ))}
      </Stack>

      <Button size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}>
        Add Option
      </Button>
    </Box>
  );
}

// ================= CONDITIONAL RULES EDITOR =================
// Multiple rules, combined with AND/OR — "show/require this field only
// when ALL (AND) or ANY (OR) of these rules are true".

function ConditionalEditor({ conditional, allFields, currentFieldId, onChange }) {
  const c = conditional || emptyConditional();

  const addRule = () =>
    onChange({ ...c, rules: [...(c.rules || []), { fieldName: "", operator: "equals", value: "" }] });

  const updateRule = (index, patch) => {
    const next = [...c.rules];
    next[index] = { ...next[index], ...patch };
    onChange({ ...c, rules: next });
  };

  const removeRule = (index) => onChange({ ...c, rules: c.rules.filter((_, i) => i !== index) });

  const candidateFields = allFields.filter((f) => f.id !== currentFieldId && f.name && f.type !== "section");

  return (
    <Box>
      <FormControlLabel
        control={<Switch size="small" checked={c.enabled} onChange={(e) => onChange({ ...c, enabled: e.target.checked })} />}
        label="Only show this field conditionally"
      />

      {c.enabled && (
        <Box sx={{ mt: 1.5, pl: { md: 4 } }}>
          {c.rules.length > 1 && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
              <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>Match</Typography>
              <TextField
                select
                size="small"
                value={c.logic || "AND"}
                onChange={(e) => onChange({ ...c, logic: e.target.value })}
                sx={{ width: 110 }}
              >
                <MenuItem value="AND">ALL (AND)</MenuItem>
                <MenuItem value="OR">ANY (OR)</MenuItem>
              </TextField>
              <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>of these rules:</Typography>
            </Stack>
          )}

          <Stack spacing={1.5}>
            {(c.rules || []).map((rule, index) => {
              const watchedField = candidateFields.find((f) => f.name === rule.fieldName);
              return (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <TextField
                    select
                    size="small"
                    label="When field"
                    value={rule.fieldName || ""}
                    onChange={(e) => updateRule(index, { fieldName: e.target.value, value: "" })}
                    sx={{ minWidth: 160, flex: 1 }}
                  >
                    {candidateFields.map((f) => (
                      <MenuItem key={f.id} value={f.name}>
                        {f.label || f.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Condition"
                    value={rule.operator || "equals"}
                    onChange={(e) => updateRule(index, { operator: e.target.value })}
                    sx={{ minWidth: 140 }}
                  >
                    {CONDITION_OPERATORS.map((op) => (
                      <MenuItem key={op.value} value={op.value}>
                        {op.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  {watchedField && OPTIONS_TYPES.includes(watchedField.type) ? (
                    <TextField
                      select
                      size="small"
                      label="Value"
                      value={rule.value || ""}
                      onChange={(e) => updateRule(index, { value: e.target.value })}
                      sx={{ minWidth: 140, flex: 1 }}
                    >
                      {(watchedField.options || []).map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <TextField
                      size="small"
                      label="Value"
                      value={rule.value || ""}
                      onChange={(e) => updateRule(index, { value: e.target.value })}
                      sx={{ minWidth: 140, flex: 1 }}
                    />
                  )}

                  <IconButton size="small" onClick={() => removeRule(index)} sx={{ color: "#dc2626" }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>

          {c.rules.length === 0 && (
            <Typography sx={{ fontSize: 12, color: "#dc2626", mb: 1 }}>Add at least one rule, or turn this off.</Typography>
          )}

          <Button size="small" startIcon={<AddIcon />} onClick={addRule} sx={{ mt: 1, textTransform: "none", color: "#3f3f46" }}>
            Add Rule
          </Button>

          <Box sx={{ mt: 1.5 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={c.requiredWhenVisible}
                  onChange={(e) => onChange({ ...c, requiredWhenVisible: e.target.checked })}
                />
              }
              label="Also make this field required only while visible"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ================= SORTABLE FIELD CARD =================

function SortableField({ field, index, allFields, updateField, removeField, duplicateField }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

  const isSection = field.type === "section";
  const needsOptions = OPTIONS_TYPES.includes(field.type);
  const needsLengthBounds = TEXT_LENGTH_TYPES.includes(field.type);
  const needsNumberBounds = field.type === "number";
  const needsFileConfig = field.type === "file";
  const conditional = field.conditional || emptyConditional();

  if (isSection) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        variant="outlined"
        sx={{ borderRadius: 2, border: "1px dashed #d4d4d8", bgcolor: "#fafafa" }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
            <Tooltip title="Drag to reorder">
              <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: "grab", touchAction: "none", color: "#a1a1aa" }}>
                <DragIndicatorIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <TitleIcon sx={{ fontSize: 16, color: "#71717a" }} />
            <Chip label="Section" size="small" sx={{ fontWeight: 700, bgcolor: "#18181b", color: "#fff" }} />
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Duplicate">
              <IconButton size="small" onClick={duplicateField} sx={{ color: "#52525b" }}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Remove">
              <IconButton size="small" onClick={removeField} sx={{ color: "#dc2626" }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Section Title"
                placeholder="e.g. Parent Details"
                value={field.label}
                onChange={(e) => updateField({ label: e.target.value, name: field._nameTouched ? field.name : slugifyName(e.target.value) || `section_${index}` })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Subtitle (optional)"
                value={field.helpText}
                onChange={(e) => updateField({ helpText: e.target.value })}
              />
            </Grid>
          </Grid>
        </Box>
      </Card>
    );
  }

  return (
    <Card ref={setNodeRef} style={style} variant="outlined" sx={{ borderRadius: 2, border: "1px solid #e4e4e7" }}>
      <Box sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Tooltip title="Drag to reorder">
            <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: isDragging ? "grabbing" : "grab", touchAction: "none", color: "#a1a1aa" }}>
              <DragIndicatorIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Chip label={`#${index + 1}`} size="small" sx={{ fontWeight: 700, bgcolor: "#18181b", color: "#fff" }} />

          <Chip
            icon={<ViewColumnIcon sx={{ fontSize: 14 }} />}
            label={WIDTH_OPTIONS.find((w) => w.value === field.width)?.label || "Full width"}
            size="small"
            variant="outlined"
            sx={{ fontSize: 11, borderColor: "#e4e4e7", color: "#71717a" }}
          />

          {conditional.enabled && (
            <Chip label={`Conditional (${conditional.rules?.length || 0})`} size="small" sx={{ fontSize: 11, bgcolor: "#fef3c7", color: "#b45309" }} />
          )}

          <Box sx={{ flex: 1 }} />

          <Tooltip title="Duplicate field">
            <IconButton size="small" onClick={duplicateField} sx={{ color: "#52525b" }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove field">
            <IconButton size="small" onClick={removeField} sx={{ color: "#dc2626" }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              label="Field Label"
              value={field.label}
              onChange={(e) => {
                const label = e.target.value;
                updateField({ label, name: field._nameTouched ? field.name : slugifyName(label) });
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              size="small"
              label="Field Type"
              value={field.type}
              onChange={(e) => {
                const type = e.target.value;
                const stillNeedsOptions = OPTIONS_TYPES.includes(type);
                updateField({
                  type,
                  dataType: field._dataTypeTouched ? field.dataType : DEFAULT_DATATYPE_MAP[type] || "String",
                  options: stillNeedsOptions ? (field.options?.length ? field.options : [""]) : field.options,
                });
              }}
            >
              {FIELD_TYPES.filter((t) => t.value !== "section").map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={8} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Storage Key"
              helperText="Key in submitted data"
              value={field.name}
              onChange={(e) => updateField({ name: e.target.value, _nameTouched: true })}
            />
          </Grid>

          <Grid item xs={4} md={2}>
            <TextField
              select
              fullWidth
              size="small"
              label="Data Type"
              helperText="Table column type"
              value={field.dataType || "String"}
              onChange={(e) => updateField({ dataType: e.target.value, _dataTypeTouched: true })}
            >
              {DATATYPE_OPTIONS.map((dt) => (
                <MenuItem key={dt} value={dt}>
                  {dt}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              size="small"
              label="Width"
              helperText="How much row space this field takes"
              value={field.width || "full"}
              onChange={(e) => updateField({ width: e.target.value })}
            >
              {WIDTH_OPTIONS.map((w) => (
                <MenuItem key={w.value} value={w.value}>
                  {w.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {field.type !== "checkbox" && field.type !== "radio" && (
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Placeholder" value={field.placeholder} onChange={(e) => updateField({ placeholder: e.target.value })} />
            </Grid>
          )}

          <Grid item xs={12} md={field.type !== "checkbox" && field.type !== "radio" ? 4 : 8}>
            <TextField fullWidth size="small" label="Help Text (optional)" value={field.helpText} onChange={(e) => updateField({ helpText: e.target.value })} />
          </Grid>

          {needsOptions && (
            <Grid item xs={12}>
              <OptionsEditor options={field.options || []} onChange={(next) => updateField({ options: next })} />
            </Grid>
          )}

          {(needsLengthBounds || needsNumberBounds || needsFileConfig) && (
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1, mt: 0.5 }}>
                <TuneIcon sx={{ fontSize: 16, color: "#a1a1aa" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#71717a" }}>VALIDATION</Typography>
              </Stack>

              <Grid container spacing={2}>
                {needsLengthBounds && (
                  <>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Min Length"
                        value={field.minLength ?? ""}
                        onChange={(e) => updateField({ minLength: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max Length"
                        helperText={`Up to ${HARD_MAX_LENGTH.toLocaleString()}`}
                        value={field.maxLength ?? ""}
                        onChange={(e) =>
                          updateField({
                            maxLength: e.target.value === "" ? null : Math.min(HARD_MAX_LENGTH, Math.max(1, Number(e.target.value))),
                          })
                        }
                      />
                    </Grid>
                  </>
                )}

                {needsNumberBounds && (
                  <>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Min Value"
                        value={field.min ?? ""}
                        onChange={(e) => updateField({ min: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max Value"
                        value={field.max ?? ""}
                        onChange={(e) => updateField({ max: e.target.value === "" ? null : Number(e.target.value) })}
                      />
                    </Grid>
                  </>
                )}

                {needsFileConfig && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Allowed File Types"
                        helperText="Leave empty to default to images only"
                        SelectProps={{
                          multiple: true,
                          renderValue: (selected) =>
                            selected.length
                              ? selected.map((v) => ALLOWED_FILE_TYPES.find((t) => t.value === v)?.label || v).join(", ")
                              : "Images (default)",
                        }}
                        value={field.accept || []}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateField({ accept: typeof value === "string" ? value.split(",") : value });
                        }}
                      >
                        {ALLOWED_FILE_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            <Checkbox size="small" checked={(field.accept || []).includes(t.value)} />
                            {t.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max File Size (MB)"
                        helperText={`Up to ${HARD_MAX_FILE_SIZE_MB}MB`}
                        value={field.maxFileSizeMB ?? ""}
                        onChange={(e) =>
                          updateField({
                            maxFileSizeMB: e.target.value === "" ? 5 : Math.min(HARD_MAX_FILE_SIZE_MB, Math.max(1, Number(e.target.value))),
                          })
                        }
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Max Files"
                        helperText={`Up to ${HARD_MAX_FILES_PER_FIELD}`}
                        value={field.maxFiles ?? ""}
                        onChange={(e) =>
                          updateField({
                            maxFiles: e.target.value === "" ? 1 : Math.min(HARD_MAX_FILES_PER_FIELD, Math.max(1, Number(e.target.value))),
                          })
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          )}

          <Grid item xs={12}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={<Switch size="small" checked={field.required} onChange={(e) => updateField({ required: e.target.checked })} />}
                label="Required"
              />
              <FormControlLabel
                control={<Switch size="small" checked={field.showInTable !== false} onChange={(e) => updateField({ showInTable: e.target.checked })} />}
                label="Show as column in admin table"
              />
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <ConditionalEditor
              conditional={conditional}
              allFields={allFields}
              currentFieldId={field.id}
              onChange={(next) => updateField({ conditional: next })}
            />
          </Grid>
        </Grid>
      </Box>
    </Card>
  );
}

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

// ================= MAIN =================

export default function FormBuilder({ editData, clearEdit }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitButtonText, setSubmitButtonText] = useState("Submit");
  const [successMessage, setSuccessMessage] = useState("Thank you! Your response has been submitted.");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [status, setStatus] = useState(true);
  const [fields, setFields] = useState([]);

  const [layoutColumns, setLayoutColumns] = useState(1);
  const [layoutStyle, setLayoutStyle] = useState("card");
  const [primaryColor, setPrimaryColor] = useState("#18181b");

  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("Are you sure you want to submit this form?");
  const [allowSubmitterEdit, setAllowSubmitterEdit] = useState(false);
  const [editWindowHours, setEditWindowHours] = useState(72);
  const [autoResponderEnabled, setAutoResponderEnabled] = useState(false);
  const [autoResponderSubject, setAutoResponderSubject] = useState("We received your submission");
  const [autoResponderMessage, setAutoResponderMessage] = useState("Thanks for submitting {{formTitle}}. We'll be in touch soon.");

  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const [honeypotEnabled, setHoneypotEnabled] = useState(true);
  const [duplicateCheckEnabled, setDuplicateCheckEnabled] = useState(false);
  const [duplicateWindowHours, setDuplicateWindowHours] = useState(24);

  const [adminTableSlug, setAdminTableSlug] = useState("");
  const [tableSlugTouched, setTableSlugTouched] = useState(false);

  const [viewRoles, setViewRoles] = useState([]);
  const [tableViewRoles, setTableViewRoles] = useState(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!editData) {
      setTab(0);
      setTitle("");
      setSlug("");
      setDescription("");
      setSubmitButtonText("Submit");
      setSuccessMessage("Thank you! Your response has been submitted.");
      setNotifyEmail("");
      setStatus(true);
      setFields([]);
      setAdminTableSlug("");
      setTableSlugTouched(false);
      setLayoutColumns(1);
      setLayoutStyle("card");
      setPrimaryColor("#18181b");
      setRequireConfirmation(false);
      setConfirmationMessage("Are you sure you want to submit this form?");
      setAllowSubmitterEdit(false);
      setEditWindowHours(72);
      setAutoResponderEnabled(false);
      setAutoResponderSubject("We received your submission");
      setAutoResponderMessage("Thanks for submitting {{formTitle}}. We'll be in touch soon.");
      setWebhookEnabled(false);
      setWebhookUrl("");
      setHoneypotEnabled(true);
      setDuplicateCheckEnabled(false);
      setDuplicateWindowHours(24);
      setViewRoles([]);
      setTableViewRoles(["SUPER_ADMIN", "ADMIN", "EDITOR"]);
      return;
    }

    setTitle(editData.title || "");
    setSlug(editData.slug || "");
    setDescription(editData.description || "");
    setSubmitButtonText(editData.submitButtonText || "Submit");
    setSuccessMessage(editData.successMessage || "");
    setNotifyEmail(editData.notifyEmail || "");
    setStatus(editData.status ?? true);
    setFields(
      (editData.fields || []).map((f) => ({
        ...emptyField(),
        ...f,
        conditional: { ...emptyConditional(), ...(f.conditional || {}), rules: f.conditional?.rules || [] },
        _nameTouched: true,
        _dataTypeTouched: true,
      })),
    );
    setAdminTableSlug(editData.adminTableSlug || "");
    setTableSlugTouched(true);

    setLayoutColumns(editData.layout?.columns === 2 ? 2 : 1);
    setLayoutStyle(editData.layout?.style || "card");
    setPrimaryColor(editData.layout?.primaryColor || "#18181b");

    setRequireConfirmation(editData.submission?.requireConfirmation || false);
    setConfirmationMessage(editData.submission?.confirmationMessage || "Are you sure you want to submit this form?");
    setAllowSubmitterEdit(editData.submission?.allowSubmitterEdit || false);
    setEditWindowHours(editData.submission?.editWindowHours ?? 72);
    setAutoResponderEnabled(editData.submission?.autoResponder?.enabled || false);
    setAutoResponderSubject(editData.submission?.autoResponder?.subject || "We received your submission");
    setAutoResponderMessage(
      editData.submission?.autoResponder?.message || "Thanks for submitting {{formTitle}}. We'll be in touch soon.",
    );

    setWebhookEnabled(editData.notifications?.webhookEnabled || false);
    setWebhookUrl(editData.notifications?.webhookUrl || "");

    setHoneypotEnabled(editData.antiSpam?.honeypotEnabled !== false);
    setDuplicateCheckEnabled(editData.antiSpam?.duplicateCheck?.enabled || false);
    setDuplicateWindowHours(editData.antiSpam?.duplicateCheck?.windowHours ?? 24);

    setViewRoles(editData.accessControl?.viewRoles || []);
    setTableViewRoles(editData.accessControl?.tableViewRoles || ["SUPER_ADMIN", "ADMIN", "EDITOR"]);
  }, [editData]);

  const mutation = useMutation({
    mutationFn: (payload) => (editData ? updateForm(editData._id, payload) : createForm(payload)),
    onSuccess: () => {
      toast.success(editData ? "Form updated" : "Form created");
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["form"] });
      clearEdit?.();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Something went wrong"),
  });

  const addField = () => setFields((prev) => [...prev, emptyField()]);
  const addSection = () =>
    setFields((prev) => [
      ...prev,
      { ...emptyField(), type: "section", dataType: "String", name: `section_${prev.length}`, _nameTouched: true },
    ]);

  const updateField = (id, patch) => setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const removeField = (id) => setFields((prev) => prev.filter((f) => f.id !== id));

  const duplicateField = (id) => {
    setFields((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx === -1) return prev;
      const clone = { ...prev[idx], id: crypto.randomUUID(), name: prev[idx].type === "section" ? `${prev[idx].name}_copy` : `${prev[idx].name}_copy` };
      return [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)];
    });
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setFields((prev) => {
      const oldIndex = prev.findIndex((f) => f.id === active.id);
      const newIndex = prev.findIndex((f) => f.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleRole = (list, setList, role) => setList(list.includes(role) ? list.filter((r) => r !== role) : [...list, role]);

  const previewFormSlug = slugify(slug || title) || "your-form-title";
  const previewTableSlug = slugify(adminTableSlug) || slugify(slug || title) || "your-form-title";

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Title is required");
      setTab(0);
      return;
    }

    const realFields = fields.filter((f) => f.type !== "section");

    if (!realFields.length) {
      toast.error("Add at least one field (section headings don't count)");
      setTab(0);
      return;
    }

    for (const f of fields) {
      if (!f.label.trim()) {
        toast.error(f.type === "section" ? "Every section needs a title" : "Every field needs a label");
        setTab(0);
        return;
      }
      if (!f.name.trim()) {
        toast.error(`"${f.label}" is missing a storage key`);
        setTab(0);
        return;
      }

      if (f.type === "section") continue;

      if (OPTIONS_TYPES.includes(f.type)) {
        const cleanOptions = (f.options || []).map((o) => o.trim()).filter(Boolean);
        if (!cleanOptions.length) {
          toast.error(`Field "${f.label}" needs at least one option`);
          setTab(0);
          return;
        }
      }

      if (TEXT_LENGTH_TYPES.includes(f.type)) {
        if (f.minLength != null && f.maxLength != null && Number(f.minLength) > Number(f.maxLength)) {
          toast.error(`Field "${f.label}": Min Length can't be greater than Max Length`);
          setTab(0);
          return;
        }
      }

      if (f.type === "number" && f.min != null && f.max != null && Number(f.min) > Number(f.max)) {
        toast.error(`Field "${f.label}": Min Value can't be greater than Max Value`);
        setTab(0);
        return;
      }

      if (f.conditional?.enabled && !(f.conditional.rules || []).length) {
        toast.error(`Field "${f.label}" has conditional logic on but no rules defined`);
        setTab(0);
        return;
      }

      if (f.conditional?.enabled) {
        for (const rule of f.conditional.rules) {
          if (!rule.fieldName) {
            toast.error(`Field "${f.label}" has a conditional rule with no field selected`);
            setTab(0);
            return;
          }
          if (rule.fieldName === f.name) {
            toast.error(`Field "${f.label}" cannot conditionally depend on itself`);
            setTab(0);
            return;
          }
        }
      }
    }

    const names = fields.map((f) => f.name);
    if (new Set(names).size !== names.length) {
      toast.error("Storage keys must be unique across fields");
      setTab(0);
      return;
    }

    if (webhookEnabled && !webhookUrl.trim()) {
      toast.error("Enter a webhook URL, or turn off webhook notifications");
      setTab(2);
      return;
    }

    mutation.mutate({
      title,
      slug,
      description,
      fields: fields.map(({ _nameTouched, _dataTypeTouched, ...f }) => ({
        ...f,
        options: OPTIONS_TYPES.includes(f.type) ? (f.options || []).map((o) => o.trim()).filter(Boolean) : f.options,
      })),
      submitButtonText,
      successMessage,
      notifyEmail,
      status,
      adminTableSlug,
      layout: { columns: layoutColumns, style: layoutStyle, primaryColor },
      submission: {
        requireConfirmation,
        confirmationMessage,
        allowSubmitterEdit,
        editWindowHours,
        autoResponder: {
          enabled: autoResponderEnabled,
          subject: autoResponderSubject,
          message: autoResponderMessage,
        },
      },
      notifications: { webhookEnabled, webhookUrl },
      antiSpam: {
        honeypotEnabled,
        duplicateCheck: { enabled: duplicateCheckEnabled, windowHours: duplicateWindowHours },
      },
      accessControl: { viewRoles, tableViewRoles },
    });
  };

  return (
    <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
              {editData ? "Update Form" : "Create Form"}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#71717a" }}>
              Fields, layout, submission behavior, notifications, spam controls, routes, and access.
            </Typography>
          </Box>
          {editData && (
            <Chip label={`Editing: ${editData.title}`} size="small" sx={{ bgcolor: "#18181b", color: "#fff", fontWeight: 600 }} />
          )}
        </Stack>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 1, borderBottom: "1px solid #e4e4e7" }}>
          <Tab label="Basics & Fields" />
          <Tab label="Layout" />
          <Tab label="Submission" />
          <Tab label="Notifications" />
          <Tab label="Spam Protection" />
          <Tab label="Routes" />
          <Tab label="Access" />
        </Tabs>

        {/* ================= TAB 0: BASICS & FIELDS ================= */}
        <TabPanel value={tab} index={0}>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size="small" label="Form Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Public Slug"
                placeholder="admission-enquiry"
                helperText="Leave empty to auto-generate from title"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" multiline rows={2} label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth size="small" label="Submit Button Text" value={submitButtonText} onChange={(e) => setSubmitButtonText(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Notify Email (optional)"
                helperText="Admin gets an email on every new submission"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel control={<Switch checked={status} onChange={(e) => setStatus(e.target.checked)} />} label="Active" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size="small" label="Success Message" value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} />
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" rowGap={1}>
            <Typography fontWeight={700}>
              Fields{" "}
              <Typography component="span" sx={{ color: "#a1a1aa", fontSize: 13 }}>
                ({fields.filter((f) => f.type !== "section").length})
              </Typography>
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<TitleIcon />}
                onClick={addSection}
                sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
              >
                Add Section
              </Button>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={addField}
                variant="contained"
                disableElevation
                sx={{ bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
              >
                Add Field
              </Button>
            </Stack>
          </Stack>

          {fields.length === 0 && (
            <Box sx={{ border: "1px dashed #d4d4d8", borderRadius: 2, p: 4, textAlign: "center", color: "#a1a1aa", mb: 3 }}>
              <Typography fontSize={14}>No fields yet. Click "Add Field" to start.</Typography>
            </Box>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <Stack spacing={2}>
                {fields.map((field, index) => (
                  <SortableField
                    key={field.id}
                    field={field}
                    index={index}
                    allFields={fields}
                    updateField={(patch) => updateField(field.id, patch)}
                    removeField={() => removeField(field.id)}
                    duplicateField={() => duplicateField(field.id)}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        </TabPanel>

        {/* ================= TAB 1: LAYOUT ================= */}
        <TabPanel value={tab} index={1}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Container Width"
                helperText="Narrow suits short forms; Wide gives more room for half/third/quarter fields"
                value={layoutColumns}
                onChange={(e) => setLayoutColumns(Number(e.target.value))}
              >
                <MenuItem value={1}>Narrow</MenuItem>
                <MenuItem value={2}>Wide</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField select fullWidth size="small" label="Style" value={layoutStyle} onChange={(e) => setLayoutStyle(e.target.value)}>
                {LAYOUT_STYLES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Primary Color"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                sx={{ "& input": { height: 28, cursor: "pointer" } }}
              />
            </Grid>
          </Grid>
          <Typography sx={{ fontSize: 12.5, color: "#a1a1aa", mt: 2 }}>
            Each field's own "Width" setting always controls how much row space it takes — on mobile every field
            always renders full-width regardless of this setting.
          </Typography>
        </TabPanel>

        {/* ================= TAB 2: SUBMISSION ================= */}
        <TabPanel value={tab} index={2}>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={<Switch checked={requireConfirmation} onChange={(e) => setRequireConfirmation(e.target.checked)} />}
                label="Show a confirmation dialog before submitting"
              />
              {requireConfirmation && (
                <TextField
                  fullWidth
                  size="small"
                  label="Confirmation message"
                  value={confirmationMessage}
                  onChange={(e) => setConfirmationMessage(e.target.value)}
                  sx={{ mt: 1.5, maxWidth: 500 }}
                />
              )}
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={<Switch checked={allowSubmitterEdit} onChange={(e) => setAllowSubmitterEdit(e.target.checked)} />}
                label="Let the submitter edit their response later via a private link"
              />
              {allowSubmitterEdit && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Edit window (hours)"
                      helperText="0 = never expires"
                      value={editWindowHours}
                      onChange={(e) => setEditWindowHours(Math.max(0, Number(e.target.value) || 0))}
                    />
                  </Grid>
                </Grid>
              )}
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={<Switch checked={autoResponderEnabled} onChange={(e) => setAutoResponderEnabled(e.target.checked)} />}
                label="Send the submitter a confirmation email"
              />
              {autoResponderEnabled && (
                <Grid container spacing={2} sx={{ mt: 0.5, maxWidth: 600 }}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Email subject"
                      value={autoResponderSubject}
                      onChange={(e) => setAutoResponderSubject(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      label="Message"
                      helperText="Use {{formTitle}} and {{name}} as placeholders"
                      value={autoResponderMessage}
                      onChange={(e) => setAutoResponderMessage(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }}>
                      Only sends if the submission includes an email field.
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* ================= TAB 3: NOTIFICATIONS ================= */}
        <TabPanel value={tab} index={3}>
          <Box>
            <FormControlLabel
              control={<Switch checked={webhookEnabled} onChange={(e) => setWebhookEnabled(e.target.checked)} />}
              label="Send a webhook on every new submission"
            />
            {webhookEnabled && (
              <Grid container spacing={2} sx={{ mt: 0.5, maxWidth: 600 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Webhook URL"
                    placeholder="https://hooks.slack.com/services/... or Discord webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }}>
                    Works directly with Slack and Discord incoming webhooks, or any custom endpoint that accepts a
                    JSON POST.
                  </Typography>
                </Grid>
              </Grid>
            )}
          </Box>
        </TabPanel>

        {/* ================= TAB 4: SPAM PROTECTION ================= */}
        <TabPanel value={tab} index={4}>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={<Switch checked={honeypotEnabled} onChange={(e) => setHoneypotEnabled(e.target.checked)} />}
                label="Enable honeypot spam trap"
              />
              <Typography sx={{ fontSize: 12, color: "#a1a1aa", mt: 0.5 }}>
                Adds an invisible field to the public form — real visitors never see or fill it, but bots often do.
                A filled honeypot silently discards the submission without an error, so bots don't learn it failed.
              </Typography>
            </Box>

            <Divider />

            <Box>
              <FormControlLabel
                control={<Switch checked={duplicateCheckEnabled} onChange={(e) => setDuplicateCheckEnabled(e.target.checked)} />}
                label="Block duplicate submissions"
              />
              {duplicateCheckEnabled && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Window (hours)"
                      value={duplicateWindowHours}
                      onChange={(e) => setDuplicateWindowHours(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography sx={{ fontSize: 11.5, color: "#a1a1aa" }}>
                      Blocks the same email/phone from submitting this form again within the window.
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Stack>
        </TabPanel>

        {/* ================= TAB 5: ROUTES ================= */}
        <TabPanel value={tab} index={5}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 0.5 }}>Public form route</Typography>
              <Typography
                sx={{ fontSize: 13, fontFamily: "monospace", bgcolor: "#f4f4f5", border: "1px solid #e4e4e7", borderRadius: 1.5, p: 1.2, color: "#3f3f46" }}
              >
                /forms/{previewFormSlug}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#a1a1aa", mt: 0.5 }}>Set on the Basics tab via "Public Slug".</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                label="Admin Table Route"
                placeholder="Leave empty to auto-match public slug"
                helperText={`Will be available at /admin/tables/${previewTableSlug}`}
                value={adminTableSlug}
                onChange={(e) => {
                  setAdminTableSlug(e.target.value);
                  setTableSlugTouched(true);
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* ================= TAB 6: ACCESS ================= */}
        <TabPanel value={tab} index={6}>
          <Box mb={3}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Who can view the public form?</Typography>
            <Typography sx={{ fontSize: 12, color: "#a1a1aa", mb: 1 }}>Leave all unchecked to keep it open to everyone.</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {ROLE_OPTIONS.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  clickable
                  onClick={() => toggleRole(viewRoles, setViewRoles, role)}
                  sx={{ fontWeight: 600, bgcolor: viewRoles.includes(role) ? "#18181b" : "#f4f4f5", color: viewRoles.includes(role) ? "#fff" : "#3f3f46" }}
                />
              ))}
            </Stack>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Who can view the admin entries table?</Typography>
            <Typography sx={{ fontSize: 12, color: tableViewRoles.length ? "#a1a1aa" : "#dc2626", mb: 1 }}>
              {tableViewRoles.length
                ? "At least one role should be selected — this always requires login."
                : "Select at least one role, or the entries table will require login but allow no one in."}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {ROLE_OPTIONS.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  clickable
                  onClick={() => toggleRole(tableViewRoles, setTableViewRoles, role)}
                  sx={{
                    fontWeight: 600,
                    bgcolor: tableViewRoles.includes(role) ? "#18181b" : "#f4f4f5",
                    color: tableViewRoles.includes(role) ? "#fff" : "#3f3f46",
                  }}
                />
              ))}
            </Stack>
          </Box>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        <Button
          sx={{ px: 5, py: 1.4, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
          disableElevation
          disabled={mutation.isPending}
          onClick={handleSubmit}
        >
          {mutation.isPending ? "Saving..." : editData ? "Update Form" : "Save Form"}
        </Button>
      </CardContent>
    </Card>
  );
}