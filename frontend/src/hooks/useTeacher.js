"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTeacher,
  getMyTeacherProfile,
  updateMyTeacherProfile,
  getAllTeachers,
  updateTeacherByAdmin,
  uploadTeacherAadhar,  uploadMyTeacherProfilePhoto,
} from "@/services/teacherService";
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

// UPDATE MY PROFILE (teacher khud — sirf self-editable fields: profilePhoto, bio)
export function useUpdateMyTeacherProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateMyTeacherProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["my-teacher-profile"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
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

// ADMIN — kisi bhi teacher ki admin-only fields update karo
export function useUpdateTeacherByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, data }) => updateTeacherByAdmin(teacherId, data),
    onSuccess: () => {
      toast.success("Teacher updated successfully");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update teacher");
    },
  });
}

// ADMIN — Aadhar card upload
export function useUploadTeacherAadhar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, formData }) => uploadTeacherAadhar(teacherId, formData),
    onSuccess: () => {
      toast.success("Aadhar card uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to upload Aadhar card");
    },
  });
}

// TEACHER — apni profile photo upload
export function useUploadMyTeacherProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) =>
      uploadMyTeacherProfilePhoto(formData),

    onSuccess: () => {
      toast.success("Profile photo uploaded successfully");

      queryClient.invalidateQueries({
        queryKey: ["my-teacher-profile"],
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