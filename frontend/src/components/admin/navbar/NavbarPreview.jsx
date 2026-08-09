"use client";

import { useState } from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";

export default function NavbarPreview({ navbar }) {
  const [openMenu, setOpenMenu] = useState(null);

  if (!navbar) return null;

  return (
    <Box>
      {/* ================= TOP BAR ================= */}
      {navbar.showTopBar && (
        <Box
          sx={{
            bgcolor: navbar.topBarBackground || "#1976d2",
            color: navbar.topBarTextColor || "#ffffff",
            fontSize: navbar.topBarFontSize || 13,
            px: 3,
            py: 0.7,
            display: "flex",
            gap: 3,
          }}
        >
          {navbar.topBarPhone && <Typography fontSize="inherit">☎ {navbar.topBarPhone}</Typography>}
          {navbar.topBarEmail && <Typography fontSize="inherit">📧 {navbar.topBarEmail}</Typography>}
          {navbar.topBarAddress && <Typography fontSize="inherit">📍 {navbar.topBarAddress}</Typography>}
        </Box>
      )}

      {/* ================= NAVBAR ================= */}
      <Box
        sx={{
          bgcolor: navbar.transparent ? "transparent" : navbar.navbarBackground || navbar.primaryColor,
          color: navbar.navbarTextColor || "#000",
          height: navbar.navbarHeight || 80,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${navbar.borderBottomColor || "transparent"}`,
          boxShadow: navbar.navbarShadow ? "0 2px 8px rgba(0,0,0,.12)" : "none",
          position: "relative",
        }}
      >
        {/* Logo + School Name */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {navbar.logo?.url && (
            <Avatar
              src={navbar.logo.url}
              variant="rounded"
              sx={{ width: navbar.logoWidth || 60, height: navbar.logoHeight || 60 }}
            />
          )}
          <Typography
            fontWeight={navbar.navbarFontWeight || 700}
            fontSize={navbar.navbarFontSize || 20}
          >
            {navbar.schoolName}
          </Typography>
        </Box>

        {/* Menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {navbar.menu
            ?.filter((item) => item.visible)
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <Box
                key={index}
                sx={{ position: "relative" }}
                onMouseEnter={() => setOpenMenu(index)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <Typography
                  sx={{
                    fontSize: navbar.menuFontSize || 15,
                    fontWeight: navbar.menuFontWeight || 500,
                    textTransform: navbar.menuTextTransform || "none",
                    cursor: "pointer",
                    color:
                      openMenu === index
                        ? navbar.activeMenuColor || "#1976d2"
                        : "inherit",
                    "&:hover": {
                      color: navbar.navbarHoverColor || "#1976d2",
                    },
                  }}
                >
                  {item.title}
                </Typography>

                {/* ===== MEGA MENU PANEL ===== */}
                {item.isMegaMenu && openMenu === index && item.children?.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      minWidth: 420,
                      bgcolor: navbar.megaMenuBackground || "#ffffff",
                      boxShadow: "0 8px 20px rgba(0,0,0,.15)",
                      borderRadius: `${navbar.submenuBorderRadius || 8}px`,
                      p: 3,
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                      zIndex: 10,
                    }}
                  >
                    <Typography
                      sx={{
                        gridColumn: "1 / -1",
                        fontWeight: 700,
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
                            color: navbar.megaMenuTextColor || "#222",
                            fontSize: 14,
                            cursor: "pointer",
                            "&:hover": {
                              color: navbar.submenuHoverTextColor || "#1976d2",
                            },
                          }}
                        >
                          {child.title}
                        </Typography>
                      ))}
                  </Box>
                )}

                {/* ===== NORMAL SUBMENU DROPDOWN ===== */}
                {!item.isMegaMenu && openMenu === index && item.children?.length > 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      minWidth: 200,
                      bgcolor: navbar.submenuBackground || "#ffffff",
                      boxShadow: "0 8px 20px rgba(0,0,0,.15)",
                      borderRadius: `${navbar.submenuBorderRadius || 8}px`,
                      overflow: "hidden",
                      zIndex: 10,
                    }}
                  >
                    {item.children
                      .filter((child) => child.visible)
                      .sort((a, b) => a.order - b.order)
                      .map((child, i) => (
                        <Typography
                          key={i}
                          sx={{
                            px: 2,
                            py: 1.2,
                            fontSize: 14,
                            color: navbar.submenuTextColor || "#222",
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: navbar.submenuHoverBackground || "#f5f5f5",
                              color: navbar.submenuHoverTextColor || "#1976d2",
                            },
                          }}
                        >
                          {child.title}
                        </Typography>
                      ))}
                  </Box>
                )}
              </Box>
            ))}

          {/* Buttons */}
          {navbar.showLoginButton && (
            <Button
              variant="outlined"
              href={navbar.loginButtonLink}
              sx={{
                bgcolor: navbar.loginButtonBackground || "transparent",
                color: navbar.loginButtonTextColor || "#1976d2",
                borderColor: navbar.loginButtonBorderColor || "#1976d2",
                fontSize: navbar.loginButtonFontSize || 14,
                borderRadius: `${navbar.loginButtonBorderRadius || 4}px`,
                "&:hover": {
                  bgcolor: navbar.loginButtonHoverColor || "#1565c0",
                  color: "#fff",
                },
              }}
            >
              {navbar.loginButtonText}
            </Button>
          )}

          {navbar.showAdmissionButton && (
            <Button
              variant="contained"
              href={navbar.admissionButtonLink}
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
      </Box>
    </Box>
  );
}