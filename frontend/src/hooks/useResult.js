"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { enterResult, getMyResults, getClassResults, downloadResultTemplate, bulkEnterResults } from "@/services/resultService";
import { toast } from "react-toastify";

export function useEnterResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => enterResult(data),
    onSuccess: () => {
      toast.success("Result saved successfully");
      queryClient.invalidateQueries({ queryKey: ["class-results"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to save result");
    },
  });
}

export function useMyResults() {
  return useQuery({
    queryKey: ["my-results"],
    queryFn: async () => {
      const res = await getMyResults();
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useClassResults(examId) {
  return useQuery({
    queryKey: ["class-results", examId],
    queryFn: async () => {
      const res = await getClassResults(examId);
      return res.data.data;
    },
    enabled: !!examId,
  });
}

function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function safeFilename(value = "template") {
  return String(value).trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase() || "template";
}

export function useDownloadResultTemplate() {
  return useMutation({
    mutationFn: async ({ examId, examName }) => {
      const res = await downloadResultTemplate(examId);
      triggerBlobDownload(res.data, `${safeFilename(examName)}_template.xlsx`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to download template");
    },
  });
}

// Defense-in-depth: ExcelResultImportExport already blocks invalid rows the
// moment the file is parsed, but this re-checks right before the network
// call too — in case `records` was ever built or mutated by something else
// upstream. Pass `subjects` ([{ subject, maxMarks }]) alongside `records`
// when calling this mutation so it has something to validate against; if
// `subjects` isn't provided, validation is skipped rather than guessed at.
function findInvalidRecords(records, subjects) {
  if (!Array.isArray(subjects) || !subjects.length) return [];

  const maxBySubject = new Map(subjects.map((s) => [s.subject, s.maxMarks]));
  const invalid = [];

  (records || []).forEach((record) => {
    (record.marks || []).forEach((m) => {
      const max = maxBySubject.get(m.subject);
      if (max === undefined) return;

      const value = Number(m.marksObtained);

      if (Number.isNaN(value) || value < 0 || value > max) {
        invalid.push({
          student: record.studentName || record.studentId || "Unknown",
          subject: m.subject,
          value: m.marksObtained,
          max,
        });
      }
    });
  });

  return invalid;
}

export function useBulkEnterResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ examId, records, subjects }) => {
      const invalid = findInvalidRecords(records, subjects);

      if (invalid.length > 0) {
        const first = invalid[0];

        const message =
          invalid.length === 1
            ? `${first.student} — ${first.subject}: ${first.value} exceeds max marks (${first.max})`
            : `${invalid.length} entries exceed their subject's max marks (e.g. ${first.student} — ${first.subject}: ${first.value}/${first.max})`;

        const validationError = new Error(message);
        validationError.isClientValidation = true;
        throw validationError;
      }

      return bulkEnterResults({ examId, records });
    },
    onSuccess: (res) => {
      toast.success(res?.data?.message || "Results imported successfully");
      queryClient.invalidateQueries({ queryKey: ["class-results"] });
    },
    onError: (error) => {
      if (error?.isClientValidation) {
        toast.error(error.message);
        return;
      }

      toast.error(error.response?.data?.message || "Failed to import results");
    },
  });
}