"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStudent, getMyStudentProfile, getStudentsByClass } from "@/services/studentService";
//                                                    ^^^^^^^^^^^^^^^^^^ ye add karo
import { toast } from "react-toastify";

// CREATE STUDENT
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createStudent(data),
    onSuccess: () => {
      toast.success("Student created successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create student");
    },
  });
}

// GET MY PROFILE (student khud)
export function useMyStudentProfile() {
  return useQuery({
    queryKey: ["my-student-profile"],
    queryFn: async () => {
      const res = await getMyStudentProfile();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useStudentsByClass(classId) {
  return useQuery({
    queryKey: ["students-by-class", classId],
    queryFn: async () => {
      const res = await getStudentsByClass(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });
}