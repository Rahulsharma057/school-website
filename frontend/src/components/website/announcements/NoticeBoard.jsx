"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import PushPinIcon from "@mui/icons-material/PushPin";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Link from "next/link";
import { getPublicTicker } from "@/services/announcementService";
const TYPE_COLOR = {
  general: "#71717a",
  notice: "#2563eb",
  event: "#16a34a",
  urgent: "#dc2626",
};
const TYPE_LABEL = {
  general: "General",
  notice: "Notice",
  event: "Event",
  urgent: "Urgent",
};
const formatDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
export default function NoticeBoard({
  placement = "notice-board",
  title = "Notices & Updates",
  height = 300,
}) {
  const router = useRouter();
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  /* * Lazy load: * API tabhi call hogi jab Notice Board viewport * ke paas aa jayega. */ useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  /* * Fetch announcements */ useEffect(() => {
    if (!isVisible || loaded) return;
    let cancelled = false;
    const fetchAnnouncements = async () => {
      try {
        const res = await getPublicTicker(placement);
        if (!cancelled) {
          setItems(res?.data?.data || []);
        }
      } catch (error) {
        console.error("Notice board error:", error);
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoaded(true);
        }
      }
    };
    fetchAnnouncements();
    return () => {
      cancelled = true;
    };
  }, [isVisible, loaded, placement]);
  /* * Handle notice click */ const handleClick = (item) => {
    if (item?.link?.type === "external" && item?.link?.url) {
      window.open(item.link.url, "_blank", "noopener,noreferrer");
      return;
    }
    if (item?.link?.type === "internal" && item?.link?.url) {
      router.push(item.link.url);
      return;
    }
    if (item?.slug) {
      router.push(`/announcements/${item.slug}`);
    }
  };
  /* * Don't render anything when API has no data. */ if (
    loaded &&
    items.length === 0
  ) {
    return null;
  }
  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        border: "1px solid #e4e4e7",
        borderRadius: "12px",
        backgroundColor: "#fff",
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
      }}
    >
      {" "}
      {/* ================= HEADER ================= */}{" "}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: { xs: 1.5, sm: 2 },
          py: 1.4,
          background: "linear-gradient(135deg, #18181b 0%, #27272a 100%)",
        }}
      >
        {" "}
        <Stack direction="row" alignItems="center" spacing={1}>
          {" "}
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#C9A96E",
              boxShadow: "0 0 0 4px rgba(201,169,110,0.12)",
            }}
          />{" "}
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: 13.5, sm: 15 },
              letterSpacing: 0.1,
            }}
          >
            {" "}
            {title}{" "}
          </Typography>{" "}
        </Stack>{" "}
        <Button
          component={Link}
          href="/notices"
          endIcon={<ArrowForwardIcon sx={{ fontSize: "15px !important" }} />}
          size="small"
          sx={{
            color: "#C9A96E",
            textTransform: "none",
            fontSize: { xs: 11.5, sm: 12.5 },
            fontWeight: 600,
            minWidth: "auto",
            p: 0.3,
            "&:hover": { backgroundColor: "rgba(201,169,110,0.08)" },
          }}
        >
          {" "}
          View All{" "}
        </Button>{" "}
      </Stack>{" "}
      {/* ================= NOTICE AREA ================= */}{" "}
      <Box
        sx={{
          height: { xs: Math.min(height, 280), sm: height },
          overflowY: "auto",
          overflowX: "hidden",
          /* * Smooth scrolling */ scrollBehavior: "smooth",
          /* * Custom scrollbar - Chrome / Edge */ "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": { backgroundColor: "#f4f4f5" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c4c4c8",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#99999f" },
          /* * Firefox */ scrollbarWidth: "thin",
          scrollbarColor: "#c4c4c8 #f4f4f5",
        }}
      >
        {" "}
        {/* ================= LOADING ================= */}{" "}
        {!isVisible || loading ? (
          <Stack spacing={1.5} sx={{ p: 2 }}>
            {" "}
            {Array.from({ length: 4 }).map((_, index) => (
              <Box
                key={index}
                sx={{
                  pb: 1.5,
                  borderBottom: index !== 3 ? "1px solid #f4f4f5" : "none",
                }}
              >
                {" "}
                <Skeleton variant="text" width="30%" height={18} />{" "}
                <Skeleton variant="text" width="95%" height={22} />{" "}
                <Skeleton variant="text" width="75%" height={22} />{" "}
              </Box>
            ))}{" "}
          </Stack>
        ) : (
          <Stack>
            {" "}
            {items.map((item, index) => {
              const typeColor = TYPE_COLOR[item?.type] || TYPE_COLOR.general;
              return (
                <Box
                  key={item?._id || index}
                  onClick={() => handleClick(item)}
                  sx={{
                    position: "relative",
                    px: { xs: 1.5, sm: 2 },
                    py: 1.5,
                    borderBottom:
                      index !== items.length - 1 ? "1px solid #f1f1f3" : "none",
                    cursor: "pointer",
                    transition:
                      "background-color 0.2s ease, transform 0.2s ease",
                    "&:hover": { backgroundColor: "#fafafa" },
                    "&:hover .notice-title": { color: "#111827" },
                  }}
                >
                  {" "}
                  {/* LEFT ACCENT */}{" "}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      backgroundColor: typeColor,
                      opacity: 0,
                      transition: "opacity 0.2s ease",
                    }}
                    className="notice-accent"
                  />{" "}
                  <Stack spacing={0.65}>
                    {" "}
                    {/* TOP META */}{" "}
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={1}
                    >
                      {" "}
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={0.7}
                        sx={{ minWidth: 0 }}
                      >
                        {" "}
                        <CircleIcon
                          sx={{ fontSize: 7, color: typeColor, flexShrink: 0 }}
                        />{" "}
                        <Typography
                          sx={{
                            fontSize: 10.5,
                            color: "#a1a1aa",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {" "}
                          {formatDate(item?.startDate)}{" "}
                        </Typography>{" "}
                        {item?.type && (
                          <>
                            {" "}
                            <Typography sx={{ color: "#d4d4d8", fontSize: 10 }}>
                              {" "}
                              •{" "}
                            </Typography>{" "}
                            <Typography
                              sx={{
                                fontSize: 10.5,
                                color: typeColor,
                                fontWeight: 600,
                              }}
                            >
                              {" "}
                              {TYPE_LABEL[item.type] || item.type}{" "}
                            </Typography>{" "}
                          </>
                        )}{" "}
                      </Stack>{" "}
                      {/* PIN */}{" "}
                      {item?.pinned && (
                        <PushPinIcon
                          sx={{
                            fontSize: 14,
                            color: "#C9A96E",
                            transform: "rotate(45deg)",
                            flexShrink: 0,
                          }}
                        />
                      )}{" "}
                    </Stack>{" "}
                    {/* TITLE */}{" "}
                    <Typography
                      className="notice-title"
                      sx={{
                        fontSize: { xs: 13, sm: 13.5 },
                        color: "#27272a",
                        fontWeight: 600,
                        lineHeight: 1.45,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        transition: "color 0.2s ease",
                      }}
                    >
                      {" "}
                      {item?.tickerText || item?.title}{" "}
                    </Typography>{" "}
                    {/* DESCRIPTION */}{" "}
                    {item?.shortDescription && (
                      <Typography
                        sx={{
                          fontSize: 11.5,
                          color: "#71717a",
                          lineHeight: 1.45,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {" "}
                        {item.shortDescription}{" "}
                      </Typography>
                    )}{" "}
                  </Stack>{" "}
                </Box>
              );
            })}{" "}
          </Stack>
        )}{" "}
      </Box>{" "}
      {/* ================= BOTTOM SCROLL INDICATOR ================= */}{" "}
      {!loading && items.length > 4 && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 0.5,
            borderTop: "1px solid #f4f4f5",
            backgroundColor: "#fafafa",
          }}
        >
          {" "}
          <KeyboardArrowDownIcon sx={{ fontSize: 18, color: "#a1a1aa" }} />{" "}
          <Typography sx={{ fontSize: 10, color: "#a1a1aa" }}>
            {" "}
            Scroll for more{" "}
          </Typography>{" "}
        </Stack>
      )}{" "}
    </Box>
  );
}
