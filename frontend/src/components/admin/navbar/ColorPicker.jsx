"use client";

import {
  Box,
  TextField,
  Typography,
} from "@mui/material";


export default function ColorPicker({
  label,
  value,
  onChange,
}) {

  return (
    <Box
      sx={{
        display:"flex",
        alignItems:"center",
        gap:2,
        mb:2,
      }}
    >

      <Box>

        <Typography
          variant="body2"
          mb={1}
        >
          {label}
        </Typography>


        <Box
          component="input"
          type="color"
          value={value || "#1976d2"}
          onChange={(e)=>onChange(e.target.value)}
          sx={{
            width:60,
            height:40,
            border:"none",
            cursor:"pointer",
          }}
        />

      </Box>


      <TextField
        size="small"
        label={label}
        value={value || ""}
        onChange={(e)=>onChange(e.target.value)}
      />

    </Box>
  );
}