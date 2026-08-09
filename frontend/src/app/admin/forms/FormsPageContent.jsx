"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Button,
  Collapse,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import TableChartIcon from "@mui/icons-material/TableChart";
import { useQuery } from "@tanstack/react-query";
import { getForm } from "@/services/formService";
import FormBuilder from "@/components/admin/custom-forms/FormBuilder";
import FormsTable from "@/components/admin/custom-forms/FormsTable";
export default function FormsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlEditId = searchParams.get("edit");
  const [editId, setEditId] = useState(urlEditId);
  const [showBuilder, setShowBuilder] = useState(Boolean(urlEditId));
  useEffect(() => {
    setEditId(urlEditId);
    if (urlEditId) {
      setShowBuilder(true);
    }
  }, [urlEditId]);
  const { data: fullForm, isFetching: loadingForm } = useQuery({
    queryKey: ["form", editId],
    queryFn: async () => {
      const res = await getForm(editId);
      return res.data?.data;
    },
    enabled: Boolean(editId),
  });
  const openForCreate = () => {
    setEditId(null);
    setShowBuilder(true);
  };
  const openForEdit = (row) => {
    setEditId(row._id);
    setShowBuilder(true);
  };
  const closeBuilder = () => {
    setShowBuilder(false);
    setEditId(null);
    if (urlEditId) {
      router.replace("/admin/forms");
    }
  };
  return (
    <Box>
      {" "}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        mb={4}
      >
        {" "}
        <Box>
          {" "}
          <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b" }}>
            {" "}
            Forms{" "}
          </Typography>{" "}
          <Typography sx={{ fontSize: 13, color: "#71717a" }}>
            {" "}
            Create and edit form definitions — fields, layout, routes, and
            access.{" "}
          </Typography>{" "}
        </Box>{" "}
        <Stack direction="row" spacing={1.5}>
          {" "}
          <Button
            startIcon={<TableChartIcon />}
            onClick={() => router.push("/admin/tables")}
            sx={{
              textTransform: "none",
              color: "#3f3f46",
              border: "1px solid #e4e4e7",
              px: 2.5,
            }}
          >
            {" "}
            View All Tables{" "}
          </Button>{" "}
          {!showBuilder && (
            <Button
              startIcon={<AddIcon />}
              onClick={openForCreate}
              variant="contained"
              disableElevation
              sx={{
                bgcolor: "#18181b",
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                "&:hover": { bgcolor: "#27272a" },
              }}
            >
              {" "}
              New Form{" "}
            </Button>
          )}{" "}
          {showBuilder && (
            <Button
              startIcon={<CloseIcon />}
              onClick={closeBuilder}
              sx={{ textTransform: "none", color: "#71717a" }}
            >
              {" "}
              Close{" "}
            </Button>
          )}{" "}
        </Stack>{" "}
      </Stack>{" "}
      <Collapse in={showBuilder} unmountOnExit>
        {" "}
        <Box mb={4}>
          {" "}
          {editId && loadingForm ? (
            <Stack alignItems="center" py={6}>
              {" "}
              <CircularProgress size={26} sx={{ color: "#18181b" }} />{" "}
            </Stack>
          ) : (
            <FormBuilder
              editData={editId ? fullForm : null}
              clearEdit={closeBuilder}
            />
          )}{" "}
        </Box>{" "}
      </Collapse>{" "}
      <FormsTable onEdit={openForEdit} />{" "}
    </Box>
  );
}
