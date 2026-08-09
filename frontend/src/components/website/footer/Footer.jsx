"use client";

import { Box, Container, IconButton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { getFooter } from "@/services/footerService";
import { getSocialIcon } from "@/lib/socialIcons";

const PADDING_MAP = {
  compact: { xs: 4, md: 5 },
  comfortable: { xs: 6, md: 8 },
  spacious: { xs: 8, md: 12 },
};

export default function Footer() {
  const { data } = useQuery({
    queryKey: ["footer", "public"],
    queryFn: async () => (await getFooter()).data,
    staleTime: 5 * 60 * 1000, // footer rarely changes — no need to refetch on every navigation
  });

  const footer = data?.data;
  if (!footer) return null;

  const { sections = [], socialLinks = [], branding = {}, copyrightText = "", style = {} } = footer;

  const {
    bgColor = "#18181b",
    textColor = "#d4d4d8",
    headingColor = "#ffffff",
    linkColor = "#a1a1aa",
    linkHoverColor = "#ffffff",
    borderColor = "#27272a",
    columns = 4,
    alignment = "left",
    showDivider = true,
    padding = "comfortable",
  } = style;

  const year = new Date().getFullYear();
  const copyright = copyrightText.replace("{year}", year);

  return (
    <Box component="footer" sx={{ bgcolor: bgColor, color: textColor, pt: PADDING_MAP[padding] || PADDING_MAP.comfortable, pb: 3 }}>
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 4, md: 3 }}
          justifyContent="space-between"
          alignItems={alignment === "center" ? "center" : "flex-start"}
          textAlign={alignment === "center" ? "center" : "left"}
          mb={5}
        >
          {(branding.showLogo || branding.description) && (
            <Box sx={{ maxWidth: 280, flexShrink: 0 }}>
              {branding.showLogo && branding.logoUrl && (
                <Box component="img" src={branding.logoUrl} alt="Logo" sx={{ height: 40, mb: 1.5, objectFit: "contain" }} />
              )}
              {branding.description && (
                <Typography sx={{ fontSize: 13.5, color: textColor, lineHeight: 1.7 }}>{branding.description}</Typography>
              )}
            </Box>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: `repeat(${Math.min(columns, sections.length || 1)}, minmax(140px, 1fr))`,
              },
              gap: 4,
              flex: 1,
              justifyItems: alignment === "center" ? "center" : "start",
            }}
          >
            {sections.map((section) => (
              <Box key={section.id}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: headingColor, mb: 1.5 }}>
                  {section.title}
                </Typography>
                <Stack spacing={1}>
                  {section.links.map((link) => (
                    <Box
                      key={link.id}
                      component={Link}
                      href={link.url}
                      target={link.openInNewTab ? "_blank" : undefined}
                      rel={link.openInNewTab ? "noreferrer" : undefined}
                      sx={{
                        fontSize: 13.5,
                        color: linkColor,
                        textDecoration: "none",
                        "&:hover": { color: linkHoverColor },
                      }}
                    >
                      {link.label}
                    </Box>
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Stack>

        {socialLinks.length > 0 && (
          <Stack direction="row" spacing={1} justifyContent={alignment === "center" ? "center" : "flex-start"} mb={4}>
            {socialLinks.map((s) => {
              const Icon = getSocialIcon(s.platform);
              return (
                <IconButton
                  key={s.id}
                  component="a"
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label || s.platform}
                  size="small"
                  sx={{
                    color: linkColor,
                    border: `1px solid ${borderColor}`,
                    "&:hover": { color: linkHoverColor, borderColor: linkHoverColor },
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              );
            })}
          </Stack>
        )}

        {showDivider && <Box sx={{ borderTop: `1px solid ${borderColor}`, mb: 3 }} />}

        <Typography sx={{ fontSize: 12.5, color: linkColor, textAlign: alignment === "center" ? "center" : "left" }}>
          {copyright}
        </Typography>
      </Container>
    </Box>
  );
}
