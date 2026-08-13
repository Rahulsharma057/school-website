"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  markTeacherAttendance,
  getTeacherAttendanceByMonth,
} from "@/services/teacherAttendanceService";
import { toast } from "react-toastify";

export function useMarkTeacherAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => markTeacherAttendance(data),
    onSuccess: () => {
      toast.success("Attendance marked successfully");
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to mark attendance");
    },
  });
}

export function useTeacherAttendanceByMonth(params) {
  return useQuery({
    queryKey: ["teacher-attendance", params],
    queryFn: async () => {
      const res = await getTeacherAttendanceByMonth(params);
      return res.data.data;
    },
    enabled: !!params?.month && !!params?.year,
  });
}