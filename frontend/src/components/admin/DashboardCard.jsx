"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";

export default function DashboardCard({ title, value, icon }) {
  return (
    <Card
      sx={{
        height: "100%",
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography
              variant="h4"
              sx={{
                mt: 1,
              }}
            >
              {value}
            </Typography>
          </Box>

          <Box>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}
