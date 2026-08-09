"use client";

import { useState } from "react";

import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  TextField,
} from "@mui/material";

import {
  DataGrid,
} from "@mui/x-data-grid";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "react-toastify";

import useHomeSlider from "@/hooks/useHomeSlider";

import {
  deleteSlider,
  updateSliderStatus,
} from "@/services/homeSliderService";

import ConfirmationDialog from "@/components/common/ConfirmationDialog";
import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";
import StatusSwitch from "@/components/common/StatusSwitch";

export default function SliderTable({ onEdit }) {

  const queryClient = useQueryClient();

  const [deleteId, setDeleteId] = useState(null);

  const [page, setPage] = useState(0);

  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState("");

  const {
    data,
    isLoading,
    isError,
  } = useHomeSlider({
    page: page + 1,
    limit: pageSize,
    search,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSlider,

    onSuccess: () => {

      toast.success("Slider Deleted");

      queryClient.invalidateQueries({
        queryKey: ["home-slider"],
      });

      setDeleteId(null);

    },

    onError: () => {
      toast.error("Delete Failed");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) =>
      updateSliderStatus(id, status),

    onSuccess: () => {

      toast.success("Status Updated");

      queryClient.invalidateQueries({
        queryKey: ["home-slider"],
      });

    },
  });

  if (isLoading)
    return <LoadingSkeleton />;

  if (isError)
    return <EmptyState title="Unable to load sliders" />;

  const rows =
    data?.data?.map((item) => ({
      ...item,
      id: item._id,
    })) || [];

  const columns = [

    {
      field: "image",

      headerName: "Image",

      width: 90,

      sortable: false,

      renderCell: ({ row }) => (

        <Avatar
          src={row.image?.url}
          variant="rounded"
          sx={{
            width: 55,
            height: 40,
          }}
        />

      ),
    },

    {
      field: "title",

      headerName: "Title",

      flex: 1,

      minWidth: 220,
    },

    {
      field: "order",

      headerName: "Order",

      width: 90,
    },

    {
      field: "status",

      headerName: "Status",

      width: 120,

      renderCell: ({ row }) => (

        <StatusSwitch
          checked={row.status}
          onChange={(value) =>
            statusMutation.mutate({
              id: row.id,
              status: value,
            })
          }
        />

      ),
    },

    {
      field: "displayStatus",

      headerName: "State",

      width: 110,

      renderCell: ({ row }) => (

        <Chip
          size="small"
          color={row.status ? "success" : "default"}
          label={row.status ? "Active" : "Inactive"}
        />

      ),
    },

    {
      field: "actions",

      headerName: "Actions",

      width: 130,

      sortable: false,

      renderCell: ({ row }) => (

        <>

          <IconButton
            color="primary"
    onClick={() => {

console.log("EDIT DATA", row);

onEdit({
  _id: row._id,
  title: row.title,
  description: row.description,
  buttonText: row.buttonText,
  buttonLink: row.buttonLink,
  order: row.order,
  image: row.image
});

}}
          >
            <EditIcon />
          </IconButton>

          <IconButton
            color="error"
            onClick={() => setDeleteId(row.id)}
          >
            <DeleteIcon />
          </IconButton>

        </>

      ),
    },

  ];

  return (

    <>

      <Stack
        mb={2}
      >

        <TextField
          size="small"
          placeholder="Search Slider..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

      </Stack>

      <Box>

        <DataGrid

          rows={rows}

          columns={columns}

          loading={isLoading}

          autoHeight

          pagination

          paginationMode="server"

          rowCount={data?.total || 0}

          pageSizeOptions={[5, 10, 20, 50]}

          paginationModel={{
            page,
            pageSize,
          }}

          onPaginationModelChange={(model) => {

            setPage(model.page);

            setPageSize(model.pageSize);

          }}

          disableRowSelectionOnClick

        />

      </Box>

      <ConfirmationDialog

        open={Boolean(deleteId)}

        title="Delete Slider"

        message="Are you sure you want to delete this slider?"

        loading={deleteMutation.isPending}

        confirmText="Delete"

        onClose={() => setDeleteId(null)}

        onConfirm={() =>
          deleteMutation.mutate(deleteId)
        }

      />

    </>

  );

}