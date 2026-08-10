import HeroSlider from "@/components/ui/HeroSlider";
import GalleryGrid from "@/components/website/gallery/GalleryGrid";
import NewsGrid from "@/components/website/news/NewsGrid";
import NoticeBoard from "@/components/website/announcements/NoticeBoard";
import AnnouncementTicker from "@/components/website/announcements/AnnouncementTicker";
import Footer from "@/components/website/footer/Footer";
import QuoteWall from "@/components/website/quotes/QuoteWall";
import { Box, Container } from "@mui/material";

export default function HomePage() {
  return (
    <>
      <AnnouncementTicker placement="homepage-ticker" />
      <HeroSlider />
      {/* Testimonials */}
      <QuoteWall slug="directors-says" />
      <GalleryGrid slug="annual-day-2026" />
      <Container maxWidth="lg" sx={{ pt: 2 }}>
        <NoticeBoard
          placement="homepage-ticker"
          title="Latest Circulars"
          height={280}
          intervalMs={4000}
        />
      </Container>
      <NewsGrid slug="school-news" />

      {/*
         <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
          <Box sx={{ mb: 4 }}>
          <Box
            component="h1"
            sx={{
              fontSize: { xs: 26, md: 32 },
              fontWeight: 800,
              color: "#18181b",
              m: 0,
            }}
          >
            News & Announcements
          </Box>
        </Box>
 <NewsGrid title="" limit={3} columns={3} paginated detailMode="link" /> 
// Manual mode — still works exactly as before, PLUS new layout/button props:
<NewsGrid
  title="Latest News"
  limit={6}
  category="sports"
  layout={{ displayStyle: "slider", columns: 4, mobileColumns: 1 }}
  button={{ enabled: true, label: "All Sports News", url: "/news?category=sports" }}
/>

      </Container>
 */}

      {/* Quick Links */}

      {/* About School */}

      {/* Principal Message */}

      {/* Statistics */}

      {/* Facilities */}

      {/* Latest News */}

      {/* Upcoming Events */}

      {/* Gallery */}

      {/* Achievements */}

      {/* Admission */}

      {/* Contact */}

      <Footer />
    </>
  );
}
