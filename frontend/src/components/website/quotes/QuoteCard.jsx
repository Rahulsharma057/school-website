"use client";

import { Avatar, Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const SERIF = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";

// Photo size presets — horizontal variant is the "photo beside quote"
// layout, vertical is smaller since it sits inline with the name.
// Change values here once and every quote using that preset (page-wide
// default or per-quote override) scales together automatically.
const PHOTO_SIZE_MAP = {
  sm: { horizontal: 48, vertical: 36 },
  md: { horizontal: 64, vertical: 44 },
  lg: { horizontal: 88, vertical: 56 },
  xl: { horizontal: 112, vertical: 68 },
};

// "full" display mode scales the same size preset up further, so an
// admin only ever picks S/M/L/XL — the "avatar vs full" distinction is
// purely a multiplier on top of that, not a whole second size scale to
// maintain.
const FULL_DISPLAY_MULTIPLIER = 1.9;

// Quote text size presets — line-height and the big decorative
// quotation mark's size scale together with the font size automatically,
// so picking a size is the only thing anyone has to think about.
const FONT_SIZE_MAP = {
  sm: { fontSize: 13.5, lineHeight: 1.55, markSize: 72 },
  md: { fontSize: 16, lineHeight: 1.6, markSize: 96 },
  lg: { fontSize: 19, lineHeight: 1.65, markSize: 118 },
  xl: { fontSize: 23, lineHeight: 1.7, markSize: 142 },
};

/**
 * Reusable testimonial/quote card — drop it anywhere (homepage sections,
 * about page, a "wall of love" grid, sidebars, etc.) by passing a quote
 * object shaped like the Quote model:
 *
 *   { quoteText, authorName, authorTitle, authorImage: { url }, category,
 *     button: { enabled, label, url } }
 *
 * `quote.button` (if present and enabled) renders a small per-card CTA —
 * independent of any page-wide "View All" button QuoteWall might also
 * show below the whole grid.
 *
 * Fully customizable per-instance:
 *
 *   variant              "horizontal" (default) | "vertical"
 *   imagePosition        "right" (default) | "left" — desktop side-by-side
 *                         placement. Only applies to variant="horizontal".
 *   mobilePhotoPosition  "top" | "bottom" — where the photo stacks on a
 *                         mobile screen. Defaults to matching
 *                         imagePosition (left -> top, right -> bottom).
 *   photoSize             "sm" | "md" (default) | "lg" | "xl"
 *   photoShape             "round" (default) | "square"
 *   imageDisplay            "avatar" (default, small headshot) | "full"
 *                         (larger, more prominent photo)
 *   fontSize                "sm" | "md" (default) | "lg" | "xl" — quote
 *                         text size; line-height/quote-mark scale with it.
 *   cardStyle              "bordered" (default) | "plain" | "minimal"
 *   primaryColor            accent hex for the avatar bg + quote-mark tint.
 */
export default function QuoteCard({
  quote,
  variant = "horizontal",
  imagePosition = "right",
  mobilePhotoPosition,
  photoSize = "md",
  photoShape = "round",
  imageDisplay = "avatar",
  fontSize = "md",
  cardStyle = "bordered",
  primaryColor = "#18181b",
}) {
  if (!quote) return null;

  const { quoteText, authorName, authorTitle, authorImage, category, button: cardButton } = quote;
  const isHorizontal = variant === "horizontal";
  const imageFirst = isHorizontal && imagePosition === "left";
  const isFullDisplay = imageDisplay === "full";

  const size = PHOTO_SIZE_MAP[photoSize] || PHOTO_SIZE_MAP.md;
  const type = FONT_SIZE_MAP[fontSize] || FONT_SIZE_MAP.md;

  // Mobile stacking is independent of the desktop left/right position —
  // default to mirroring it (feels natural) but let it be overridden.
  const effectiveMobilePosition = mobilePhotoPosition || (imagePosition === "left" ? "top" : "bottom");
  const mobileOrder = effectiveMobilePosition === "top" ? -1 : 1;

  const baseAvatarSize = isHorizontal ? size.horizontal : size.vertical;
  const fullSize = Math.round(baseAvatarSize * FULL_DISPLAY_MULTIPLIER);
  // On mobile, an oversized "full" photo (e.g. XL preset -> ~213px) can
  // dominate a narrow card — scale it down a bit below the sm breakpoint
  // rather than rendering it at full desktop size everywhere.
  const avatarSize = isFullDisplay
    ? { xs: Math.round(fullSize * 0.72), sm: fullSize }
    : baseAvatarSize;

  const authorBlock = (
    <Stack
      direction={isHorizontal ? "column" : "row"}
      alignItems="center"
      spacing={isHorizontal ? 1.25 : 1.5}
      sx={{
        minWidth: isHorizontal ? { xs: "auto", sm: 132 } : "auto",
        textAlign: isHorizontal ? { xs: "left", sm: "center" } : "left",
        flexShrink: 0,
        // desktop order follows real DOM order (imageFirst below);
        // mobile order is fully independent, set here
        order: { xs: mobileOrder, sm: 0 },
      }}
    >
      <Avatar
        src={authorImage?.url || undefined}
        alt={authorName}
        variant={photoShape === "square" ? "rounded" : "circular"}
        sx={{
          width: avatarSize,
          height: avatarSize,
          bgcolor: primaryColor,
          fontWeight: 700,
          fontSize: isFullDisplay ? 28 : undefined,
          border: isFullDisplay ? "3px solid #fff" : "2px solid #fff",
          boxShadow: isFullDisplay
            ? "0 8px 20px -8px rgba(24,24,27,0.35), 0 0 0 1px #e4e4e7"
            : "0 0 0 1px #e4e4e7",
        }}
      >
        {authorName?.[0]?.toUpperCase()}
      </Avatar>

      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#18181b" }}>
          {authorName}
        </Typography>
        {authorTitle && (
          <Typography
            sx={{
              fontSize: 11,
              color: "#a1a1aa",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 600,
            }}
          >
            {authorTitle}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const quoteBlock = (
    <Box sx={{ position: "relative", flex: 1, pt: 2.5, minWidth: 0, order: { xs: 0, sm: 0 } }}>
      {/* signature element — an oversized serif opening quotation mark,
          sitting behind the text like a watermark, tinted to match
          whatever accent color this instance was given and scaled to
          the chosen font size preset */}
      <Box
        component="span"
        aria-hidden="true"
        sx={{
          fontFamily: SERIF,
          fontSize: type.markSize,
          lineHeight: 0.6,
          color: alpha(primaryColor, 0.12),
          fontWeight: 700,
          userSelect: "none",
          position: "absolute",
          top: 8,
          left: 4,
          zIndex: 0,
        }}
      >
        &ldquo;
      </Box>

      <Typography
        sx={{
          position: "relative",
          zIndex: 1,
          fontFamily: SERIF,
          fontStyle: "italic",
          fontSize: { xs: Math.max(13.5, type.fontSize - 1), md: type.fontSize },
          lineHeight: type.lineHeight,
          color: "#27272a",
        }}
      >
        {quoteText}
      </Typography>

      {/* Per-card CTA — belongs to this specific quote, independent of
          any page-wide "View All" button the wall around it might show. */}
      {cardButton?.enabled && cardButton?.url && (
        <Box sx={{ position: "relative", zIndex: 1, mt: 2 }}>
          <Button
            href={cardButton.url}
            target={cardButton.url.startsWith("/") ? undefined : "_blank"}
            rel={cardButton.url.startsWith("/") ? undefined : "noreferrer"}
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              color: primaryColor,
              px: 0,
              "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
            }}
          >
            {cardButton.label || "Read More"}
          </Button>
        </Box>
      )}
    </Box>
  );

  const divider = isHorizontal && (
    <Box
      sx={{
        width: "1px",
        alignSelf: "stretch",
        bgcolor: "#f0f0f1",
        display: { xs: "none", sm: "block" },
      }}
    />
  );

  const cardSx =
    cardStyle === "plain"
      ? { bgcolor: "transparent", border: "none", borderRadius: 0, p: { xs: 2, md: 2.5 } }
      : cardStyle === "minimal"
        ? {
            bgcolor: "#fff",
            border: "none",
            borderBottom: `2px solid ${alpha(primaryColor, 0.15)}`,
            borderRadius: 0,
            p: { xs: 2, md: 2.25 },
          }
        : {
            bgcolor: "#fff",
            border: "1px solid #e4e4e7",
            borderRadius: { xs: 2, md: 3 },
            p: { xs: 2.25, md: 3.5 },
            transition: "box-shadow 0.2s ease, transform 0.2s ease",
            "&:hover": {
              boxShadow: "0 12px 30px -12px rgba(24,24,27,0.18)",
              transform: "translateY(-2px)",
            },
          };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...cardSx,
      }}
    >
      {category && (
        <Chip
          label={category}
          size="small"
          sx={{
            position: "absolute",
            top: 14,
            right: 14,
            fontSize: 10.5,
            fontWeight: 700,
            bgcolor: "#f4f4f5",
            color: "#52525b",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        />
      )}

      <Stack
        direction={{ xs: "column", sm: isHorizontal ? "row" : "column" }}
        spacing={isHorizontal ? 3 : 2.5}
        alignItems={{ xs: "stretch", sm: isHorizontal ? "flex-start" : "stretch" }}
        sx={{ flex: 1 }}
      >
        {imageFirst ? (
          <>
            {authorBlock}
            {divider}
            {quoteBlock}
          </>
        ) : (
          <>
            {quoteBlock}
            {divider}
            {authorBlock}
          </>
        )}
      </Stack>
    </Box>
  );
}
