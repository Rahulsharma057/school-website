"use client";

import { useMutation } from "@tanstack/react-query";
import { exportTeacherAttendance, exportTeacherSalary } from "@/services/exportService";
import { toast } from "react-toastify";

const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export function useExportAttendance() {
  return useMutation({
    mutationFn: async (params) => {
      const res = await exportTeacherAttendance(params);
      downloadFile(res.data, `attendance-${params.month}-${params.year}.xlsx`);
    },
    onError: () => toast.error("Failed to export attendance"),
  });
}

export function useExportSalary() {
  return useMutation({
    mutationFn: async (params) => {
      const res = await exportTeacherSalary(params);
      downloadFile(res.data, `salary-${params.year}.xlsx`);
    },
    onError: () => toast.error("Failed to export salary"),
  });
}