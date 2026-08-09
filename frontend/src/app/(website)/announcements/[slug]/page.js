import { notFound } from "next/navigation";

import { Box, Button, Chip, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

const TYPE_STYLES = {
  general: { bg: "#f4f4f5", color: "#3f3f46", label: "General" },
  notice: { bg: "#dbeafe", color: "#1d4ed8", label: "Notice" },
  event: { bg: "#dcfce7", color: "#15803d", label: "Event" },
  urgent: { bg: "#fee2e2", color: "#b91c1c", label: "Urgent" },
};

async function getAnnouncement(slug) {
  try {
    const res = await fetch(`${API}/announcements/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Announcement Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) return {};
  return { title: announcement.title, description: announcement.tickerText };
}

export default async function PublicAnnouncementPage({ params }) {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);

  if (!announcement) notFound();

  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.general;

  const formattedDate = new Date(announcement.startDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="sm" sx={{ py: { xs: 5, md: 8 } }}>
      <Link href="/" style={{ textDecoration: "none" }}>
  <Button
    startIcon={<ArrowBackIcon />}
    sx={{
      textTransform: "none",
      color: "#71717a",
      mb: 2,
    }}
  >
    Back to Home
  </Button>
</Link>

        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <Chip label={style.label} size="small" sx={{ fontWeight: 600, bgcolor: style.bg, color: style.color }} />
            <Typography sx={{ fontSize: 13, color: "#a1a1aa" }}>{formattedDate}</Typography>
          </Stack>

          <Typography variant="h4" fontWeight={700} mb={2} sx={{ color: "#18181b", fontSize: { xs: 22, md: 28 } }}>
            {announcement.title}
          </Typography>

          <Divider sx={{ mb: 3 }} />

          {announcement.content ? (
            <Typography sx={{ color: "#3f3f46", whiteSpace: "pre-line", lineHeight: 1.7 }}>
              {announcement.content}
            </Typography>
          ) : (
            <Typography sx={{ color: "#3f3f46" }}>{announcement.tickerText}</Typography>
          )}

          {announcement.link?.type === "external" && announcement.link.url && (
            <Button
              href={announcement.link.url}
              target="_blank"
              rel="noreferrer"
              disableElevation
              sx={{ mt: 3, bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, "&:hover": { bgcolor: "#27272a" } }}
            >
              Open Link
            </Button>
          )}

          {announcement.link?.type === "internal" && announcement.link.url && (
         <Link
  href={announcement.link.url}
  style={{ textDecoration: "none" }}
>
  <Button
    disableElevation
    sx={{
      mt: 3,
      bgcolor: "#18181b",
      color: "#fff",
      textTransform: "none",
      fontWeight: 600,
      "&:hover": {
        bgcolor: "#27272a",
      },
    }}
  >
    Learn More
  </Button>
</Link>
          )}

          {announcement.attachment?.url && (
            <Button
              href={announcement.attachment.url}
              target="_blank"
              rel="noreferrer"
              download
              startIcon={<DownloadIcon />}
              variant="outlined"
              sx={{ mt: 3, ml: announcement.link?.type !== "none" ? 1.5 : 0, textTransform: "none", fontWeight: 600, color: "#3f3f46", borderColor: "#e4e4e7" }}
            >
              Download Attachment
            </Button>
          )}
        </Paper>
      </Container>
    </Box>
  );
}