"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  markAttendance,
  updateAttendance,
  getClassAttendance,
  getStudentAttendance,
  getMyAttendance,
} from "@/services/attendanceService";

import { toast } from "react-toastify";

// =====================================================
// MARK ATTENDANCE
// =====================================================

export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAttendance,

    onSuccess: () => {
      toast.success("Attendance marked successfully");

      queryClient.invalidateQueries({
        queryKey: ["class-attendance"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to mark attendance",
      );
    },
  });
}

// =====================================================
// UPDATE ATTENDANCE
// =====================================================

export function useUpdateAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAttendance,

    onSuccess: () => {
      toast.success("Attendance updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["class-attendance"],
      });
    },

    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to update attendance",
      );
    },
  });
}

// =====================================================
// CLASS ATTENDANCE
// =====================================================

export function useClassAttendance(classId, date, enabled = true) {
  return useQuery({
    queryKey: ["class-attendance", classId, date],

    queryFn: async () => {
      try {
        const res = await getClassAttendance(classId, date);

        return res.data.data;
      } catch (error) {
        // Attendance doesn't exist for this date.
        // This should not break the page.
        if (error?.response?.status === 404) {
          return null;
        }

        throw error;
      }
    },

    enabled: Boolean(classId) && Boolean(date) && enabled,

    retry: false,

    staleTime: 1000 * 30,
  });
}

// =====================================================
// STUDENT ATTENDANCE
// =====================================================

export function useStudentAttendance(
  studentId,
  classId,
  from,
  to,
  enabled = false,
) {
  return useQuery({
    queryKey: ["student-attendance", studentId, classId, from, to],

    queryFn: async () => {
      const res = await getStudentAttendance(studentId, classId, from, to);

      return res.data.data;
    },

    enabled: Boolean(studentId) && Boolean(classId) && enabled,

    retry: false,
  });
}

// =====================================================
// MY ATTENDANCE
// =====================================================

export function useMyAttendance() {
  return useQuery({
    queryKey: ["my-attendance"],

    queryFn: async () => {
      const res = await getMyAttendance();

      const data = res?.data?.data;

      return {
        presentCount: Number(data?.presentCount ?? 0),
        totalCount: Number(data?.totalCount ?? 0),
        attendance: Array.isArray(data?.attendance)
          ? data.attendance
          : [],
      };
    },

    staleTime: 1000 * 60 * 5,
  });
}
