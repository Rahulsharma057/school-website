"use client";

import { useState } from "react";

import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";

import { toast } from "react-toastify";

import { lookupEntryForEdit } from "@/services/formEntryService";
import FormEditRenderer from "./FormEditRenderer";

/**
 * The ONE stable, admin-shareable link per form — /forms/portal/[slug].
 * Never tied to a specific submission. Flow:
 *   1. Visitor enters the email/phone they used to submit
 *   2. Backend finds their entry (gated by form.submission.allowSubmitterEdit)
 *   3. On match, the same page switches into edit mode for that entry
 *
 * Admin controls the on/off switch from the FormBuilder's Submission tab
 * ("Let the submitter edit their response later") — when off, this page
 * always shows the closed state, regardless of what's in the database.
 */
export default function EditPortal({ formTitle, formSlug }) {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("lookup"); // lookup | closed | notFound | edit
  const [result, setResult] = useState(null); // { entry, form }

  const handleLookup = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error("Enter your email or phone number");
      return;
    }

    setLoading(true);

    try {
      const res = await lookupEntryForEdit(formSlug, identifier.trim());
      setResult(res.data?.data);
      setStatus("edit");
    } catch (err) {
      const code = err?.response?.status;
      if (code === 403) {
        setStatus("closed");
      } else if (code === 404) {
        setStatus("notFound");
      } else {
        toast.error(err?.response?.data?.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === "edit" && result) {
    return (
      <FormEditRenderer
        form={result.form}
        entry={result.entry}
        token={result.entry.editToken}
        onSavedAgain={() => setStatus("edit")}
      />
    );
  }

  const primaryColor = "#18181b";

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
          {status === "closed" ? (
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: "#f4f4f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2.5,
                }}
              >
                <LockOutlinedIcon sx={{ fontSize: 28, color: "#71717a" }} />
              </Box>
              <Typography variant="h5" fontWeight={700} mb={1} sx={{ color: "#18181b" }}>
                Editing Closed
              </Typography>
              <Typography sx={{ color: "#71717a" }}>
                Editing is currently closed for "{formTitle}". Please contact the school office if you need to make
                a change.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="h5" fontWeight={800} mb={0.5} sx={{ color: "#18181b" }}>
                Edit Your Submission
              </Typography>
              <Typography sx={{ color: "#71717a", mb: 3, fontSize: 14 }}>
                Enter the email or phone number you used when submitting "{formTitle}".
              </Typography>

              <Box component="form" onSubmit={handleLookup}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email or phone number"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoFocus
                  />

                  {status === "notFound" && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#dc2626" }}>
                      <SearchOffIcon sx={{ fontSize: 18 }} />
                      <Typography sx={{ fontSize: 13 }}>
                        No submission found matching that email or phone. Double-check and try again.
                      </Typography>
                    </Stack>
                  )}

                  <Button
                    type="submit"
                    size="large"
                    disableElevation
                    disabled={loading}
                    sx={{
                      bgcolor: primaryColor,
                      color: "#fff",
                      py: 1.3,
                      borderRadius: "10px",
                      fontWeight: 700,
                      textTransform: "none",
                      "&:hover": { filter: "brightness(0.9)", bgcolor: primaryColor },
                    }}
                  >
                    {loading ? "Searching..." : "Find My Submission"}
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}