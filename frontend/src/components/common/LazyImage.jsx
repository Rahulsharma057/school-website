"use client";

import { useState } from "react";

import { Box, Skeleton } from "@mui/material";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";

export default function LazyImage({
  src,
  alt = "",
  aspectRatio,
  height,
  objectFit = "cover",
  objectPosition = "center",
  rounded = false,
  borderRadius,
  sx = {},
  onClick,
  ...imgProps
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: height || "auto",
        aspectRatio: !height ? aspectRatio || "auto" : undefined,
        overflow: "hidden",
        borderRadius:
          borderRadius !== undefined
            ? borderRadius
            : rounded
              ? 2
              : 0,
        bgcolor: "#f4f4f5",
        ...sx,
      }}
    >
      {!loaded && !errored && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      )}

      {!errored && src && (
        <Box
          component="img"
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          onClick={onClick}
          sx={{
            width: "100%",
            height: "100%",
            objectFit,
            objectPosition,
            display: "block",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.3s ease",
            cursor: onClick ? "pointer" : "default",
          }}
          {...imgProps}
        />
      )}

      {(errored || !src) && (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            minHeight: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            color: "#a1a1aa",
          }}
        >
          <BrokenImageIcon fontSize="small" />

          <Box
            component="span"
            sx={{
              fontSize: 11.5,
            }}
          >
            Image unavailable
          </Box>
        </Box>
      )}
    </Box>
  );
}