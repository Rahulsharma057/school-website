
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createExam,
  getAllExams,
  getSchoolExams,
  getCollegeExams,
  getCollegeSemesterStructure,
  getExamById,
  updateExam,
  deleteExam,
} from "@/services/examService";

import { toast } from "react-toastify";

// =====================================================
// QUERY KEYS
// =====================================================

export const examKeys = {
  all: ["exams"],

  lists: () => [
    ...examKeys.all,
    "list",
  ],

  allList: (params = {}) => [
    ...examKeys.lists(),
    "all",
    params,
  ],

  school: (classId, params = {}) => [
    ...examKeys.lists(),
    "school",
    classId,
    params,
  ],

  college: (
    programId,
    semester,
    params = {}
  ) => [
    ...examKeys.lists(),
    "college",
    programId,
    semester,
    params,
  ],

  semesterStructure: (programId) => [
    ...examKeys.all,
    "semester-structure",
    programId,
  ],

  details: () => [
    ...examKeys.all,
    "detail",
  ],

  detail: (examId) => [
    ...examKeys.details(),
    examId,
  ],
};

// =====================================================
// ERROR HELPER
// =====================================================

const getErrorMessage = (
  error,
  fallback = "Something went wrong"
) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

// =====================================================
// GET ALL
// =====================================================

export const useAllExams = (
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: examKeys.allList(params),

    queryFn: () => getAllExams(params),

    enabled:
      options.enabled !== false,

    staleTime: 1000 * 60 * 5,

    ...options,
  });
};

// =====================================================
// SCHOOL EXAMS
// =====================================================

export const useSchoolExams = (
  classId,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: examKeys.school(
      classId,
      params
    ),

    queryFn: () =>
      getSchoolExams(
        classId,
        params
      ),

    enabled:
      Boolean(classId) &&
      options.enabled !== false,

    staleTime: 1000 * 60 * 5,

    ...options,
  });
};

// =====================================================
// ALIAS
// =====================================================

export const useExamsByClass = (
  classId,
  params = {},
  options = {}
) => {
  return useSchoolExams(
    classId,
    params,
    options
  );
};

// =====================================================
// COLLEGE EXAMS
// =====================================================

export const useCollegeExams = (
  programId,
  semester,
  params = {},
  options = {}
) => {
  return useQuery({
    queryKey: examKeys.college(
      programId,
      semester,
      params
    ),

    queryFn: () =>
      getCollegeExams(
        programId,
        semester,
        params
      ),

    enabled:
      Boolean(programId) &&
      Boolean(semester) &&
      options.enabled !== false,

    staleTime: 1000 * 60 * 5,

    ...options,
  });
};

// =====================================================
// SEMESTER STRUCTURE
// =====================================================

export const useCollegeSemesterStructure = (
  programId,
  options = {}
) => {
  return useQuery({
    queryKey:
      examKeys.semesterStructure(
        programId
      ),

    queryFn: () =>
      getCollegeSemesterStructure(
        programId
      ),

    enabled:
      Boolean(programId) &&
      options.enabled !== false,

    staleTime: 1000 * 60 * 10,

    ...options,
  });
};

// =====================================================
// SINGLE EXAM
// =====================================================

export const useExam = (
  examId,
  options = {}
) => {
  return useQuery({
    queryKey:
      examKeys.detail(examId),

    queryFn: () =>
      getExamById(examId),

    enabled:
      Boolean(examId) &&
      options.enabled !== false,

    staleTime: 1000 * 60 * 5,

    ...options,
  });
};

// =====================================================
// CREATE
// =====================================================

export const useCreateExam = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: createExam,

    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: examKeys.all,
      });

      toast.success(
        response?.message ||
          "Exam created successfully"
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to create exam"
        )
      );
    },
  });
};

// =====================================================
// UPDATE
// =====================================================

export const useUpdateExam = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: updateExam,

    onSuccess: (
      response,
      variables
    ) => {
      queryClient.invalidateQueries({
        queryKey: examKeys.all,
      });

      const examId =
        variables?.examId;

      if (examId) {
        queryClient.invalidateQueries({
          queryKey:
            examKeys.detail(
              examId
            ),
        });
      }

      toast.success(
        response?.message ||
          "Exam updated successfully"
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to update exam"
        )
      );
    },
  });
};

// =====================================================
// DELETE
// =====================================================

export const useDeleteExam = () => {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: deleteExam,

    onSuccess: (
      response,
      examId
    ) => {
      queryClient.invalidateQueries({
        queryKey: examKeys.all,
      });

      if (examId) {
        queryClient.removeQueries({
          queryKey:
            examKeys.detail(
              examId
            ),
        });
      }

      toast.success(
        response?.message ||
          "Exam deleted successfully"
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to delete exam"
        )
      );
    },
  });
};

// =====================================================
// MANUAL INVALIDATION
// =====================================================

export const invalidateSchoolExams = async (
  queryClient,
  classId
) => {
  if (!queryClient) {
    return;
  }

  if (classId) {
    await queryClient.invalidateQueries({
      queryKey:
        examKeys.school(
          classId
        ),
    });

    return;
  }

  await queryClient.invalidateQueries({
    queryKey: examKeys.all,
  });
};

