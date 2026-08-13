"use client";

import { useState } from "react";
import {
  Box, Typography, Paper, Select, MenuItem, Table, TableHead,
  TableBody, TableRow, TableCell, Button, Checkbox,
} from "@mui/material";
import { useClasses } from "@/hooks/useClasses";
import { useClassStudentsForPromotion, useBulkPromote } from "@/hooks/usePromotion";

export default function PromotionsPage() {
  const { data: classes = [] } = useClasses();
  const [fromClassId, setFromClassId] = useState("");
  const [toClassId, setToClassId] = useState("");
  const [selections, setSelections] = useState({}); // { studentProfileId: "PROMOTED" | "HOLD_BACK" | "GRADUATED" }

  const { data: students = [] } = useClassStudentsForPromotion(fromClassId);
  const { mutate: bulkPromote, isPending } = useBulkPromote();

  const handleResultChange = (id, result) => {
    setSelections({ ...selections, [id]: result });
  };

  const handleSubmit = () => {
    const promotions = Object.entries(selections).map(([studentProfileId, result]) => ({
      studentProfileId,
      result,
      newClassId: result === "PROMOTED" ? toClassId : undefined,
    }));

    if (promotions.length === 0) return;
    bulkPromote({ promotions }, { onSuccess: () => setSelections({}) });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3}>Student Promotion</Typography>

      <Paper sx={{ p: 3, mb: 3, display: "flex", gap: 2 }}>
        <Select
          displayEmpty
          value={fromClassId}
          onChange={(e) => setFromClassId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="" disabled>From Class</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
          ))}
        </Select>

        <Select
          displayEmpty
          value={toClassId}
          onChange={(e) => setToClassId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="" disabled>Promote To Class</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>{c.className} - {c.section}</MenuItem>
          ))}
        </Select>
      </Paper>

      {students.length > 0 && (
        <>
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Promote</TableCell>
                  <TableCell>Hold Back</TableCell>
                  <TableCell>Graduate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s._id}>
                    <TableCell>{s.rollNumber}</TableCell>
                    <TableCell>{s.user?.name}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selections[s._id] === "PROMOTED"}
                        onChange={() => handleResultChange(s._id, "PROMOTED")}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selections[s._id] === "HOLD_BACK"}
                        onChange={() => handleResultChange(s._id, "HOLD_BACK")}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={selections[s._id] === "GRADUATED"}
                        onChange={() => handleResultChange(s._id, "GRADUATED")}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Processing..." : "Submit Promotion"}
          </Button>
        </>
      )}
    </Box>
  );
}