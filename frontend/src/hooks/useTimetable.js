"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTimetableEntry, updateTimetableEntry, deleteTimetableEntry,
  getClassTimetable, getMyTimetable, getMyClassTimetable,
} from "@/services/timetableService";
import { toast } from "react-toastify";

export function useClassTimetable(classId) {
  return useQuery({
    queryKey: ["class-timetable", classId],
    queryFn: async () => (await getClassTimetable(classId)).data.data,
    enabled: !!classId,
  });
}

export function useMyTimetable() {
  return useQuery({
    queryKey: ["my-timetable"],
    queryFn: async () => (await getMyTimetable()).data.data,
  });
}

export function useMyClassTimetable() {
  return useQuery({
    queryKey: ["my-class-timetable"],
    queryFn: async () => (await getMyClassTimetable()).data.data,
  });
}

// NOTE: mutate function ka response direct return karna hai (reject nahi), taaki 409 conflict
// ko component khud handle kar sake (toast ke bajaye dialog dikhana hai override ke liye)
export function useCreateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createTimetableEntry(data),
    onSuccess: () => {
      toast.success("Timetable entry added");
      qc.invalidateQueries({ queryKey: ["class-timetable"] });
    },
    // onError yahan generic toast nahi karenge — component 409 ko specially handle karega
  });
}

export function useUpdateTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateTimetableEntry(id, data),
    onSuccess: () => {
      toast.success("Timetable entry updated");
      qc.invalidateQueries({ queryKey: ["class-timetable"] });
    },
  });
}

export function useDeleteTimetableEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteTimetableEntry(id),
    onSuccess: () => {
      toast.success("Entry removed");
      qc.invalidateQueries({ queryKey: ["class-timetable"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });
}