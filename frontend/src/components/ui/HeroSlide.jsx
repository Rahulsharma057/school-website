"use client";

import Link from "next/link";
import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

export default function HeroSlide({ slider }) {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: {
          xs: "75vh",
          md: "100vh",
        },

        backgroundImage: `url(${slider.image?.url})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,

          background:
            "linear-gradient(to right, rgba(9,9,11,.8) 0%, rgba(9,9,11,.5) 45%, rgba(9,9,11,.15) 100%)",
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 2,
        }}
      >
        <Stack
          spacing={3}
          sx={{
            maxWidth: 640,
            color: "#fff",
          }}
        >
          <Typography
            component="h1"
            fontWeight={700}
            sx={{
              fontSize: {
                xs: "1.9rem",
                sm: "2.6rem",
                md: "3.5rem",
              },
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            {slider.title}
          </Typography>

          <Typography
            sx={{
              fontSize: {
                xs: 15,
                md: 18,
              },
              color: "#e4e4e7",
              lineHeight: 1.7,
              maxWidth: 520,
            }}
          >
            {slider.description}
          </Typography>

          <Box>
            <Button
              component={Link}
              href={slider.buttonLink || "#"}
              size="large"
              disableElevation
              sx={{
                px: 4.5,
                py: 1.5,

                bgcolor: "#18181b",
                color: "#fff",

                borderRadius: "8px",
                fontWeight: 600,
                fontSize: 15,
                textTransform: "none",

                transition: "background-color .2s ease",

                "&:hover": {
                  bgcolor: "#27272a",
                },
              }}
            >
              {slider.buttonText || "Read More"}
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}