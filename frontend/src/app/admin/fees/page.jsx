"use client";

import { useRouter } from "next/navigation";
import {
  Box,
  Card,
  CardActionArea,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LayersIcon from "@mui/icons-material/Layers";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

const TILES = [
  {
    title: "Dashboard",
    desc: "Overall + class-wise + month-wise collection",
    icon: DashboardIcon,
    href: "/admin/fees/dashboard",
    color: "#7c3aed",
  },
  {
    title: "Fee Structures",
    desc: "Define fee templates per class + year",
    icon: LayersIcon,
    href: "/admin/fees/structures",
    color: "#1d4ed8",
  },
  {
    title: "Assign Fee",
    desc: "Apply a structure to a class or student",
    icon: PersonAddIcon,
    href: "/admin/fees/assign",
    color: "#15803d",
  },
  {
    title: "Due List",
    desc: "See who owes what, across classes",
    icon: WarningAmberIcon,
    href: "/admin/fees/due-list",
    color: "#b45309",
  },
  {
    title: "All Payments",
    desc: "Full collection audit trail",
    icon: ReceiptLongIcon,
    href: "/admin/fees/payments",
    color: "#71717a",
  },
];

export default function FeesDashboardPage() {
  const router = useRouter();

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight={700}
        sx={{ color: "#18181b", mb: 0.5 }}
      >
        Fee Management
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 4 }}>
        Structures, assignment, collection, and dues — all in one place.
      </Typography>

      <Grid container spacing={2}>
        {TILES.map((t) => (
          <Grid key={t.href} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              variant="outlined"
              sx={{ border: "1px solid #e4e4e7", borderRadius: 2 }}
            >
              <CardActionArea
                onClick={() => router.push(t.href)}
                sx={{ p: 2.5 }}
              >
                <Stack spacing={1.5}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: `${t.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <t.icon sx={{ color: t.color, fontSize: 22 }} />
                  </Box>
                  <Typography
                    sx={{ fontWeight: 700, fontSize: 15, color: "#18181b" }}
                  >
                    {t.title}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>
                    {t.desc}
                  </Typography>
                </Stack>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
