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
  deleteTeacherDocument,
  getMyTeacherDocuments,
  uploadMyTeacherDocument,
  deleteMyTeacherDocument,
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
      toast.success("Teacher created successfully");

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create teacher",
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
      const res = await getMyTeacherProfile();

      return res.data.data;
    },

    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

// ======================================================
// MY DOCUMENTS
// FIX: new — these hooks (and the backend endpoints behind them) didn't
// exist before. The self-profile page had no working way for a teacher
// to upload/view/delete their own documents.
// ======================================================

export function useMyTeacherDocuments(options = {}) {
  return useQuery({
    queryKey: ["my-teacher-documents"],

    queryFn: async () => {
      const res = await getMyTeacherDocuments();

      return res?.data?.data ?? {};
    },

    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,

    ...options,
  });
}

export function useUploadMyTeacherDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMyTeacherDocument,

    onSuccess: () => {
      toast.success("Document uploaded successfully");

      queryClient.invalidateQueries({ queryKey: ["my-teacher-documents"] });
      queryClient.invalidateQueries({ queryKey: ["my-teacher-profile"] });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to upload document",
      );
    },
  });
}

export function useDeleteMyTeacherDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId) => deleteMyTeacherDocument(documentId),

    onSuccess: () => {
      toast.success("Document removed successfully");

      queryClient.invalidateQueries({ queryKey: ["my-teacher-documents"] });
      queryClient.invalidateQueries({ queryKey: ["my-teacher-profile"] });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to remove document",
      );
    },
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
      toast.success("Profile updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["my-teacher-profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update profile",
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
      const res = await getAllTeachers();

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

      if (Array.isArray(res?.data?.teachers)) {
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

export function useTeacherById(teacherId, options = {}) {
  return useQuery({
    queryKey: ["teacher-profile", teacherId],

    queryFn: async () => {
      const res = await getTeacherById(teacherId);

      return res.data.data;
    },

    enabled: Boolean(teacherId) && options.enabled !== false,

    staleTime: 1000 * 60 * 2,
  });
}

// ======================================================
// ADMIN UPDATE
// ======================================================

export function useUpdateTeacherByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, data }) => updateTeacherByAdmin(teacherId, data),

    onSuccess: (_, variables) => {
      toast.success("Teacher updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-profile", variables.teacherId],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update teacher",
      );
    },
  });
}

// ======================================================
// DOCUMENT UPLOAD (admin)
// ======================================================

export function useUploadTeacherDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, formData }) =>
      uploadTeacherDocument(teacherId, formData),

    onSuccess: (_, variables) => {
      toast.success("Document uploaded successfully");

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });

      queryClient.invalidateQueries({
        queryKey: ["teacher-profile", variables.teacherId],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to upload document",
      );
    },
  });
}

// ======================================================
// DOCUMENT DELETE (admin)
// FIX: new — the backend delete-document endpoint had no hook wired up
// to it at all.
// ======================================================

export function useDeleteTeacherDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, documentType, documentId }) =>
      deleteTeacherDocument(teacherId, documentType, documentId),

    onSuccess: (_, variables) => {
      toast.success("Document removed successfully");

      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      queryClient.invalidateQueries({
        queryKey: ["teacher-profile", variables.teacherId],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to remove document",
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
    mutationFn: uploadMyTeacherProfilePhoto,

    onSuccess: () => {
      toast.success("Profile photo uploaded successfully");

      queryClient.invalidateQueries({
        queryKey: ["my-teacher-profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["teachers"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to upload profile photo",
      );
    },
  });
}
