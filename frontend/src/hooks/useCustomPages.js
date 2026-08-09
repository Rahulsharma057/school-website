"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { getPages } from "@/services/customPageService";

export default function useCustomPages(params) {
  return useQuery({
    queryKey: ["custom-pages", params],

    queryFn: async () => {
      const { data } = await getPages(params);

      return data;
    },

    placeholderData: keepPreviousData,
  });
}