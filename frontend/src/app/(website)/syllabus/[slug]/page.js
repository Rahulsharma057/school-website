import { notFound } from "next/navigation";

import { Box, Button, Container, Divider, Paper, Stack, Typography } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getSyllabus(slug) {
  try {
    const res = await fetch(`${API}/syllabus/public/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const response = await res.json();
    return response?.data || null;
  } catch (error) {
    console.log("Get Syllabus Error:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const syllabus = await getSyllabus(slug);
  if (!syllabus) return {};
  return { title: `${syllabus.title} — ${syllabus.className}`, description: syllabus.description || "" };
}

export default async function PublicSyllabusPage({ params }) {
  const { slug } = await params;
  const syllabus = await getSyllabus(slug);

  if (!syllabus) notFound();

  const sortedSubjects = [...(syllabus.subjects || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Box>
              <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b", fontSize: { xs: 24, md: 30 } }}>
                {syllabus.title}
              </Typography>
              <Typography sx={{ color: "#71717a", mt: 0.5 }}>
                {syllabus.schoolName} · {syllabus.className}
                {syllabus.academicYear ? ` · ${syllabus.academicYear}` : ""}
              </Typography>
            </Box>

            {syllabus.pdf?.url && (
              <Button
                href={syllabus.pdf.url}
                target="_blank"
                rel="noreferrer"
                download
                startIcon={<DownloadIcon />}
                disableElevation
                sx={{ bgcolor: "#18181b", color: "#fff", textTransform: "none", fontWeight: 600, px: 3, "&:hover": { bgcolor: "#27272a" } }}
              >
                Download PDF
              </Button>
            )}
          </Stack>

          {syllabus.description && <Typography sx={{ color: "#3f3f46", mb: 3 }}>{syllabus.description}</Typography>}

          <Divider sx={{ my: 3 }} />

          <Stack spacing={4}>
            {sortedSubjects.map((subject, index) => (
              <Box key={subject.id}>
                <Typography variant="h6" fontWeight={700} sx={{ color: "#18181b", mb: 1.5 }}>
                  {index + 1}. {subject.name}
                </Typography>
                <Stack spacing={1.5} pl={2}>
                  {(subject.topics || []).map((topic) => (
                    <Box key={topic.id}>
                      <Typography sx={{ fontWeight: 600, color: "#18181b" }}>• {topic.title}</Typography>
                      {topic.description && (
                        <Typography sx={{ fontSize: 13.5, color: "#71717a", pl: 2 }}>{topic.description}</Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}