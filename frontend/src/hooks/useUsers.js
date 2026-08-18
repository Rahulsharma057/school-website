"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getAllUsers,
  changeUserRole,
  changeUserStatus,
  updateUserCoreInfo,
  deleteUser,
} from "@/services/userManagementService";

import { useTeacherById } from "@/hooks/useTeacher";
import { useStudentById } from "@/hooks/useStudent";

import { toast } from "react-toastify";

// GET ALL USERS
export function useUsers({ search = "" } = {}) {
  return useQuery({
    queryKey: ["users", search],

    queryFn: async () => {
      const res = await getAllUsers({
        search,
      });

      return res.data.data;
    },

    staleTime: 1000 * 60 * 2,
  });
}

// CHANGE ROLE
export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }) => changeUserRole(id, role),

    onSuccess: () => {
      toast.success("Role updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    },
  });
}

// CHANGE STATUS
export function useChangeUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) => changeUserStatus(id, isActive),

    onSuccess: () => {
      toast.success("Status updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
}

// UPDATE CORE INFO
export function useUpdateUserCoreInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateUserCoreInfo(id, data),

    onSuccess: () => {
      toast.success("User info updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update user info",
      );
    },
  });
}

// DELETE USER
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteUser(id),

    onSuccess: () => {
      toast.success("User deleted successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });
}

// VIEW FULL PROFILE — admin/super-admin ke liye. user.role ke hisab se
// teacher ya student ka poora profile fetch karta hai (Aadhar, parent,
// employeeId, category, etc.) — Users page ke modal me use hoga.
// PARENT/ADMIN/SUPER_ADMIN roles ke liye extended profile nahi hai,
// unke liye { data: null } return hota hai.
export function useUserFullProfile(user) {
  const role = user?.role;
  const id = user?._id;

  const teacherQuery = useTeacherById(role === "TEACHER" ? id : null);
  const studentQuery = useStudentById(role === "STUDENT" ? id : null);

  if (role === "TEACHER") return teacherQuery;
  if (role === "STUDENT") return studentQuery;

  return { data: null, isLoading: false, isError: false };
}
