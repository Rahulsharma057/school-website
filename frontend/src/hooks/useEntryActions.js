"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  updateEntryStatus,
  deleteEntry,
  restoreEntry,
  permanentlyDeleteEntry,
  duplicateEntry,
  bulkEntryAction,
  exportEntriesCSV,
} from "@/services/formEntryService";

export const STATUS_STYLES = {
  pending: { bg: "#fef3c7", color: "#b45309", label: "Pending" },
  approved: { bg: "#dcfce7", color: "#15803d", label: "Approved" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
  archived: { bg: "#f4f4f5", color: "#71717a", label: "Archived" },
};

export const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Shared entry-action mutations (status change, trash/restore, permanent
 * delete, duplicate, bulk action, CSV export) — used by both the
 * per-form DynamicFormTable and the cross-form FormEntriesTable so the
 * mutation + toast + cache-invalidation logic lives in exactly one place
 * instead of being copy-pasted (and drifting out of sync) between them.
 *
 * @param {Array} baseQueryKey - react-query key prefix to invalidate on
 *   success, e.g. ["form-entries"] or ["form-entries", "table", tableSlug].
 *   React Query matches queryKeys by prefix, so invalidating the base key
 *   also invalidates every filtered/paginated variant built on top of it.
 */
export default function useEntryActions(baseQueryKey = ["form-entries"]) {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: baseQueryKey });

  const errMsg = (err, fallback) => err?.response?.data?.message || fallback;

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }) => updateEntryStatus(id, { status, note }),
    onSuccess: (_res, variables) => {
      toast.success(`Entry marked as ${variables.status}`);
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Could not update status")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteEntry(id),
    onSuccess: () => {
      toast.success("Moved to trash");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Delete failed")),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => restoreEntry(id),
    onSuccess: () => {
      toast.success("Entry restored");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Restore failed")),
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: (id) => permanentlyDeleteEntry(id),
    onSuccess: () => {
      toast.success("Entry permanently deleted");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Delete failed")),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => duplicateEntry(id),
    onSuccess: () => {
      toast.success("Entry duplicated");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Duplicate failed")),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload) => bulkEntryAction(payload),
    onSuccess: () => {
      toast.success("Bulk action applied");
      invalidate();
    },
    onError: (err) => toast.error(errMsg(err, "Bulk action failed")),
  });

  // Not a useMutation — this triggers a browser file download rather than
  // updating any cached query data, so a plain async fn is a better fit.
  const exportCSV = async ({ formId, status, filename } = {}) => {
    try {
      const response = await exportEntriesCSV({ formId, status });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename || `entries-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Nothing to export, or export failed");
    }
  };

  return {
    statusMutation,
    deleteMutation,
    restoreMutation,
    permanentDeleteMutation,
    duplicateMutation,
    bulkMutation,
    exportCSV,
  };
}
