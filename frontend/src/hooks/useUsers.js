"use client";

import { useQuery } from "@tanstack/react-query";

import { getAllUsers } from "@/services/userManagementService";

export default function useUsers(params = {}) {
  return useQuery({
    queryKey: ["users", params],

    queryFn: async () => {
      const res = await getAllUsers(params);

      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: false,
  });
}
