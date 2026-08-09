"use client";

import { Switch } from "@mui/material";

export default function StatusSwitch({ checked, onChange }) {
  return (
    <Switch
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      color="success"
    />
  );
}
