"use client";

import { useState } from "react";
import { Box, Typography, Avatar, Button, Divider } from "@mui/material";

export default function MobilePreview({ navbar }) {
  const [openMenu, setOpenMenu] = useState(null);

  if (!navbar) return null;

  return (
    <Box
      sx={{
        width: 340,
        mx: "auto",
        border: "1px solid #ddd",
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: navbar.mobileMenuBackground || "#fff",
        boxShadow: navbar.showShadow ? "0 4px 12px rgba(0,0,0,.15)" : "none",
      }}
    >
      {/* ================= TOP BAR ================= */}
      {navbar.showTopBar && (
        <Box
          sx={{
            bgcolor: navbar.topBarBackground || "#0d47a1",
            color: navbar.topBarTextColor || "#fff",
            px: 2,
            py: 1,
            fontSize: navbar.topBarFontSize || 12,
          }}
        >
          {navbar.topBarPhone && <Typography fontSize="inherit">☎ {navbar.topBarPhone}</Typography>}
          {navbar.topBarEmail && <Typography fontSize="inherit">📧 {navbar.topBarEmail}</Typography>}
          {navbar.topBarAddress && <Typography fontSize="inherit">📍 {navbar.topBarAddress}</Typography>}
        </Box>
      )}

      {/* ================= MOBILE NAVBAR ================= */}
      <Box
        sx={{
          bgcolor: navbar.transparent ? "transparent" : navbar.navbarBackground || navbar.primaryColor,
          color: navbar.navbarTextColor || "#fff",
          height: navbar.navbarHeight || 70,
          px: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${navbar.borderBottomColor || "transparent"}`,
          boxShadow: navbar.navbarShadow ? "0 2px 6px rgba(0,0,0,.15)" : "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {navbar.logo?.url && (
            <Avatar
              src={navbar.logo.url}
              variant="rounded"
              sx={{ width: navbar.logoWidth || 42, height: navbar.logoHeight || 42 }}
            />
          )}
          <Typography fontWeight={navbar.navbarFontWeight || 700} fontSize={navbar.navbarFontSize || 16}>
            {navbar.shortName || navbar.schoolName}
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 28, cursor: "pointer" }}>☰</Typography>
      </Box>

      {/* ================= MENU LIST ================= */}
      <Box sx={{ bgcolor: navbar.mobileMenuBgColor || "#fff" }}>
        {navbar.menu
          ?.filter((item) => item.visible)
          .sort((a, b) => a.order - b.order)
          .map((item, index) => (
            <Box key={index}>
              <Typography
                onClick={() => setOpenMenu(openMenu === index ? null : index)}
                sx={{
                  px: 2,
                  py: 1.5,
                  fontSize: navbar.menuFontSize || 15,
                  fontWeight: navbar.menuFontWeight || 500,
                  textTransform: navbar.menuTextTransform || "none",
                  color:
                    openMenu === index
                      ? navbar.mobileMenuActiveColor || navbar.activeMenuColor || "#1976d2"
                      : navbar.mobileMenuTextColor || "#000",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  "&:hover": {
                    bgcolor: navbar.navbarHoverColor || "#f5f5f5",
                  },
                }}
              >
                {item.title}
                {item.children?.length > 0 && <span>{openMenu === index ? "▲" : "▼"}</span>}
              </Typography>

              {/* ===== MEGA MENU (mobile = accordion grid with heading) ===== */}
              {item.isMegaMenu && openMenu === index && item.children?.length > 0 && (
                <Box
                  sx={{
                    bgcolor: navbar.megaMenuBackground || "#fafafa",
                    p: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: 13,
                      color: navbar.megaMenuHeadingColor || "#1976d2",
                      mb: 1,
                    }}
                  >
                    {item.title}
                  </Typography>

                  {item.children
                    .filter((child) => child.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((child, i) => (
                      <Typography
                        key={i}
                        sx={{
                          py: 0.8,
                          fontSize: (navbar.menuFontSize || 15) - 1,
                          color: navbar.megaMenuTextColor || "#333",
                        }}
                      >
                        • {child.title}
                      </Typography>
                    ))}
                </Box>
              )}

              {/* ===== NORMAL SUBMENU ===== */}
              {!item.isMegaMenu &&
                openMenu === index &&
                item.children
                  ?.filter((child) => child.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((child, i) => (
                    <Typography
                      key={i}
                      sx={{
                        pl: 5,
                        py: 1,
                        fontSize: (navbar.menuFontSize || 15) - 1,
                        borderRadius: `${navbar.submenuBorderRadius || 0}px`,
                        color: navbar.submenuTextColor || "#555",
                        bgcolor: navbar.submenuBackground || "#fafafa",
                        "&:hover": {
                          bgcolor: navbar.submenuHoverBackground || "#1976d2",
                          color: navbar.submenuHoverTextColor || "#fff",
                        },
                      }}
                    >
                      • {child.title}
                    </Typography>
                  ))}

              <Divider />
            </Box>
          ))}
      </Box>

      {/* ================= BUTTONS ================= */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {navbar.showLoginButton && (
          <Button
            fullWidth
            variant="outlined"
            sx={{
              bgcolor: navbar.loginButtonBackground || "transparent",
              color: navbar.loginButtonTextColor || "#1976d2",
              borderColor: navbar.loginButtonBorderColor || "#1976d2",
              fontSize: navbar.loginButtonFontSize || 14,
              borderRadius: `${navbar.loginButtonBorderRadius || 4}px`,
            }}
          >
            {navbar.loginButtonText}
          </Button>
        )}

        {navbar.showAdmissionButton && (
          <Button
            fullWidth
            variant="contained"
            sx={{
              bgcolor: navbar.admissionButtonBackground || navbar.secondaryColor,
              color: navbar.admissionButtonTextColor || "#fff",
              fontSize: navbar.admissionButtonFontSize || 14,
              borderRadius: `${navbar.admissionButtonBorderRadius || 4}px`,
              "&:hover": {
                bgcolor: navbar.admissionButtonHoverColor || navbar.admissionButtonBackground,
              },
            }}
          >
            {navbar.admissionButtonText}
          </Button>
        )}
      </Box>

      {/* ================= FOOTER ================= */}
      <Box sx={{ p: 2, bgcolor: "#fafafa" }}>
        <Typography variant="caption" color="text.secondary">
          Mobile Navbar Preview
        </Typography>
      </Box>
    </Box>
  );
}