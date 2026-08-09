"use client";

import { useEffect, useState } from "react";

import {
  Box,
  Button,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";

/**
 * Search + status + date-range + trash-toggle + export — shared by
 * DynamicFormTable and FormEntriesTable so this filter bar exists once.
 * Owns its own debounce on the search input; everything else (status,
 * dates, trash toggle) updates `filters` immediately.
 */
export default function EntryFiltersBar({
  filters,
  onFiltersChange,
  total,
  onExport,
  searchPlaceholder = "Search name, email, phone...",
}) {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const set = (patch) => onFiltersChange({ ...filters, ...patch });

  return (
    <Stack direction="row" flexWrap="wrap" rowGap={1.5} columnGap={1.5} alignItems="center" mb={2.5}>
      <TextField
        size="small"
        placeholder={searchPlaceholder}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ width: { xs: "100%", sm: 260 }, "& .MuiOutlinedInput-root": { bgcolor: "#fff" } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: "#a1a1aa" }} />
            </InputAdornment>
          ),
        }}
      />

      <TextField
        select
        size="small"
        label="Status"
        value={filters.status}
        onChange={(e) => set({ status: e.target.value })}
        sx={{ width: 150, bgcolor: "#fff" }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="pending">Pending</MenuItem>
        <MenuItem value="approved">Approved</MenuItem>
        <MenuItem value="rejected">Rejected</MenuItem>
        <MenuItem value="archived">Archived</MenuItem>
      </TextField>

      <TextField
        size="small"
        type="date"
        label="From"
        InputLabelProps={{ shrink: true }}
        value={filters.dateFrom}
        onChange={(e) => set({ dateFrom: e.target.value })}
        sx={{ width: 150, bgcolor: "#fff" }}
      />

      <TextField
        size="small"
        type="date"
        label="To"
        InputLabelProps={{ shrink: true }}
        value={filters.dateTo}
        onChange={(e) => set({ dateTo: e.target.value })}
        sx={{ width: 150, bgcolor: "#fff" }}
      />

      <FormControlLabel
        control={<Switch checked={filters.showTrash} onChange={(e) => set({ showTrash: e.target.checked })} />}
        label="Show Trash"
      />

      <Box sx={{ flex: 1 }} />

      <Button
        size="small"
        startIcon={<DownloadIcon />}
        onClick={onExport}
        sx={{ textTransform: "none", color: "#3f3f46", border: "1px solid #e4e4e7" }}
      >
        Export CSV
      </Button>

      <Typography sx={{ fontSize: 13, color: "#71717a" }}>{total} entries</Typography>
    </Stack>
  );
}
