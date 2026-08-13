"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExam, getExamsByClass } from "@/services/examService";
import { toast } from "react-toastify";

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createExam(data),
    onSuccess: () => {
      toast.success("Exam created successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create exam");
    },
  });
}

export function useExamsByClass(classId) {
  return useQuery({
    queryKey: ["exams", classId],
    queryFn: async () => {
      const res = await getExamsByClass(classId);
      return res.data.data;
    },
    enabled: !!classId,
  });
}