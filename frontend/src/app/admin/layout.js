import Sidebar from "@/components/admin/Sidebar";

import Header from "@/components/admin/Header";

import { Box } from "@mui/material";

export default function AdminLayout({ children }) {
  return (
    <Box>
      <Header />

      <Sidebar />

      <Box
        component="main"
        sx={{
          ml: "240px",

          p: 3,

          mt: "64px",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
