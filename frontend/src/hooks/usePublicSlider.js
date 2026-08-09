"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicSliders } from "@/services/homeSliderService";

export default function usePublicSlider() {
  return useQuery({
    queryKey: ["public-home-slider"],

    queryFn: async () => {
      const res = await getPublicSliders();
      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: false,
  });
}