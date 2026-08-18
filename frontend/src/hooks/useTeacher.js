"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTeacher,
  getMyTeacherProfile,
  updateMyTeacherProfile,
  getAllTeachers,
  getTeacherById,
  updateTeacherByAdmin,
  uploadTeacherDocument,
  uploadMyTeacherProfilePhoto,
} from "@/services/teacherService";

import { toast } from "react-toastify";

// ======================================================
// CREATE TEACHER
// ======================================================

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,

    onSuccess: () => {
      toast.success(
        "Teacher created successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to create teacher"
      );
    },
  });
}

// ======================================================
// MY PROFILE
// ======================================================

export function useMyTeacherProfile() {
  return useQuery({
    queryKey: ["my-teacher-profile"],

    queryFn: async () => {
      const res =
        await getMyTeacherProfile();

      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// ======================================================
// UPDATE MY PROFILE
// ======================================================

export function useUpdateMyTeacherProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyTeacherProfile,

    onSuccess: () => {
      toast.success(
        "Profile updated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["my-teacher-profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update profile"
      );
    },
  });
}

// ======================================================
// ALL TEACHERS
// ======================================================

export function useAllTeachers() {
  return useQuery({
    queryKey: ["teachers"],

    queryFn: async () => {
      const res =
        await getAllTeachers();

      const data = res?.data?.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.teachers)) {
        return data.teachers;
      }

      if (Array.isArray(data?.data)) {
        return data.data;
      }

      if (
        Array.isArray(
          res?.data?.teachers
        )
      ) {
        return res.data.teachers;
      }

      return [];
    },

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// ======================================================
// GET TEACHER BY ID
// ======================================================

export function useTeacherById(
  teacherId,
  options = {}
) {
  return useQuery({
    queryKey: [
      "teacher-profile",
      teacherId,
    ],

    queryFn: async () => {
      const res =
        await getTeacherById(
          teacherId
        );

      return res.data.data;
    },

    enabled:
      Boolean(teacherId) &&
      options.enabled !== false,

    staleTime: 1000 * 60 * 2,
  });
}

// ======================================================
// ADMIN UPDATE
// ======================================================

export function useUpdateTeacherByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      data,
    }) =>
      updateTeacherByAdmin(
        teacherId,
        data
      ),

    onSuccess: (_, variables) => {
      toast.success(
        "Teacher updated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "teacher-profile",
          variables.teacherId,
        ],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update teacher"
      );
    },
  });
}

// ======================================================
// DOCUMENT UPLOAD
// ======================================================

export function useUploadTeacherDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      teacherId,
      formData,
    }) =>
      uploadTeacherDocument(
        teacherId,
        formData
      ),

    onSuccess: (_, variables) => {
      toast.success(
        "Document uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "teacher-profile",
          variables.teacherId,
        ],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload document"
      );
    },
  });
}

// ======================================================
// MY PROFILE PHOTO
// ======================================================

export function useUploadMyTeacherProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn:
      uploadMyTeacherProfilePhoto,

    onSuccess: () => {
      toast.success(
        "Profile photo uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey: [
          "my-teacher-profile",
        ],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to upload profile photo"
      );
    },
  });
}