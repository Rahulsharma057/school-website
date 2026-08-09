"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Divider,
  Skeleton,
  Container,
  Typography,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ExpandMore,
  ExpandLess,
  Email,
  Phone,
  LocationOn,
} from "@mui/icons-material";

import usePublicNavbar from "@/hooks/navbar/usePublicNavbar";
import { useAuth } from "@/context/AuthContext";
import filterMenuByRole from "@/utils/filterMenuByRole";
import isActiveMenu from "@/utils/isActiveMenu";
import NavMenuItem from "./MegaMenuPanel";
import { usePathname, useRouter } from "next/navigation";
export default function Navbar() {
  const { data, isLoading } = usePublicNavbar();
 
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMobileIndex, setOpenMobileIndex] = useState(null);
const router = useRouter();
const { user, logout } =  useAuth() || {};

const handleLogout = async () => {
  const success = await logout();

  if (success) {
    setMobileOpen(false);
    router.push("/login");
    router.refresh();
  }
};
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  if (isLoading) {
    return (
      <Box
        sx={{
          height: 80,
          display: "flex",
          alignItems: "center",
          px: { xs: 2, md: 4 },
          borderBottom: "1px solid #eee",
        }}
      >
        <Skeleton variant="rectangular" width={44} height={44} sx={{ borderRadius: 1, mr: 1.5 }} />
        <Skeleton variant="text" width={140} height={32} />
      </Box>
    );
  }

  if (!data) return null;

  const {
    logo,
    schoolName,
    shortName,
    primaryColor,
    secondaryColor,

    sticky,
    transparent,

    // top bar
    showTopBar,
    topBarEmail,
    topBarPhone,
    topBarAddress,
    topBarBackground,
    topBarTextColor,
    topBarFontSize,

    // navbar container design
    navbarBackground,
    navbarTextColor,
    navbarHeight,
    navbarFontSize,
    navbarFontWeight,
    navbarHoverColor,
    navbarShadow,
    borderBottomColor,

    // logo
    logoWidth,
    logoHeight,

    // menu style
    menuFontSize,
    menuFontWeight,
    menuTextTransform,
    activeMenuColor,

    // submenu style
    submenuBackground,
    submenuTextColor,
    submenuHoverBackground,
    submenuHoverTextColor,
    submenuBorderRadius,

    // mega menu style
    megaMenuBackground,
    megaMenuHeadingColor,
    megaMenuTextColor,

    // mobile menu style
    mobileMenuBackground,
    mobileMenuBgColor,
    mobileMenuTextColor,
    mobileMenuActiveColor,
    showShadow,

    // login button
    showLoginButton,
    loginButtonText,
    loginButtonLink,
    loginButtonBackground,
    loginButtonTextColor,
    loginButtonBorderColor,
    loginButtonHoverColor,
    loginButtonFontSize,
    loginButtonBorderRadius,

    // admission button
    showAdmissionButton,
    admissionButtonText,
    admissionButtonLink,
    admissionButtonBackground,
    admissionButtonTextColor,
    admissionButtonHoverColor,
    admissionButtonFontSize,
    admissionButtonBorderRadius,

    menu,
  } = data;

  const visibleMenu = filterMenuByRole(
    [...(menu || [])].sort((a, b) => a.order - b.order),
    user?.role
  );

  const isTransparent = transparent && !scrolled;
  const appBarBg = isTransparent ? "transparent" : navbarBackground || "#fff";
  const textColor = isTransparent ? "#fff" : navbarTextColor || "#111";
  const shrunkHeight = Math.max((navbarHeight || 80) - 14, 56);
  const currentHeight = scrolled && sticky ? shrunkHeight : navbarHeight || 80;

  return (
    <>
      {/* ================= TOP BAR ================= */}
      {showTopBar && (topBarEmail || topBarPhone || topBarAddress) && (
        <Box
          sx={{
            bgcolor: topBarBackground || secondaryColor || "#f2f2f2",
            color: topBarTextColor || "#333",
            py: 0.8,
            display: { xs: "none", md: "block" },
          }}
        >
          <Container maxWidth="lg">
            <Box display="flex" justifyContent="flex-end" alignItems="center" gap={3.5}>
              {topBarEmail && (
                <Box display="flex" alignItems="center" gap={0.7}>
                  <Email sx={{ fontSize: (topBarFontSize || 13) + 3, opacity: 0.85 }} />
                  <Typography sx={{ fontSize: topBarFontSize || 13, letterSpacing: 0.2 }}>
                    {topBarEmail}
                  </Typography>
                </Box>
              )}
              {topBarPhone && (
                <Box display="flex" alignItems="center" gap={0.7}>
                  <Phone sx={{ fontSize: (topBarFontSize || 13) + 3, opacity: 0.85 }} />
                  <Typography sx={{ fontSize: topBarFontSize || 13, letterSpacing: 0.2 }}>
                    {topBarPhone}
                  </Typography>
                </Box>
              )}
              {topBarAddress && (
                <Box display="flex" alignItems="center" gap={0.7}>
                  <LocationOn sx={{ fontSize: (topBarFontSize || 13) + 3, opacity: 0.85 }} />
                  <Typography sx={{ fontSize: topBarFontSize || 13, letterSpacing: 0.2 }}>
                    {topBarAddress}
                  </Typography>
                </Box>
              )}
            </Box>
          </Container>
        </Box>
      )}

      {/* ================= MAIN NAVBAR ================= */}
      <AppBar
        position={sticky ? "sticky" : "static"}
        elevation={0}
        sx={{
          bgcolor: appBarBg,
          backdropFilter: isTransparent ? "none" : "saturate(180%) blur(6px)",
          height: currentHeight,
          justifyContent: "center",
          transition:
            "background-color .3s ease, box-shadow .3s ease, height .25s ease",
          top: 0,
          borderBottom: `1.5px solid ${
            scrolled ? borderBottomColor || "transparent" : "transparent"
          }`,
          boxShadow:
            navbarShadow && !isTransparent && scrolled
              ? "0 4px 20px rgba(0,0,0,.06)"
              : "none",
        }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              justifyContent: "space-between",
              minHeight: "unset !important",
              gap: 2,
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration:"none",
                flexShrink: 0,
              }}
            >
              {logo?.url && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "width .25s ease, height .25s ease",
                
                  }}
                >
                  <Image
                    src={logo.url}
                    alt={schoolName}
                    width={logoWidth || 44}
                    height={logoHeight || 44}
                    style={{
                      objectFit: "contain",
                      width: scrolled && sticky ? Math.min(logoWidth || 44, 38) : logoWidth || 44,
                      height: scrolled && sticky ? Math.min(logoHeight || 44, 38) : logoHeight || 44,
                      transition: "width .25s ease, height .25s ease",
                    }}
                  />
                </Box>
              )}
              <Typography
                noWrap
                sx={{
                  color: textColor,
                  fontSize: navbarFontSize || 20,
                  fontWeight: navbarFontWeight || 500,
                  lineHeight: 1.15,
                  letterSpacing: 0.1,
                  textDecoration:"none",
                  
                }}
              >
                {shortName || schoolName}
              </Typography>
            </Link>

            {/* Desktop Menu */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 0.5,
                flex: 1,
                justifyContent: "center",
              }}
            >
              {visibleMenu.map((item, index) => (
                <NavMenuItem
                  key={item._id || index}
                  item={item}
                  textColor={textColor}
                  accentColor={activeMenuColor || primaryColor}
                  hoverColor={navbarHoverColor}
                  pathname={pathname}
                  menuFontSize={menuFontSize}
                  menuFontWeight={menuFontWeight}
                  menuTextTransform={menuTextTransform}
                  submenuBackground={submenuBackground}
                  submenuTextColor={submenuTextColor}
                  submenuHoverBackground={submenuHoverBackground}
                  submenuHoverTextColor={submenuHoverTextColor}
                  submenuBorderRadius={submenuBorderRadius}
                  megaMenuBackground={megaMenuBackground}
                  megaMenuHeadingColor={megaMenuHeadingColor}
                  megaMenuTextColor={megaMenuTextColor}
                />
              ))}
            </Box>

            {/* Actions */}
            <Box display="flex" alignItems="center" gap={1.2} flexShrink={0}>
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1.2 }}>
           {showLoginButton && (
  user ? (
    <Button
      variant="outlined"
      onClick={handleLogout}
      sx={{
        bgcolor: loginButtonBackground || "transparent",
        color: loginButtonTextColor || textColor,
        borderColor: loginButtonBorderColor || textColor,
        fontSize: loginButtonFontSize || 14,
        borderRadius: `${loginButtonBorderRadius ?? 8}px`,
        textTransform: "none",
        px: 2.4,
        fontWeight: 600,
        transition: "all .2s ease",
        "&:hover": {
          bgcolor: loginButtonHoverColor || "rgba(0,0,0,.04)",
          borderColor: loginButtonBorderColor || textColor,
          color: loginButtonHoverColor ? "#fff" : loginButtonTextColor,
        },
      }}
    >
      Logout
    </Button>
  ) : (
    <Button
      component={Link}
      href={loginButtonLink || "/login"}
      variant="outlined"
      sx={{
        bgcolor: loginButtonBackground || "transparent",
        color: loginButtonTextColor || textColor,
        borderColor: loginButtonBorderColor || textColor,
        fontSize: loginButtonFontSize || 14,
        borderRadius: `${loginButtonBorderRadius ?? 8}px`,
        textTransform: "none",
        px: 2.4,
        fontWeight: 600,
      }}
    >
      {loginButtonText || "Login"}
    </Button>
  )
)}
                {showAdmissionButton && (
                  <Button
                    component={Link}
                    href={admissionButtonLink || "/admission"}
                    variant="contained"
                    disableElevation
                    sx={{
                      bgcolor: admissionButtonBackground || primaryColor,
                      color: admissionButtonTextColor || "#fff",
                      fontSize: admissionButtonFontSize || 14,
                      borderRadius: `${admissionButtonBorderRadius ?? 8}px`,
                      textTransform: "none",
                      px: 2.6,
                      fontWeight: 600,
                      boxShadow: "none",
                      transition: "all .2s ease",
                      "&:hover": {
                        bgcolor:
                          admissionButtonHoverColor ||
                          admissionButtonBackground ||
                          primaryColor,
                        boxShadow: "0 4px 14px rgba(0,0,0,.15)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    {admissionButtonText || "Admission Open"}
                  </Button>
                )}
              </Box>

              <IconButton
                sx={{
                  display: { xs: "flex", md: "none" },
                  color: textColor,
                  border: "1px solid",
                  borderColor: isTransparent ? "rgba(255,255,255,.4)" : "rgba(0,0,0,.1)",
                  borderRadius: 1.5,
                }}
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon fontSize="small" />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* ================= MOBILE DRAWER ================= */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: 300,
            bgcolor: mobileMenuBackground || "#fff",
            boxShadow: showShadow ? "-6px 0 24px rgba(0,0,0,.12)" : "none",
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
            overflow: "hidden",
          },
        }}
      >
        <Box role="presentation" sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Drawer Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ px: 2.5, py: 2 }}
          >
            <Box display="flex" alignItems="center" gap={1.2}>
              {logo?.url && (
                <Image
                  src={logo.url}
                  alt={schoolName}
                  width={logoWidth ? Math.min(logoWidth, 34) : 34}
                  height={logoHeight ? Math.min(logoHeight, 34) : 34}
                  style={{ objectFit: "contain" }}
                />
              )}
              <Typography fontWeight={700} fontSize={16} sx={{ color: mobileMenuTextColor || "#111" }}>
                {shortName || schoolName}
              </Typography>
            </Box>
            <IconButton
              onClick={() => setMobileOpen(false)}
              size="small"
              sx={{ bgcolor: "rgba(0,0,0,.04)" }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider />

          {/* Menu List */}
          <List
            sx={{
              bgcolor: mobileMenuBgColor || "transparent",
              flex: 1,
              overflowY: "auto",
              py: 1,
            }}
          >
            {visibleMenu.map((item, index) => {
              const hasChildren = item.children?.length > 0;
              const active = isActiveMenu(pathname, item.url);
              const isOpen = openMobileIndex === index;

              return (
                <Box key={item._id || index} sx={{ px: 1 }}>
                  <ListItemButton
                    onClick={() =>
                      hasChildren
                        ? setOpenMobileIndex(isOpen ? null : index)
                        : setMobileOpen(false)
                    }
                    component={hasChildren ? "div" : Link}
                    href={hasChildren ? undefined : item.url}
                    target={item.target}
                    selected={active}
                    sx={{
                      borderRadius: 1.5,
                      color: active
                        ? mobileMenuActiveColor || activeMenuColor || primaryColor
                        : mobileMenuTextColor || "#222",
                    }}
                  >
                    <ListItemText
                      primary={item.title}
                      primaryTypographyProps={{
                        fontWeight: active ? 700 : menuFontWeight || 500,
                        fontSize: menuFontSize || 15,
                        textTransform: menuTextTransform || "none",
                      }}
                    />
                    {hasChildren && (isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
                  </ListItemButton>

                  {hasChildren && (
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                      <List
                        component="div"
                        disablePadding
                        sx={{
                          bgcolor: item.isMegaMenu
                            ? megaMenuBackground || "#fafafa"
                            : submenuBackground || "#fafafa",
                          borderRadius: 1.5,
                          my: 0.5,
                          overflow: "hidden",
                        }}
                      >
                        {item.isMegaMenu && (
                          <Typography
                            sx={{
                              pl: 3,
                              pt: 1.2,
                              pb: 0.3,
                              fontSize: 12,
                              fontWeight: 700,
                              letterSpacing: 0.4,
                              textTransform: "uppercase",
                              color: megaMenuHeadingColor || primaryColor,
                            }}
                          >
                            {item.title}
                          </Typography>
                        )}

                        {item.children.map((child) => {
                          const childActive = isActiveMenu(pathname, child.url);
                          return (
                            <ListItemButton
                              key={child._id}
                              component={Link}
                              href={child.url}
                              target={child.target}
                              sx={{
                                pl: 3,
                                py: 0.9,
                                color: childActive
                                  ? submenuHoverTextColor || primaryColor
                                  : item.isMegaMenu
                                  ? megaMenuTextColor || "#333"
                                  : submenuTextColor || "#333",
                                "&:hover": {
                                  bgcolor: submenuHoverBackground || "rgba(0,0,0,.04)",
                                },
                              }}
                              selected={childActive}
                              onClick={() => setMobileOpen(false)}
                            >
                              <ListItemText
                                primary={child.title}
                                primaryTypographyProps={{
                                  fontWeight: childActive ? 700 : 400,
                                  fontSize: 14,
                                }}
                              />
                            </ListItemButton>
                          );
                        })}
                      </List>
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </List>

          <Divider />

          {/* Footer Buttons */}
          <Box p={2.2} display="flex" flexDirection="column" gap={1.2}>
          {showLoginButton && (
  user ? (
    <Button
      variant="outlined"
      fullWidth
      onClick={handleLogout}
      sx={{
        color: loginButtonTextColor || primaryColor,
        borderColor: loginButtonBorderColor || primaryColor,
        fontSize: loginButtonFontSize || 14,
        borderRadius: `${loginButtonBorderRadius ?? 8}px`,
        textTransform: "none",
        fontWeight: 600,
        py: 1,
      }}
    >
      Logout
    </Button>
  ) : (
    <Button
      component={Link}
      href={loginButtonLink || "/login"}
      variant="outlined"
      fullWidth
      sx={{
        color: loginButtonTextColor || primaryColor,
        borderColor: loginButtonBorderColor || primaryColor,
        fontSize: loginButtonFontSize || 14,
        borderRadius: `${loginButtonBorderRadius ?? 8}px`,
        textTransform: "none",
        fontWeight: 600,
        py: 1,
      }}
    >
      {loginButtonText || "Login"}
    </Button>
  )
)}
            {showAdmissionButton && (
              <Button
                component={Link}
                href={admissionButtonLink || "/admission"}
                variant="contained"
                fullWidth
                disableElevation
                sx={{
                  bgcolor: admissionButtonBackground || primaryColor,
                  color: admissionButtonTextColor || "#fff",
                  fontSize: admissionButtonFontSize || 14,
                  borderRadius: `${admissionButtonBorderRadius ?? 8}px`,
                  textTransform: "none",
                  fontWeight: 600,
                  py: 1,
                  "&:hover": {
                    bgcolor:
                      admissionButtonHoverColor ||
                      admissionButtonBackground ||
                      primaryColor,
                  },
                }}
              >
                {admissionButtonText || "Admission Open"}
              </Button>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
}