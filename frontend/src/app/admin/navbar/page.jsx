"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import ImageIcon from "@mui/icons-material/Image";
import StarIcon from "@mui/icons-material/Star";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import TocIcon from "@mui/icons-material/Toc";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import ListAltIcon from "@mui/icons-material/ListAlt";

import useNavbar from "@/hooks/navbar/useNavbar";
import useCreateNavbar from "@/hooks/navbar/useCreateNavbar";

import NavbarForm from "@/components/admin/navbar/NavbarForm";
import NavbarDesignForm from "@/components/admin/navbar/NavbarDesignForm";
import MenuStyleForm from "@/components/admin/navbar/MenuStyleForm";
import ButtonStyleForm from "@/components/admin/navbar/ButtonStyleForm";
import SubmenuStyleForm from "@/components/admin/navbar/SubmenuStyleForm";
import MegaMenuStyleForm from "@/components/admin/navbar/MegaMenuStyleForm";
import MobileMenuStyleForm from "@/components/admin/navbar/MobileMenuStyleForm";
import LogoUploader from "@/components/admin/navbar/LogoUploader";
import FaviconUploader from "@/components/admin/navbar/FaviconUploader";
import TopBarForm from "@/components/admin/navbar/TopBarForm";
import MenuBuilder from "@/components/admin/navbar/MenuBuilder";
import DesktopPreview from "@/components/admin/navbar/DesktopPreview";
import MobilePreview from "@/components/admin/navbar/MobilePreview";

// ============= BEST-SUIT DEFAULT DESIGN VALUES =============
// Sirf style/design fields reset hote hain — schoolName, menu items,
// logo, favicon kabhi touch nahi hote.
const DEFAULT_DESIGN = {
  navbarBackground: "#ffffff",
  navbarTextColor: "#1a1a1a",
  navbarHeight: 80,
  navbarFontSize: 20,
  navbarFontWeight: 700,
  navbarHoverColor: "#1976d2",
  navbarShadow: true,
  borderBottomColor: "#e5e5e5",

  menuFontSize: 15,
  menuFontWeight: 600,
  menuTextTransform: "none",
  activeMenuColor: "#1976d2",
  showShadow: true,

  submenuBackground: "#ffffff",
  submenuTextColor: "#222222",
  submenuHoverBackground: "#f5f7fa",
  submenuHoverTextColor: "#1976d2",
  submenuBorderRadius: 10,

  megaMenuBackground: "#ffffff",
  megaMenuHeadingColor: "#1976d2",
  megaMenuTextColor: "#333333",

  mobileMenuBackground: "#ffffff",
  mobileMenuBgColor: "#ffffff",
  mobileMenuTextColor: "#222222",
  mobileMenuActiveColor: "#1976d2",

  topBarBackground: "#0d47a1",
  topBarTextColor: "#ffffff",
  topBarFontSize: 13,

  loginButtonBackground: "#ffffff",
  loginButtonTextColor: "#1976d2",
  loginButtonBorderColor: "#1976d2",
  loginButtonHoverColor: "#1976d2",
  loginButtonFontSize: 14,
  loginButtonBorderRadius: 8,

  admissionButtonBackground: "#1976d2",
  admissionButtonTextColor: "#ffffff",
  admissionButtonHoverColor: "#125aa0",
  admissionButtonFontSize: 14,
  admissionButtonBorderRadius: 8,

  logoWidth: 48,
  logoHeight: 48,
};

export default function NavbarPage() {
  const { data: navbarResponse, isLoading } = useNavbar();
  const { mutate, isPending: isResetting } = useCreateNavbar();

  const [preview, setPreview] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const [expanded, setExpanded] = useState("general");

  const navbar = navbarResponse?.data || navbarResponse;

  const handleAccordion = (panel) => (e, isOpen) => {
    setExpanded(isOpen ? panel : false);
  };

  const handleResetConfirm = () => {
    const formData = new FormData();

    Object.entries(DEFAULT_DESIGN).forEach(([key, value]) => {
      formData.append(key, value);
    });

    mutate(formData, {
      onSuccess: () => setResetOpen(false),
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ height: "70vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const sections = [
    { key: "general", icon: <SettingsIcon fontSize="small" />, title: "General Settings", component: <NavbarForm navbar={navbar} /> },
    { key: "logo", icon: <ImageIcon fontSize="small" />, title: "Logo", component: <LogoUploader navbar={navbar} /> },
    { key: "favicon", icon: <StarIcon fontSize="small" />, title: "Favicon", component: <FaviconUploader navbar={navbar} /> },
    { key: "navbarDesign", icon: <DesignServicesIcon fontSize="small" />, title: "Navbar Container Design", component: <NavbarDesignForm navbar={navbar} /> },
    { key: "topBar", icon: <TocIcon fontSize="small" />, title: "Top Bar Settings", component: <TopBarForm navbar={navbar} /> },
    { key: "menuStyle", icon: <MenuOpenIcon fontSize="small" />, title: "Menu Style", component: <MenuStyleForm navbar={navbar} /> },
    { key: "submenu", icon: <ListAltIcon fontSize="small" />, title: "Submenu Style", component: <SubmenuStyleForm navbar={navbar} /> },
    { key: "megaMenu", icon: <ViewModuleIcon fontSize="small" />, title: "Mega Menu Style", component: <MegaMenuStyleForm navbar={navbar} /> },
    { key: "mobileMenu", icon: <PhoneIphoneIcon fontSize="small" />, title: "Mobile Menu Style", component: <MobileMenuStyleForm navbar={navbar} /> },
    { key: "buttons", icon: <TouchAppIcon fontSize="small" />, title: "Button Style", component: <ButtonStyleForm navbar={navbar} /> },
    { key: "menuBuilder", icon: <TocIcon fontSize="small" />, title: "Menu Builder", component: <MenuBuilder navbar={navbar} /> },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "#f7f8fa", minHeight: "100vh" }}>
      {/* ================= HEADER ================= */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 4,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Navbar Management
          </Typography>
          <Typography color="text.secondary">
            Manage school header, navigation, logo, favicon and preview.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<RestartAltIcon />}
          onClick={() => setResetOpen(true)}
          sx={{ whiteSpace: "nowrap" }}
        >
          Reset to Best Design
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* ================= LEFT: ACCORDION SECTIONS ================= */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, overflow: "hidden" }}>
            {sections.map((s, idx) => (
              <Accordion
                key={s.key}
                expanded={expanded === s.key}
                onChange={handleAccordion(s.key)}
                disableGutters
                elevation={0}
                sx={{
                  "&:before": { display: "none" },
                  borderBottom: idx !== sections.length - 1 ? "1px solid #eee" : "none",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: 3,
                    py: 0.5,
                    "&:hover": { bgcolor: "#fafbfc" },
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "#eef3fc",
                        color: "#1976d2",
                      }}
                    >
                      {s.icon}
                    </Box>
                    <Typography fontWeight={600}>{s.title}</Typography>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
                  {s.component}
                </AccordionDetails>
              </Accordion>
            ))}
          </Card>
        </Grid>

        {/* ================= RIGHT: LIVE PREVIEW ================= */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: "sticky", top: 90, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600}>
                Live Preview
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Tabs
                value={preview}
                onChange={(e, v) => setPreview(v)}
                variant="fullWidth"
                sx={{
                  minHeight: 36,
                  mb: 2,
                  "& .MuiTab-root": { minHeight: 36 },
                }}
              >
                <Tab label="Desktop" />
                <Tab label="Mobile" />
              </Tabs>

              <Box>
                {preview === 0 ? (
                  <DesktopPreview navbar={navbar} />
                ) : (
                  <MobilePreview navbar={navbar} />
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ================= RESET CONFIRMATION DIALOG ================= */}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Navbar Design?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ye sabhi colors, fonts, spacing aur shadow settings ko ek clean
            professional default design pe reset kar dega. Aapka School Name,
            Logo, Favicon aur Menu Items safe rahenge, sirf styling reset hogi.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetOpen(false)} disabled={isResetting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleResetConfirm}
            disabled={isResetting}
          >
            {isResetting ? "Resetting..." : "Yes, Reset"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}