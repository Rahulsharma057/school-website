"use client";

import { useQuery } from "@tanstack/react-query";

import { getNavbar } from "@/services/navbarService";

export default function useNavbar() {
  return useQuery({
    queryKey: ["navbar"],
    queryFn: async () => {
      const res = await getNavbar();
      return res.data.data;
    },
  });
}