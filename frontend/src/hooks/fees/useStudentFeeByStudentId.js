"use client";

import { useQuery } from "@tanstack/react-query";

import { getStudentFeeByStudentId } from "@/services/studentFeeService";

// FIX: 404 here means "this student has no fee assigned yet" — a normal,
// expected state (not an error toast). react-query treats a thrown 404
// as `isError`, so the page consuming this decides how to render that
// case (e.g. "Assign Fee" prompt) rather than this hook swallowing it.
export const useStudentFeeByStudentId = (studentId) =>
  useQuery({
    queryKey: ["student-fee-by-student", studentId],
    queryFn: async () => (await getStudentFeeByStudentId(studentId)).data?.data,
    enabled: Boolean(studentId),
    retry: false,
  });