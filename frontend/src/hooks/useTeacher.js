"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTeacher, getMyTeacherProfile, getAllTeachers } from "@/services/teacherService";
//                                                    ^^^^^^^^^^^^^^ ye add karo
import { toast } from "react-toastify";

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createTeacher(data),
    onSuccess: () => {
      toast.success("Teacher created successfully");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create teacher");
    },
  });
}

export function useMyTeacherProfile() {
  return useQuery({
    queryKey: ["my-teacher-profile"],
    queryFn: async () => {
      const res = await getMyTeacherProfile();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAllTeachers() {
  return useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await getAllTeachers();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}