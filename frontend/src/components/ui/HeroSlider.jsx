"use client";

import { Box } from "@mui/material";
import { Navigation, Pagination, Autoplay, EffectFade } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

import usePublicSlider from "@/hooks/usePublicSlider";

import HeroSlide from "./HeroSlide";
import HeroSkeleton from "./HeroSkeleton";

export default function HeroSlider() {
  const { data: sliders = [], isLoading } = usePublicSlider();

  if (isLoading) return <HeroSkeleton />;

  if (!sliders.length) return null;

  return (
    <Box
      sx={{
        width: "100%",
        position: "relative",
        overflow: "hidden",

        "& .swiper": {
          width: "100%",
        },

        "& .swiper-button-next, & .swiper-button-prev": {
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: "rgba(0,0,0,.35)",
          color: "#fff",
          backdropFilter: "blur(8px)",
          transition: ".3s",

          "&:hover": {
            background: "rgba(0,0,0,.65)",
            transform: "scale(1.08)",
          },

          "&::after": {
            fontSize: 18,
            fontWeight: 700,
          },
        },

        "& .swiper-button-prev": {
          left: {
            xs: 10,
            md: 30,
          },
        },

        "& .swiper-button-next": {
          right: {
            xs: 10,
            md: 30,
          },
        },

        "& .swiper-pagination": {
          bottom: {
            xs: 15,
            md: 30,
          },
        },

        "& .swiper-pagination-bullet": {
          width: 10,
          height: 10,
          background: "#fff",
          opacity: 0.45,
          transition: ".3s",
        },

        "& .swiper-pagination-bullet-active": {
          width: 28,
          borderRadius: 20,
          opacity: 1,
          background: "#fff",
        },
      }}
    >
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        slidesPerView={1}
        loop
        effect="fade"
        speed={900}
        navigation
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
      >
        {sliders.map((slider) => (
          <SwiperSlide key={slider._id}>
            <HeroSlide slider={slider} />
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
