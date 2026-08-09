"use client";

import Link from "next/link";

import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  Grid,
  Paper,
  Chip,
  Divider,
} from "@mui/material";

import LazyImage from "@/components/common/LazyImage";

const IMAGE_SIZE_MAP = {
  small: { xs: 12, md: 4 },
  medium: { xs: 12, md: 6 },
  large: { xs: 12, md: 7 },
};

const PAGE_WIDTH_MAP = { small: "sm", medium: "md", large: "lg", full: false };

const HEADER_POSITION_STYLES = {
  "top-left": { justifyContent: "flex-start", alignItems: "flex-start", textAlign: "left" },
  "top-center": { justifyContent: "flex-start", alignItems: "center", textAlign: "center" },
  "top-right": { justifyContent: "flex-start", alignItems: "flex-end", textAlign: "right" },
  "center-left": { justifyContent: "center", alignItems: "flex-start", textAlign: "left" },
  center: { justifyContent: "center", alignItems: "center", textAlign: "center" },
  "center-right": { justifyContent: "center", alignItems: "flex-end", textAlign: "right" },
  "bottom-left": { justifyContent: "flex-end", alignItems: "flex-start", textAlign: "left" },
  "bottom-center": { justifyContent: "flex-end", alignItems: "center", textAlign: "center" },
  "bottom-right": { justifyContent: "flex-end", alignItems: "flex-end", textAlign: "right" },
};

const CARD_IMAGE_SHAPE_STYLE = {
  square: { borderRadius: 0, aspectStyle: {} },
  rounded: { borderRadius: 12, aspectStyle: {} },
  circle: { borderRadius: "50%", aspectStyle: { aspectRatio: "1 / 1", mx: "auto", mt: 2.5 } },
  wide: { borderRadius: 0, aspectStyle: {} },
};

function CardItem({ card, cardStyle, cardImageShape, cardDirection, cardImageSizeMode, cardImageWidth, cardImageHeight, showCardHeading }) {
  const styleSx =
    cardStyle === "outlined" ? { boxShadow: "none", border: "1px solid #e4e4e7" } :
    cardStyle === "flat" ? { boxShadow: "none", border: "none", bgcolor: "#fafafa" } :
    { boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "none" };

  const shape = CARD_IMAGE_SHAPE_STYLE[cardImageShape] || CARD_IMAGE_SHAPE_STYLE.square;
  const isCircle = cardImageShape === "circle";
  const isHorizontal = cardDirection === "horizontal" && !isCircle; // circle always centers on top, doesn't make sense side-by-side
  const isCustomSize = cardImageSizeMode === "custom";

  const imgHeight = cardImageHeight || 160;
  // Auto mode: image fills the card's width (vertical) or a fixed lane
  // (horizontal, since it can't be "100%" next to text). Custom mode:
  // exact px box regardless of layout.
  const imgWidth = isCustomSize ? (cardImageWidth || 200) : isHorizontal ? 140 : isCircle ? imgHeight : "100%";

  const image = card.image?.url && (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={card.image.url}
      alt={card.title || ""}
      loading="lazy"
      style={{
        width: imgWidth,
        height: imgHeight,
        objectFit: card.image.objectFit || "cover",
        borderRadius: shape.borderRadius,
        display: "block",
        flexShrink: 0,
        marginLeft: isCircle ? "auto" : 0,
        marginRight: isCircle ? "auto" : 0,
        marginTop: isCircle ? 20 : 0,
      }}
    />
  );

  const textBlock = (
    <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flex: 1, textAlign: isCircle ? "center" : "left" }}>
      {showCardHeading !== false && card.title && (
        <Typography fontWeight={700} mb={card.subheading ? 0.25 : 1} sx={{ fontSize: 16, color: "#18181b" }}>{card.title}</Typography>
      )}
      {card.subheading && (
        <Typography sx={{ fontSize: 12.5, color: "#a1a1aa", mb: 1, textTransform: "uppercase", letterSpacing: "0.03em" }}>{card.subheading}</Typography>
      )}
      {card.description && (
        <Typography sx={{ fontSize: 14, color: "#71717a", lineHeight: 1.7, mb: card.button?.text ? 2 : 0, flex: 1 }}>
          {card.description}
        </Typography>
      )}
      {card.button?.text && (
        <Box sx={{ mt: "auto", display: "flex", justifyContent: isCircle ? "center" : "flex-start" }}>
          <SectionButton button={card.button} size="small" sx={{ mt: 0 }} />
        </Box>
      )}
    </Box>
  );

  return (
    <Box
      sx={{
        height: "100%",
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#fff",
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        alignItems: isHorizontal ? "stretch" : undefined,
        ...styleSx,
      }}
    >
      {image}
      {textBlock}
    </Box>
  );
}

const getButtonSx = (style) => {
  if (style === "outline") {
    return { bgcolor: "transparent", color: "#18181b", border: "1.5px solid #18181b", "&:hover": { bgcolor: "#f4f4f5" } };
  }
  if (style === "secondary") {
    return { bgcolor: "#f4f4f5", color: "#18181b", "&:hover": { bgcolor: "#e4e4e7" } };
  }
  return { bgcolor: "#18181b", color: "#fff", "&:hover": { bgcolor: "#27272a" } };
};

const safeLink = (url) => {
  if (!url) return "/";
  if (url.startsWith("/") || url.startsWith("http")) return url;
  return "/";
};

function SectionButton({ button, size = "medium", sx = {} }) {
  if (!button?.text?.trim()) return null;
  const external = button.link?.startsWith("http");

  return (
    <Button
      component={button.openInNewTab || external ? "a" : Link}
      href={safeLink(button.link)}
      target={button.openInNewTab ? "_blank" : undefined}
      rel={button.openInNewTab ? "noreferrer" : undefined}
      size={size}
      disableElevation
      sx={{
        px: size === "small" ? 2.5 : 4,
        py: size === "small" ? 0.8 : 1.3,
        borderRadius: "8px",
        fontWeight: 600,
        textTransform: "none",
        alignSelf: "flex-start",
        ...getButtonSx(button.style),
        ...sx,
      }}
    >
      {button.text}
    </Button>
  );
}

function ImageTextBlock({ section }) {
  const images = [section.image, section.image2].filter((img) => img?.url);
  if (images.length === 0) return null;

  const isVertical = section.layout === "top" || section.layout === "bottom";
  const imageFirst = section.layout === "left" || section.layout === "top";
  const imageCol = IMAGE_SIZE_MAP[section.imageSize] || IMAGE_SIZE_MAP.medium;
  const textCol = { xs: 12, md: 12 - imageCol.md };
  const hasText = Boolean(section.heading?.trim() || section.subheading?.trim() || section.description?.trim());

  const imageBlock = (
    <Grid size={{ xs: 12, md: isVertical || !hasText ? 12 : imageCol.md }} sx={{ order: { xs: 1, md: imageFirst ? 1 : 2 } }}>
      <Stack direction={images.length > 1 && !isVertical ? "column" : "row"} spacing={2} flexWrap="wrap">
        {images.map((img, i) => (
          <LazyImage
            key={img.public_id || i}
            src={img.url}
            alt={img.alt || section.heading || "Section image"}
            objectFit={img.objectFit || "cover"}
            objectPosition={img.position || "center"}
            borderRadius={img.borderRadius ?? 12}
            height={isVertical ? { xs: 220, md: 340 } : { xs: 220, md: 280 }}
            sx={{ border: "1px solid #e4e4e7" }}
          />
        ))}
      </Stack>
    </Grid>
  );

  if (!hasText) {
    return <Grid container spacing={2} mb={3}>{imageBlock}</Grid>;
  }

  const textBlock = (
    <Grid size={{ xs: 12, md: isVertical ? 12 : textCol.md }} sx={{ order: { xs: 2, md: imageFirst ? 2 : 1 } }}>
      <Stack justifyContent="center" sx={{ height: "100%" }}>
        {section.heading && (
          <Typography variant="h4" fontWeight={700} sx={{ mb: section.subheading ? 0.5 : 2, textAlign: { xs: "left", md: section.titleAlign || "left" }, fontSize: { xs: 24, md: 32 } }}>
            {section.heading}
          </Typography>
        )}
        {section.subheading && (
          <Typography sx={{ mb: 2, color: "#71717a", textAlign: { xs: "left", md: section.subtitleAlign || "left" } }}>
            {section.subheading}
          </Typography>
        )}
        {section.description && <Typography sx={{ lineHeight: 1.8, color: "#3f3f46" }}>{section.description}</Typography>}
      </Stack>
    </Grid>
  );

  return <Grid container spacing={4} alignItems="center" mb={3}>{imageFirst ? <>{imageBlock}{textBlock}</> : <>{textBlock}{imageBlock}</>}</Grid>;
}

export default function DynamicPageContent({ page }) {
  if (!page) return null;

  const sections = [...(page.sections || [])].sort((a, b) => (a?.order || 0) - (b?.order || 0));
  const hasCoverImage = Boolean(page.coverImage?.url);
  const containerMaxWidth = PAGE_WIDTH_MAP[page.pageWidth] ?? "lg";

  const headerEnabled = page.header?.enabled ?? true;
  const headerShowBackground = page.header?.showBackground ?? true;
  const headerPos = HEADER_POSITION_STYLES[page.header?.contentPosition] || HEADER_POSITION_STYLES["bottom-left"];
  const headerMinHeight = page.header?.minHeight || (hasCoverImage ? 420 : 280);
  const headerOverlayColor = page.header?.overlayColor || "#09090b";
  const headerOverlayOpacity = page.header?.overlayOpacity ?? 0.55;
  const headingColor = page.header?.headingColor || (headerShowBackground ? "#ffffff" : "#18181b");
  const headingBackground = page.header?.headingBackground || "";

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth={containerMaxWidth} sx={{ py: { xs: 3, md: 8 } }}>
        <Stack spacing={{ xs: 5, md: 7 }}>
          {/* HEADER — can be fully hidden, or shown text-only without a photo/overlay */}

          {headerEnabled && (
            headerShowBackground ? (
              <Box
                sx={{
                  position: "relative",
                  minHeight: { xs: hasCoverImage ? Math.min(headerMinHeight, 320) : 220, md: headerMinHeight },
                  overflow: "hidden",
                  borderRadius: 3,
                  border: "1px solid #e4e4e7",
                  display: "flex",
                  flexDirection: "column",
                  background: hasCoverImage ? "transparent" : "linear-gradient(135deg, #18181b 0%, #27272a 55%, #3f3f46 100%)",
                  ...headerPos,
                }}
              >
                {hasCoverImage && (
                  <>
                    <Box
                      component="img"
                      src={page.coverImage.url}
                      alt={page.coverImage.alt || page.title}
                      loading="eager"
                      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: page.coverImage.objectFit || "cover", objectPosition: page.coverImage.position || "center" }}
                    />
                    <Box sx={{ position: "absolute", inset: 0, bgcolor: headerOverlayColor, opacity: headerOverlayOpacity }} />
                  </>
                )}

                <Box sx={{ position: "relative", zIndex: 1, maxWidth: headerPos.textAlign === "center" ? "100%" : 720, px: { xs: 3, md: 6.25 }, py: { xs: 3.5, md: 6.25 }, color: headingColor }}>
                  {page.pageType && (
                    <Chip
                      label={page.pageType.toUpperCase()}
                      size="small"
                      sx={{ mb: 2, background: "rgba(255,255,255,0.12)", color: headingColor, border: `1px solid ${headingColor}55`, fontWeight: 600, fontSize: 12, letterSpacing: "0.06em", backdropFilter: "blur(4px)" }}
                    />
                  )}

                  <Box sx={{ display: "inline-block", bgcolor: headingBackground || "transparent", px: headingBackground ? 2 : 0, py: headingBackground ? 1 : 0, borderRadius: 1.5 }}>
                    <Typography variant="h1" fontWeight={700} sx={{ fontSize: { xs: 30, md: 52 }, lineHeight: 1.15, letterSpacing: "-0.02em", color: headingColor }}>
                      {page.title}
                    </Typography>
                  </Box>

                  {page.shortDescription && (
                    <Typography mt={2} sx={{ maxWidth: 700, mx: headerPos.textAlign === "center" ? "auto" : 0, color: headingColor, opacity: 0.9, fontSize: { xs: 15, md: 20 }, lineHeight: 1.7 }}>
                      {page.shortDescription}
                    </Typography>
                  )}
                </Box>
              </Box>
            ) : (
              // Text-only header — no photo, no overlay, just heading on its own color/background
              <Box sx={{ textAlign: headerPos.textAlign, px: { xs: 0, md: headerPos.textAlign === "center" ? 0 : 1 }, py: { xs: 2, md: 3 } }}>
                {page.pageType && (
                  <Chip label={page.pageType.toUpperCase()} size="small" sx={{ mb: 1.5, bgcolor: "#f4f4f5", color: "#3f3f46", fontWeight: 600, fontSize: 12, letterSpacing: "0.06em" }} />
                )}
                <Box sx={{ display: "inline-block", bgcolor: headingBackground || "transparent", px: headingBackground ? 2 : 0, py: headingBackground ? 1 : 0, borderRadius: 1.5 }}>
                  <Typography variant="h1" fontWeight={700} sx={{ fontSize: { xs: 28, md: 44 }, lineHeight: 1.2, color: headingColor }}>
                    {page.title}
                  </Typography>
                </Box>
                {page.shortDescription && (
                  <Typography mt={1.5} sx={{ maxWidth: 700, mx: headerPos.textAlign === "center" ? "auto" : 0, color: "#52525b", fontSize: { xs: 15, md: 18 }, lineHeight: 1.7 }}>
                    {page.shortDescription}
                  </Typography>
                )}
              </Box>
            )
          )}

          {/* CONTENT */}

          {page.content && (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e4e4e7", boxShadow: "none" }}>
              <Typography variant="h4" fontWeight={700} mb={3} sx={{ color: "#18181b", fontSize: { xs: 22, md: 30 } }}>{page.title}</Typography>
              <Box sx={{ lineHeight: 1.9, color: "#3f3f46", fontSize: 16, wordBreak: "break-word", "& img": { maxWidth: "100%", borderRadius: 2 }, "& a": { color: "#18181b", fontWeight: 600 } }}>
                {page.content.includes("<") ? (
                  <div dangerouslySetInnerHTML={{ __html: page.content }} />
                ) : (
                  page.content.split("\n").filter((t) => t.trim()).map((t, i) => <Typography key={i} mb={2}>{t}</Typography>)
                )}
              </Box>
            </Paper>
          )}

          {/* GALLERY */}

          {page.gallery?.length > 0 && (
            <Box>
              <Divider sx={{ mb: 4, borderColor: "#e4e4e7" }} />
              <Stack direction="row" alignItems="baseline" justifyContent="space-between" flexWrap="wrap" rowGap={1} mb={3}>
                <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b", fontSize: { xs: 22, md: 30 } }}>Gallery</Typography>
                <Typography sx={{ fontSize: 13.5, color: "#71717a" }}>{page.gallery.length} {page.gallery.length === 1 ? "Photo" : "Photos"}</Typography>
              </Stack>
              <Grid container spacing={2.5}>
                {page.gallery.map((img, index) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={img.public_id || index}>
                    <LazyImage
                      src={img.url}
                      alt={img.alt || page.title}
                      objectFit={img.objectFit || "cover"}
                      objectPosition={img.position || "center"}
                      height={260}
                      sx={{ border: "1px solid #e4e4e7", borderRadius: 2, "&:hover img": { transform: "scale(1.05)" }, "& img": { transition: "transform 0.4s ease" } }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* CUSTOM SECTIONS */}

          {sections.length > 0 && (
            <Stack spacing={4}>
              {sections.map((section, index) => {
                const cardItems = (section.cardItems || []).filter((c) => c.title?.trim() || c.description?.trim() || c.image?.url);
                const faqItems = (section.faqItems || []).filter((f) => f.question?.trim() || f.answer?.trim());
                const isRowLayout = section.cardLayout === "row";
                const cardsPerRow = section.columns || 3;
                const hasBg = Boolean(section.backgroundImage?.url);

                return (
                  <Paper
                    key={section?._id || index}
                    variant="outlined"
                    sx={{
                      position: "relative",
                      p: { xs: 3, md: `${section.padding ?? 40}px` },
                      borderRadius: `${section.borderRadius ?? 12}px`,
                      boxShadow: "none",
                      border: hasBg || (section.background && section.background !== "#ffffff") ? "none" : "1px solid #e4e4e7",
                      background: hasBg ? "transparent" : section.background || "#fff",
                      color: hasBg ? "#fff" : section.textColor || "#18181b",
                      overflow: "hidden",
                    }}
                  >
                    {hasBg && (
                      <>
                        <Box
                          component="img"
                          src={section.backgroundImage.url}
                          alt=""
                          loading="lazy"
                          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Box sx={{ position: "absolute", inset: 0, bgcolor: section.backgroundOverlayColor || "#000", opacity: section.backgroundOverlayOpacity ?? 0.4 }} />
                      </>
                    )}

                    <Box sx={{ position: "relative", zIndex: 1 }}>
                      {section.image?.url || section.image2?.url ? (
                        <ImageTextBlock section={section} />
                      ) : (
                        <>
                          {section.heading && (
                            <Typography variant="h4" fontWeight={700} mb={section.subheading ? 0.5 : 2} sx={{ fontSize: { xs: 22, md: 30 }, textAlign: section.titleAlign || "left" }}>
                              {section.heading}
                            </Typography>
                          )}
                          {section.subheading && (
                            <Typography mb={2} sx={{ color: hasBg ? "rgba(255,255,255,0.85)" : "#71717a", textAlign: section.subtitleAlign || "left" }}>
                              {section.subheading}
                            </Typography>
                          )}
                          {section.description && <Typography mb={3} sx={{ lineHeight: 1.8, opacity: 0.9 }}>{section.description}</Typography>}
                        </>
                      )}

                      {section.content && (
                        <Box sx={{ lineHeight: 1.9, mb: 3, wordBreak: "break-word", "& img": { maxWidth: "100%", borderRadius: 2 } }}>
                          {section.content.includes("<") ? <div dangerouslySetInnerHTML={{ __html: section.content }} /> : <Typography>{section.content}</Typography>}
                        </Box>
                      )}

                      {section.images?.length > 0 && (
                        <Grid container spacing={2} mb={3}>
                          {section.images.map((img, i) => (
                            <Grid size={{ xs: 12, sm: 6, md: section.columns ? 12 / section.columns : 3 }} key={img.public_id || i}>
                              <LazyImage src={img.url} alt={img.alt || ""} objectFit={img.objectFit || "cover"} objectPosition={img.position || "center"} height={200} sx={{ border: "1px solid #e4e4e7" }} />
                            </Grid>
                          ))}
                        </Grid>
                      )}

                      {section.videoUrl && (
                        <Box sx={{ position: "relative", width: "100%", pt: "56.25%", borderRadius: 2, overflow: "hidden", mb: 3 }}>
                          <Box component="iframe" src={section.videoUrl} loading="lazy" allowFullScreen sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} />
                        </Box>
                      )}

                      {cardItems.length > 0 && (
                        isRowLayout ? (
                          <Box sx={{ display: "flex", gap: 2.5, overflowX: "auto", pb: 1, mb: 3, scrollSnapType: "x mandatory", "& > *": { flex: `0 0 calc(${100 / cardsPerRow}% - ${(2.5 * (cardsPerRow - 1)) / cardsPerRow}0px)`, minWidth: section.cardMinWidth || 220, scrollSnapAlign: "start" } }}>
                            {cardItems.map((card, i) => (
                              <CardItem
                                key={i}
                                card={card}
                                cardStyle={section.cardStyle}
                                cardImageShape={section.cardImageShape}
                                cardDirection={section.cardDirection}
                                cardImageSizeMode={section.cardImageSizeMode}
                                cardImageWidth={section.cardImageWidth}
                                cardImageHeight={section.cardImageHeight}
                                showCardHeading={section.showCardHeading}
                              />
                            ))}
                          </Box>
                        ) : (
                          <Grid container spacing={2.5} mb={3}>
                            {cardItems.map((card, i) => (
                              <Grid size={{ xs: 12, sm: 6, md: 12 / cardsPerRow }} sx={{ minWidth: { md: section.cardMinWidth || 220 } }} key={i}>
                                <CardItem
                                  card={card}
                                  cardStyle={section.cardStyle}
                                  cardImageShape={section.cardImageShape}
                                  cardDirection={section.cardDirection}
                                  cardImageSizeMode={section.cardImageSizeMode}
                                  cardImageWidth={section.cardImageWidth}
                                  cardImageHeight={section.cardImageHeight}
                                  showCardHeading={section.showCardHeading}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        )
                      )}

                      {faqItems.length > 0 && (
                        <Stack spacing={1.5} mb={3}>
                          {faqItems.map((faq, i) => (
                            <Box key={i} sx={{ p: 2.5, border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: hasBg ? "rgba(255,255,255,0.08)" : "#fff" }}>
                              {faq.question && <Typography fontWeight={700} mb={0.75} sx={{ fontSize: 15.5, color: hasBg ? "#fff" : "#18181b" }}>{faq.question}</Typography>}
                              {faq.answer && <Typography sx={{ fontSize: 14.5, color: hasBg ? "rgba(255,255,255,0.8)" : "#71717a", lineHeight: 1.7 }}>{faq.answer}</Typography>}
                            </Box>
                          ))}
                        </Stack>
                      )}

                      <SectionButton button={section.button} />
                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          )}

          {/* MAIN CTA */}

          {page.buttonText && (
            <Box sx={{ textAlign: "center", py: { xs: 1, md: 2 } }}>
              <Button
                component={Link}
                href={safeLink(page.buttonLink)}
                size="large"
                disableElevation
                sx={{ px: 5.5, py: 1.6, bgcolor: "#18181b", color: "#fff", borderRadius: "8px", fontWeight: 600, textTransform: "none", "&:hover": { bgcolor: "#27272a" } }}
              >
                {page.buttonText}
              </Button>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
