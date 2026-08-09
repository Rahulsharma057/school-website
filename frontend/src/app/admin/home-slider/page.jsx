"use client";

import { useState } from "react";

import { Box, Stack } from "@mui/material";

import SliderForm from "@/components/admin/home/SliderForm";

import SliderTable from "@/components/admin/home/SliderTable";

export default function HomeSliderPage() {
  const [editData, setEditData] = useState(null);

  return (
    <Box>
      <SliderForm editData={editData} clearEdit={() => setEditData(null)} />

      <Stack mt={5}>
        <SliderTable
          onEdit={(data) => {
            setEditData(data);

            window.scrollTo({
              top: 0,

              behavior: "smooth",
            });
          }}
        />
      </Stack>
    </Box>
  );
}
