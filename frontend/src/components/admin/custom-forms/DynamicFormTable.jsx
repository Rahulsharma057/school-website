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

// Renders a raw stored value according to the column's declared
// dataType — same conventions the backend uses when it built the
// column config from the form's fields.
const formatByDataType = (value, dataType) => {
  if (value === null || value === undefined || value === "") return "—";
  if (dataType === "Boolean") return value ? "Yes" : "No";
  if (dataType === "Array") return Array.isArray(value) ? value.join(", ") : String(value);
  if (dataType === "Date") return formatDate(value);
  return String(value);
};

/**
 * The per-form admin table — driven entirely by a tableSlug. Columns
 * are NOT hardcoded here; they come from the backend's
 * getEntriesByTableSlug response, generated from the form's own
 * fields (only ones with showInTable: true).
 *
 * Shares its mutation/toast/cache-invalidation logic and its filter /
 * bulk-action / row-action UI with FormEntriesTable via useEntryActions,
 * EntryFiltersBar, BulkActionBar and EntryActionsCell — this used to be
 * a separate copy-pasted implementation which had drifted out of sync
 * with the cross-form table (e.g. missing regex-escaping on search,
 * different bulk-action set). Keeping one implementation avoids that.
 */
export default function DynamicFormTable({ tableSlug }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
    showTrash: false,
  });

  // FIX: MUI X Data Grid v8+ changed the row selection model from a
  // plain GridRowId[] array to { type: 'include' | 'exclude'; ids: Set }.
  // Passing a plain array (the old shape) into `rowSelectionModel` on
  // v8/v9 causes the grid's internal selection logic to misread it and
  // crash with "Cannot read properties of null (reading 'id')". Selection
  // state is now kept as a Set, and the two spots that used to treat it
  // like an array (.length, spreading into the bulk-action payload) are
  // updated accordingly.
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
  };

  const { data, isLoading, isError } = useFormEntries({ tableSlug, ...queryParams });

  // Query key includes the tableSlug so invalidating it never clobbers
  // the cross-form FormEntriesTable's own cached queries.
  const {
    statusMutation,
    deleteMutation,
    restoreMutation,
    permanentDeleteMutation,
    duplicateMutation,
    bulkMutation,
    exportCSV,
  } = useEntryActions(["form-entries", "table", tableSlug]);

  const form = data?.data?.form;
  const columnConfig = data?.data?.columns || [];

  if (isLoading) return <LoadingSkeleton />;
  if (isError) {
    return (
      <EmptyState
        title="Unable to load this table"
        description="Check the route or your access to this form."
      />
    );
  }

  const rows = data?.data?.data?.map((item) => ({ ...item, id: item._id })) || [];

  // Dynamic columns from the form's own fields, prepended before the
  // fixed status/date/actions columns.
  const dynamicColumns = columnConfig.map((col) => ({
    field: col.key,
    headerName: col.label,
    minWidth: 160,
    flex: 1,
    sortable: false,
    valueGetter: (_value, row) => row.data?.[col.key],
    renderCell: ({ row }) => (
      <Typography sx={{ fontSize: 13, color: "#18181b" }}>
        {formatByDataType(row.data?.[col.key], col.dataType)}
      </Typography>
    ),
  }));

  const fixedColumns = [
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

  const columns = [...dynamicColumns, ...fixedColumns];

  return (
    <Box>
      <Box mb={2.5}>
        <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
          {form?.title || "Entries"}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "#71717a" }}>/admin/tables/{tableSlug}</Typography>
      </Box>

      <EntryFiltersBar
        filters={filters}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(0);
        }}
        total={data?.data?.total ?? 0}
        onExport={() =>
          exportCSV({
            formId: form?._id,
            status: filters.status || undefined,
            filename: `${tableSlug}-entries-${Date.now()}.csv`,
          })
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
            filters.search
              ? "Try a different keyword."
              : "Submissions will show up here once someone fills out this form."
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
       onStatusChange={(newStatus, note) => {
  if (!viewEntry) return;

  statusMutation.mutate(
    {
      id: viewEntry._id || viewEntry.id,
      status: newStatus,
      note,
    },
    {
      onSuccess: () => setViewEntry(null),
    }
  );
}}
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
