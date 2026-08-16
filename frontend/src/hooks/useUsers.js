"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAllUsers,
  changeUserRole,
  changeUserStatus,
  updateUserCoreInfo,
  deleteUser,
} from "@/services/userManagementService";

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
    mutationFn: ({ id, role }) =>
      changeUserRole(id, role),

    onSuccess: () => {
      toast.success("Role updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update role"
      );
    },
  });
}

// CHANGE STATUS
export function useChangeUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }) =>
      changeUserStatus(id, isActive),

    onSuccess: () => {
      toast.success("Status updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update status"
      );
    },
  });
}

// UPDATE CORE INFO
export function useUpdateUserCoreInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) =>
      updateUserCoreInfo(id, data),

    onSuccess: () => {
      toast.success("User info updated successfully");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },

    onError: (error) => {
      toast.error(
        error.response?.data?.message ||
          "Failed to update user info"
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
      toast.error(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    },
  });
}