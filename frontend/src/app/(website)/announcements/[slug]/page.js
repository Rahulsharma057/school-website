import { notFound } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PushPinIcon from "@mui/icons-material/PushPin";
import Link from "next/link";
const API = process.env.NEXT_PUBLIC_API_URL;
const TYPE_STYLES = {
  general: {
    bg: "#f4f4f5",
    color: "#3f3f46",
    accent: "#71717a",
    label: "General",
  },
  notice: {
    bg: "#dbeafe",
    color: "#1d4ed8",
    accent: "#2563eb",
    label: "Notice",
  },
  event: { bg: "#dcfce7", color: "#15803d", accent: "#16a34a", label: "Event" },
  urgent: {
    bg: "#fee2e2",
    color: "#b91c1c",
    accent: "#dc2626",
    label: "Urgent",
  },
};
async function getAnnouncement(slug) {
  try {
    const res = await fetch(`${API}/announcements/public/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.error("Get Announcement Error:", error);
    return null;
  }
}
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) {
    return { title: "Announcement Not Found" };
  }
  return {
    title: announcement.title,
    description:
      announcement.tickerText ||
      announcement.shortDescription ||
      announcement.title,
  };
}
export default async function PublicAnnouncementPage({ params }) {
  const { slug } = await params;
  const announcement = await getAnnouncement(slug);
  if (!announcement) {
    notFound();
  }
  const style = TYPE_STYLES[announcement.type] || TYPE_STYLES.general;
  const formattedDate = announcement.startDate
    ? new Date(announcement.startDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)",
        py: { xs: 4, sm: 6, md: 8 },
      }}
    >
      {" "}
      <Container maxWidth="md">
        {" "}
        {/* ================= BACK ================= */}{" "}
        <Box sx={{ mb: 2.5 }}>
       <Link href="/" style={{ textDecoration: "none" }}>
  <Button
    startIcon={<ArrowBackIcon />}
    sx={{
      textTransform: "none",
      color: "#71717a",
      fontSize: 13,
      fontWeight: 600,
      px: 0,
      "&:hover": {
        backgroundColor: "transparent",
        color: "#18181b",
      },
    }}
  >
    Back to Home
  </Button>
</Link>
        </Box>{" "}
        {/* ================= MAIN CARD ================= */}{" "}
        <Paper
          elevation={0}
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: { xs: 2.5, sm: 3 },
            border: "1px solid #e4e4e7",
            backgroundColor: "#fff",
            boxShadow: "0 10px 35px rgba(24,24,27,0.06)",
          }}
        >
          {" "}
          {/* TOP ACCENT */}{" "}
          <Box
            sx={{ height: 5, width: "100%", backgroundColor: style.accent }}
          />{" "}
          <Box sx={{ p: { xs: 2.5, sm: 4, md: 5 } }}>
            {" "}
            {/* ================= META ================= */}{" "}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              mb={2.5}
            >
              {" "}
              <Stack direction="row" alignItems="center" spacing={1}>
                {" "}
                <Chip
                  label={style.label}
                  size="small"
                  sx={{
                    height: 28,
                    px: 0.5,
                    fontWeight: 700,
                    fontSize: 11.5,
                    backgroundColor: style.bg,
                    color: style.color,
                    border: `1px solid ${style.accent}22`,
                  }}
                />{" "}
                {announcement.pinned && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.4}
                    sx={{ color: "#a16207" }}
                  >
                    {" "}
                    <PushPinIcon
                      sx={{ fontSize: 15, transform: "rotate(45deg)" }}
                    />{" "}
                    <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
                      {" "}
                      Pinned{" "}
                    </Typography>{" "}
                  </Stack>
                )}{" "}
              </Stack>{" "}
              {formattedDate && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.6}
                  sx={{ color: "#71717a" }}
                >
                  {" "}
                  <CalendarMonthIcon sx={{ fontSize: 16 }} />{" "}
                  <Typography sx={{ fontSize: 12.5, fontWeight: 500 }}>
                    {" "}
                    {formattedDate}{" "}
                  </Typography>{" "}
                </Stack>
              )}{" "}
            </Stack>{" "}
            {/* ================= TITLE ================= */}{" "}
            <Typography
              component="h1"
              sx={{
                color: "#18181b",
                fontSize: { xs: 24, sm: 30, md: 34 },
                lineHeight: 1.2,
                fontWeight: 750,
                letterSpacing: "-0.4px",
                mb: 2,
              }}
            >
              {" "}
              {announcement.title}{" "}
            </Typography>{" "}
            {/* ================= SHORT DESCRIPTION ================= */}{" "}
            {announcement.tickerText && (
              <Typography
                sx={{
                  color: "#52525b",
                  fontSize: { xs: 14, sm: 15 },
                  lineHeight: 1.65,
                  mb: 2.5,
                }}
              >
                {" "}
                {announcement.tickerText}{" "}
              </Typography>
            )}{" "}
            <Divider sx={{ mb: 3.5, borderColor: "#f1f1f3" }} />{" "}
            {/* ================= CONTENT ================= */}{" "}
            <Box
              sx={{
                color: "#3f3f46",
                fontSize: { xs: 14, sm: 15 },
                lineHeight: 1.8,
                "& p": { marginTop: 0, marginBottom: 2 },
                "& strong": { color: "#18181b", fontWeight: 700 },
                "& a": { color: style.accent },
              }}
            >
              {" "}
              {announcement.content ? (
                <Typography
                  component="div"
                  sx={{
                    whiteSpace: "pre-line",
                    color: "#3f3f46",
                    lineHeight: 1.8,
                    fontSize: { xs: 14, sm: 15 },
                  }}
                >
                  {" "}
                  {announcement.content}{" "}
                </Typography>
              ) : (
                <Typography
                  sx={{
                    color: "#52525b",
                    lineHeight: 1.8,
                    fontSize: { xs: 14, sm: 15 },
                  }}
                >
                  {" "}
                  {announcement.tickerText ||
                    "No additional information is available."}{" "}
                </Typography>
              )}{" "}
            </Box>{" "}
            {/* ================= ACTIONS ================= */}{" "}
            {(announcement.link?.type === "external" ||
              announcement.link?.type === "internal" ||
              announcement.attachment?.url) && (
              <>
                {" "}
                <Divider sx={{ my: 3.5, borderColor: "#f1f1f3" }} />{" "}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  flexWrap="wrap"
                >
                  {" "}
                  {/* EXTERNAL LINK */}{" "}
                  {announcement.link?.type === "external" &&
                    announcement.link?.url && (
                   <Link
  href={announcement.link.url}
  style={{
    textDecoration: "none",
    display: "inline-block",
  }}
>
  <Button
    variant="contained"
    disableElevation
    endIcon={<ArrowBackIcon />}
    sx={{
      minHeight: 42,
      px: 2,
      borderRadius: 1.5,
      backgroundColor: "#18181b",
      color: "#fff",
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13,

      "&:hover": {
        backgroundColor: "#27272a",
      },

      "& .MuiButton-endIcon": {
        transform: "rotate(180deg)",
      },
    }}
  >
    Learn More
  </Button>
</Link>
                    )}{" "}
                  {/* INTERNAL LINK */}{" "}
                  {announcement.link?.type === "internal" &&
                    announcement.link?.url && (
               <Link
  href={announcement.link.url}
  style={{
    textDecoration: "none",
    display: "inline-block",
  }}
>
  <Button
    variant="contained"
    disableElevation
    endIcon={<ArrowBackIcon />}
    sx={{
      minHeight: 42,
      px: 2,
      borderRadius: 1.5,
      backgroundColor: "#18181b",
      color: "#fff",
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13,

      "&:hover": {
        backgroundColor: "#27272a",
      },

      "& .MuiButton-endIcon": {
        transform: "rotate(180deg)",
      },
    }}
  >
    Learn More
  </Button>
</Link>
                    )}{" "}
                  {/* ATTACHMENT */}{" "}
                  {announcement.attachment?.url && (
                    <Button
                      href={announcement.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      startIcon={<DownloadIcon />}
                      variant="outlined"
                      sx={{
                        minHeight: 42,
                        px: 2,
                        borderRadius: 1.5,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#3f3f46",
                        borderColor: "#d4d4d8",
                        "&:hover": {
                          borderColor: "#a1a1aa",
                          backgroundColor: "#fafafa",
                        },
                      }}
                    >
                      {" "}
                      Download Attachment{" "}
                    </Button>
                  )}{" "}
                </Stack>{" "}
              </>
            )}{" "}
          </Box>{" "}
        </Paper>{" "}
        {/* ================= FOOTER ================= */}{" "}
        <Typography
          sx={{
            textAlign: "center",
            color: "#a1a1aa",
            fontSize: 11.5,
            mt: 2.5,
          }}
        >
          {" "}
          Please check the school website regularly for the latest announcements
          and updates.{" "}
        </Typography>{" "}
      </Container>{" "}
    </Box>
  );
}
