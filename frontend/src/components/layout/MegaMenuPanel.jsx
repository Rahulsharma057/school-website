"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Box, Button, Popper, Paper, Grow, ClickAwayListener, Grid, Stack, Typography } from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";

import buildMegaMenu from "@/utils/buildMegaMenu";
import isActiveMenu from "@/utils/isActiveMenu";

export default function NavMenuItem({
  item,
  textColor,
  accentColor,
  hoverColor,
  pathname,

  menuFontSize,
  menuFontWeight,
  menuTextTransform,

  submenuBackground,
  submenuTextColor,
  submenuHoverBackground,
  submenuHoverTextColor,
  submenuBorderRadius,

  megaMenuBackground,
  megaMenuHeadingColor,
  megaMenuTextColor,
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const closeTimer = useRef(null);

  const hasChildren = item.children?.length > 0;
  const parentActive =
    isActiveMenu(pathname, item.url) ||
    (item.children || []).some((c) => isActiveMenu(pathname, c.url));

  const handleEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const baseButtonSx = {
    fontSize: menuFontSize || 15,
    fontWeight: menuFontWeight || 600,
    textTransform: menuTextTransform || "none",
    borderRadius: 0,
    transition: "color .2s ease",
    "&:hover": {
      color: hoverColor || accentColor || "#111",
      bgcolor: "transparent",
    },
  };

  if (!hasChildren) {
    const active = isActiveMenu(pathname, item.url);
    return (
      <Button
        component={Link}
        href={item.url}
        target={item.target}
        sx={{
          ...baseButtonSx,
          color: active ? accentColor || "#111" : textColor,
          borderBottom: active ? `2px solid ${accentColor || "#111"}` : "2px solid transparent",
        }}
      >
        {item.title}
      </Button>
    );
  }

  const columns = item.isMegaMenu ? buildMegaMenu(item.children, 3) : [item.children];

  return (
    <Box ref={anchorRef} onMouseEnter={handleEnter} onMouseLeave={handleLeave} sx={{ position: "relative" }}>
      <Button
        endIcon={
          <KeyboardArrowDown
            sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
          />
        }
        sx={{
          ...baseButtonSx,
          color: parentActive ? accentColor || "#111" : textColor,
          borderBottom: parentActive ? `2px solid ${accentColor || "#111"}` : "2px solid transparent",
        }}
        component={item.url ? Link : "button"}
        href={item.url || undefined}
      >
        {item.title}
      </Button>

      <Popper open={open} anchorEl={anchorRef.current} placement="bottom-start" transition style={{ zIndex: 1300 }}>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={180}>
            <Paper
              elevation={6}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              sx={{
                mt: 1,
                p: 2.5,
                minWidth: item.isMegaMenu ? 480 : 220,
                bgcolor: item.isMegaMenu ? megaMenuBackground || "#fff" : submenuBackground || "#fff",
                borderTop: `3px solid ${accentColor || "#111"}`,
                borderRadius: `${submenuBorderRadius ?? 8}px`,
              }}
            >
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <Box>
                  {item.isMegaMenu && (
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: 13,
                        mb: 1.5,
                        color: megaMenuHeadingColor || accentColor || "#1976d2",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>
                  )}

                  <Grid container spacing={3}>
                    {columns.map((column, colIndex) => (
                      <Grid item xs key={colIndex} minWidth={180}>
                        <Stack spacing={0.5}>
                          {column.map((child) => {
                            const childActive = isActiveMenu(pathname, child.url);
                            return (
                              <Button
                                key={child._id}
                                component={Link}
                                href={child.url}
                                target={child.target}
                                onClick={() => setOpen(false)}
                                sx={{
                                  justifyContent: "flex-start",
                                  textTransform: "none",
                                  fontSize: 14,
                                  color: childActive
                                    ? submenuHoverTextColor || accentColor || "#111"
                                    : item.isMegaMenu
                                    ? megaMenuTextColor || "#333"
                                    : submenuTextColor || "#333",
                                  fontWeight: childActive ? 700 : 500,
                                  bgcolor: childActive ? "rgba(0,0,0,0.04)" : "transparent",
                                  borderRadius: `${submenuBorderRadius ?? 8}px`,
                                  "&:hover": {
                                    bgcolor: submenuHoverBackground || "rgba(0,0,0,.04)",
                                    color: submenuHoverTextColor || accentColor || "#111",
                                  },
                                }}
                              >
                                {child.title}
                              </Button>
                            );
                          })}
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}