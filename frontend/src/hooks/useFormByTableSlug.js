"use client";

import { useQuery } from "@tanstack/react-query";

import { getFormByTableSlug } from "@/services/formService";

export default function useFormByTableSlug(tableSlug) {
  return useQuery({
    queryKey: ["form", "table", tableSlug],

    queryFn: async () => {
      const { data } = await getFormByTableSlug(tableSlug);
      return data;
    },

    enabled: Boolean(tableSlug),
  });
}