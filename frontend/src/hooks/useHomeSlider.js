"use client";

import { useQuery } from "@tanstack/react-query";
import { getSliders } from "@/services/homeSliderService";

export default function useHomeSlider({
  page = 1,
  limit = 10,
  search = "",
}) {
  return useQuery({
    queryKey: ["home-slider", page, limit, search],

    queryFn: async () => {
      const res = await getSliders({
        page,
        limit,
        search,
      });

      return res.data;
    },

    placeholderData: (previousData) => previousData,

    staleTime: 1000 * 60 * 5,
  });
}