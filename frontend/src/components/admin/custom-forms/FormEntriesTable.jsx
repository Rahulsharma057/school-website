"use client";

import { useState } from "react";

import { Box, Chip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

import useFormEntries from "@/hooks/useFormEntries";
import useEntryActions, { STATUS_STYLES, formatDate } from "@/hooks/useEntryActions";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import EntryDetailDialog from "./EntryDetailDialog";
import EntryActionsCell from "./EntryActionsCell";
import EntryFiltersBar from "./EntryFiltersBar";
import BulkActionBar, { BULK_ACTION_OPTIONS } from "./BulkActionBar";

/**
 * Cross-form "global inbox" — every submission from every form in one
 * table (unlike DynamicFormTable, which is scoped to a single form via
 * tableSlug and shows that form's own dynamic columns). Pass a formId
 * to scope this to a single form instead.
 */
export default function FormEntriesTable({ formId }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    showTrash: false,
  });

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [viewEntry, setViewEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const queryParams = {
    page: page + 1,
    limit: pageSize,
    search: filters.search,
    status: filters.status || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    includeDeleted: filters.showTrash ? "true" : "false",
    formId: formId || undefined,
  };

  const { data, isLoading, isError } = useFormEntries(queryParams);

  const {
    statusMutation,
    deleteMutation,
    restoreMutation,
    permanentDeleteMutation,
    duplicateMutation,
    bulkMutation,
    exportCSV,
  } = useEntryActions(["form-entries"]);

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <EmptyState title="Unable to load entries" />;

  const rows = data?.data?.data?.map((item) => ({ ...item, id: item._id })) || [];

  const columns = [
    {
      field: "submitter",
      headerName: "Submitter",
      flex: 1,
      minWidth: 200,
      sortable: false,
      renderCell: ({ row }) => (
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#18181b" }}>
            {row.submitterName || "—"}
          </Typography>
          <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>
            {row.submitterEmail || row.submitterPhone || "no contact info"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "formTitle",
      headerName: "Form",
      width: 180,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: "#52525b" }}>{value || "—"}</Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ value }) => {
        const s = STATUS_STYLES[value] || STATUS_STYLES.pending;
        return (
          <Chip
            label={s.label}
            size="small"
            sx={{ fontWeight: 600, fontSize: 12, bgcolor: s.bg, color: s.color }}
          />
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Submitted",
      width: 120,
      renderCell: ({ value }) => (
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>{formatDate(value)}</Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <EntryActionsCell
          row={row}
          onView={setViewEntry}
          onApprove={(r) => statusMutation.mutate({ id: r.id, status: "approved", note: r.reviewNote })}
          onReject={(r) => statusMutation.mutate({ id: r.id, status: "rejected", note: r.reviewNote })}
          onDuplicate={(r) => duplicateMutation.mutate(r.id)}
          onTrash={(r) => setDeleteTarget({ id: r.id, permanent: false })}
          onRestore={(r) => restoreMutation.mutate(r.id)}
          onPermanentDelete={(r) => setDeleteTarget({ id: r.id, permanent: true })}
        />
      ),
    },
  ];

  return (
    <Box>
      <EntryFiltersBar
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(0);
        }}
        total={data?.data?.total ?? 0}
        onExport={() =>
          exportCSV({ formId, status: filters.status || undefined, filename: `form-entries-${Date.now()}.csv` })
        }
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        action={bulkAction}
        onActionChange={setBulkAction}
        onClear={() => setSelectedIds(new Set())}
        onApply={() => setBulkConfirmOpen(true)}
        applying={bulkMutation.isPending}
      />

      {rows.length === 0 ? (
        <EmptyState
          title={filters.search ? "No entries match your search" : "No entries yet"}
          description={
            filters.search ? "Try a different keyword." : "Submissions will show up here once someone fills out a form."
          }
        />
      ) : (
        <Box sx={{ border: "1px solid #e4e4e7", borderRadius: 2, bgcolor: "#fff", overflow: "hidden" }}>
          <DataGrid
            autoHeight
            checkboxSelection
            rows={rows}
            columns={columns}
            paginationMode="server"
            rowCount={data?.data?.total || 0}
            paginationModel={{ page, pageSize }}
            pageSizeOptions={[5, 10, 20, 50]}
            onPaginationModelChange={(model) => {
              setPage(model.page);
              setPageSize(model.pageSize);
            }}
            rowSelectionModel={{ type: "include", ids: selectedIds }}
            onRowSelectionModelChange={(newModel) => setSelectedIds(newModel.ids)}
            disableRowSelectionOnClick
            getRowHeight={() => 64}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#fafafa", borderBottom: "1px solid #e4e4e7" },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: 700,
                fontSize: 12.5,
                color: "#3f3f46",
                textTransform: "uppercase",
                letterSpacing: "0.03em",
              },
              "& .MuiDataGrid-cell": { borderBottom: "1px solid #f4f4f5" },
              "& .MuiDataGrid-row:hover": { bgcolor: "#fafafa" },
              "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #e4e4e7" },
            }}
          />
        </Box>
      )}

      <EntryDetailDialog
        open={Boolean(viewEntry)}
        entry={viewEntry}
        onClose={() => setViewEntry(null)}
        statusLoading={statusMutation.isPending}
        onStatusChange={(newStatus, note) =>
          statusMutation.mutate(
            { id: viewEntry?.id, status: newStatus, note },
            { onSuccess: () => setViewEntry(null) },
          )
        }
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.permanent ? "Delete Permanently" : "Move to Trash"}
        message={
          deleteTarget?.permanent
            ? "This cannot be undone. The entry and any uploaded files will be permanently deleted."
            : "This entry will be moved to trash. You can restore it later."
        }
        loading={deleteMutation.isPending || permanentDeleteMutation.isPending}
        confirmText={deleteTarget?.permanent ? "Delete Permanently" : "Move to Trash"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget?.permanent
            ? permanentDeleteMutation.mutate(deleteTarget?.id, { onSuccess: () => setDeleteTarget(null) })
            : deleteMutation.mutate(deleteTarget?.id, { onSuccess: () => setDeleteTarget(null) })
        }
      />

      <ConfirmationDialog
        open={bulkConfirmOpen}
        title="Apply Bulk Action"
        message={`This will apply "${
          BULK_ACTION_OPTIONS.find((a) => a.value === bulkAction)?.label || bulkAction
        }" to ${selectedIds.size} entr${selectedIds.size === 1 ? "y" : "ies"}.`}
        loading={bulkMutation.isPending}
        confirmText="Apply"
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={() =>
          bulkMutation.mutate(
            { ids: Array.from(selectedIds), action: bulkAction },
            {
              onSuccess: () => {
                setSelectedIds(new Set());
                setBulkAction("");
                setBulkConfirmOpen(false);
              },
            },
          )
        }
      />
    </Box>
  );
}