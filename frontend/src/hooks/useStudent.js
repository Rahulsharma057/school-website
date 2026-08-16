"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentsByClass,
  updateStudentByAdmin,
  uploadStudentAadhar,uploadMyStudentProfilePhoto,
} from "@/services/studentService";
import { toast } from "react-toastify";

// CREATE STUDENT
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createStudent(data),
    onSuccess: () => {
      toast.success("Student created successfully");
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students-by-class"] });
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

// UPDATE MY PROFILE (student khud — sirf self-editable fields:
// bloodGroup, profilePhoto, bio)
export function useUpdateMyStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => updateMyStudentProfile(data),
    onSuccess: () => {
      toast.success("Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["my-student-profile"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
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

// ADMIN — kisi bhi student ki admin-only fields update karo
export function useUpdateStudentByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, data }) => updateStudentByAdmin(studentId, data),
    onSuccess: () => {
      toast.success("Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ["students-by-class"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update student");
    },
  });
}

// ADMIN — Aadhar card upload
export function useUploadStudentAadhar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, formData }) => uploadStudentAadhar(studentId, formData),
    onSuccess: () => {
      toast.success("Aadhar card uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["students-by-class"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to upload Aadhar card");
    },
  });
}

// STUDENT — apni profile photo upload
export function useUploadMyStudentProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) =>
      uploadMyStudentProfilePhoto(formData),

    onSuccess: () => {
      toast.success("Profile photo uploaded successfully");

      queryClient.invalidateQueries({
        queryKey: ["my-student-profile"],
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