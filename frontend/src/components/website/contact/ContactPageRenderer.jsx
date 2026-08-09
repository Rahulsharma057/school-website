"use client";

import { useEffect, useRef, useState } from "react";

import { Box, Container, Grid, Paper, Stack, Typography } from "@mui/material";

import CallIcon from "@mui/icons-material/Call";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";

import { getSocialIcon } from "@/lib/socialIcons";
import FormRenderer from "@/components/website/forms/FormRenderer";

const cleanNumberForWhatsapp = (number) => number.replace(/[^\d]/g, "");

// Map iframe is heavy — only mount it once the block is actually
// scrolled near the viewport, same lazy pattern used elsewhere.
function LazyMapEmbed({ src }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      ref={ref}
      sx={{ borderRadius: 2, overflow: "hidden", height: { xs: 180, md: 220 }, bgcolor: "#f4f4f5" }}
    >
      {visible && (
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location map"
        />
      )}
    </Box>
  );
}

export default function ContactPageRenderer({ page, contactForm }) {
  const primaryColor = page.layout?.primaryColor || "#18181b";
  const isStacked = page.layout?.style === "stacked";

  const visibleAddresses = (page.addresses || []).filter((a) => a.showOnPage !== false);

  const detailsBlock = (
    <Stack spacing={3}>
      {visibleAddresses.length > 0 && (
        <Stack spacing={2}>
          {visibleAddresses.map((a) => (
            <Box key={a.id}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOnIcon sx={{ color: primaryColor, fontSize: 20, mt: 0.3, flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#18181b" }}>{a.label}</Typography>
                  <Typography sx={{ fontSize: 13.5, color: "#71717a", wordBreak: "break-word" }}>
                    {a.addressLine}
                  </Typography>
                </Box>
              </Stack>
              {a.mapEmbedUrl && (
                <Box mt={1.5}>
                  <LazyMapEmbed src={a.mapEmbedUrl} />
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      {page.phones?.length > 0 && (
        <Stack spacing={1.2}>
          {page.phones.map((p) => (
            <Stack
              key={p.id}
              direction="row"
              flexWrap="wrap"
              rowGap={1}
              alignItems="center"
              justifyContent="space-between"
              sx={{ p: 1.2, border: "1px solid #e4e4e7", borderRadius: 1.5 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>{p.label}</Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b", wordBreak: "break-word" }}>
                  {p.number}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                {p.enableCall !== false && (
                  <Box
                    component="a"
                    href={`tel:${p.number}`}
                    aria-label="Call"
                    sx={{
                      display: "flex", p: 1, borderRadius: "50%", bgcolor: "#f4f4f5", color: "#18181b",
                      "&:hover": { bgcolor: primaryColor, color: "#fff" },
                    }}
                  >
                    <CallIcon fontSize="small" />
                  </Box>
                )}
                {p.enableWhatsapp !== false && (
                  <Box
                    component="a"
                    href={`https://wa.me/${cleanNumberForWhatsapp(p.number)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    sx={{
                      display: "flex", p: 1, borderRadius: "50%", bgcolor: "#f4f4f5", color: "#25D366",
                      "&:hover": { bgcolor: "#25D366", color: "#fff" },
                    }}
                  >
                    <WhatsAppIcon fontSize="small" />
                  </Box>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      {page.emails?.length > 0 && (
        <Stack spacing={1.2}>
          {page.emails.map((e) => (
            <Stack
              key={e.id}
              component="a"
              href={`mailto:${e.address}`}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                p: 1.2, border: "1px solid #e4e4e7", borderRadius: 1.5, textDecoration: "none",
                "&:hover": { borderColor: primaryColor },
              }}
            >
              <EmailIcon sx={{ color: primaryColor, fontSize: 20, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, color: "#a1a1aa" }}>{e.label}</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#18181b", wordBreak: "break-word" }}>
                  {e.address}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}

      {page.socialLinks?.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
          {page.socialLinks.map((s) => {
            const Icon = getSocialIcon(s.platform);
            return (
              <Box
                key={s.id}
                component="a"
                href={s.url}
                target="_blank"
                rel="noreferrer"
                aria-label={s.platform}
                sx={{
                  display: "flex", p: 1.2, borderRadius: "50%", bgcolor: "#f4f4f5", color: "#18181b",
                  "&:hover": { bgcolor: primaryColor, color: "#fff" },
                }}
              >
                <Icon fontSize="small" />
              </Box>
            );
          })}
        </Stack>
      )}
    </Stack>
  );

  const formBlock = contactForm ? (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
      <FormRenderer form={contactForm} />
    </Paper>
  ) : null;

  return (
    <Box sx={{ background: "#fafafa", minHeight: "100vh" }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 8 } }}>
        <Box mb={5}>
          <Typography variant="h4" fontWeight={700} sx={{ color: "#18181b", fontSize: { xs: 26, md: 34 } }}>
            {page.title}
          </Typography>
          {page.subtitle && <Typography sx={{ color: "#71717a", mt: 1 }}>{page.subtitle}</Typography>}
        </Box>

        {isStacked ? (
          <Stack spacing={4}>
            <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
              {detailsBlock}
            </Paper>
            {formBlock}
          </Stack>
        ) : (
          <Grid container spacing={4}>
            {/* FIX: without a form, this used to stay locked at md=5 and
                leave an empty gap on the right — now it takes the full
                width whenever there's no form to sit beside it. */}
            <Grid item xs={12} md={formBlock ? 5 : 12}>
              <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, border: "1px solid #e4e4e7" }}>
                {detailsBlock}
              </Paper>
            </Grid>
            {formBlock && (
              <Grid item xs={12} md={7}>
                {formBlock}
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
