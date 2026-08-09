"use client";

import { useQuery } from "@tanstack/react-query";

import { getPublicNavbar } from "@/services/navbarService";

export default function usePublicNavbar() {
  return useQuery({
    queryKey: ["public-navbar"],

    queryFn: async () => {
      const res = await getPublicNavbar();

      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: false,
  });
}