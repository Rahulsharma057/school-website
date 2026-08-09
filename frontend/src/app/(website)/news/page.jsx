import { Box, Container } from "@mui/material";
import NewsGrid from "@/components/website/news/NewsGrid";

export const metadata = {
  title: "News & Announcements",
  description: "Latest news, announcements, and updates.",
};

// This is the "full listing" page — paginated (Load More) and each card's
// View button navigates to its own /news/[slug] page (detailMode="link")
// rather than opening the quick-preview dialog, so articles get a real,
// shareable URL from here.
export default function NewsListingPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ mb: 4 }}>
        <Box component="h1" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 800, color: "#18181b", m: 0 }}>
          News & Announcements
        </Box>
      </Box>

      <NewsGrid title="" limit={9} columns={3} paginated detailMode="link" />
    </Container>
  );
}
