"use client";

import { Grid, Typography, Box } from "@mui/material";

import DashboardCard from "@/components/admin/DashboardCard";

import NewspaperIcon from "@mui/icons-material/Newspaper";
import PhotoLibraryIcon from "@mui/icons-material/PhotoLibrary";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";

export default function Dashboard() {
  const cards = [
    {
      title: "Total News",
      value: 0,
      icon: <NewspaperIcon fontSize="large" />,
    },

    {
      title: "Gallery Images",
      value: 0,
      icon: <PhotoLibraryIcon fontSize="large" />,
    },

    {
      title: "Events",
      value: 0,
      icon: <EventIcon fontSize="large" />,
    },

    {
      title: "Faculty",
      value: 0,
      icon: <PeopleIcon fontSize="large" />,
    },
  ];

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.title}>
            <DashboardCard
              title={card.title}
              value={card.value}
              icon={card.icon}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
