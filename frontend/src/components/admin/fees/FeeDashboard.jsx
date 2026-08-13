"use client";

import { useState } from "react";

import { Box, Card, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip as RechartsTooltip, XAxis, YAxis,
} from "recharts";

import { useClasses } from "@/hooks/useClasses";
import { useFeeDashboard } from "@/hooks/fees/useStudentFee";

import LoadingSkeleton from "@/components/common/LoadingSkeleton";
import EmptyState from "@/components/common/EmptyState";

const currency = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

function StatCard({ label, value, color }) {
  return (
    <Box sx={{ p: 2, bgcolor: "#fafafa", borderRadius: 2, flex: 1, minWidth: 160 }}>
      <Typography sx={{ fontSize: 12, color: "#a1a1aa" }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: color || "#18181b" }}>{value}</Typography>
    </Box>
  );
}

export default function FeeDashboard() {
  const [academicYear, setAcademicYear] = useState("");
  const [classId, setClassId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: classesData } = useClasses();
  const classes = classesData || [];

  const { data, isLoading, isError } = useFeeDashboard({
    academicYear: academicYear || undefined,
    classId: classId || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const classLabel = (id) => {
    const c = classes.find((cl) => cl._id === id);
    return c ? `${c.className}${c.section ? ` ${c.section}` : ""}` : "—";
  };

  const classWiseChartData = (data?.classWise || []).map((c) => ({
    name: classLabel(c.classId),
    Paid: c.totalPaid,
    Due: c.totalDue,
  }));

  const monthWiseChartData = (data?.monthWise || []).map((m) => ({
    name: m.label,
    Collected: m.totalCollected,
  }));

  return (
    <Box>
      <Stack direction="row" flexWrap="wrap" gap={2} mb={3}>
        <TextField
          size="small"
          label="Academic Year (optional)"
          placeholder="2026-27"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          sx={{ width: 170 }}
        />
        <TextField select size="small" label="Class (optional)" value={classId} onChange={(e) => setClassId(e.target.value)} sx={{ width: 190 }}>
          <MenuItem value="">All classes</MenuItem>
          {classes.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              {c.className} {c.section ? `- ${c.section}` : ""}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From (payments)"
          InputLabelProps={{ shrink: true }}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          sx={{ width: 160 }}
        />
        <TextField
          size="small"
          type="date"
          label="To (payments)"
          InputLabelProps={{ shrink: true }}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          sx={{ width: 160 }}
        />
      </Stack>

      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <EmptyState title="Unable to load dashboard" />
      ) : (
        <>
          <Stack direction="row" flexWrap="wrap" gap={2} mb={4}>
            <StatCard label="Total Fee (assigned)" value={currency(data?.overall?.totalAmount)} />
            <StatCard label="Total Collected" value={currency(data?.overall?.totalPaid)} color="#15803d" />
            <StatCard label="Total Due" value={currency(data?.overall?.totalDue)} color="#dc2626" />
            <StatCard label="Collection %" value={`${data?.overall?.collectionPercent ?? 0}%`} />
            <StatCard label="Students" value={data?.overall?.totalStudents ?? 0} />
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none", p: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Class-wise Collection</Typography>
                {classWiseChartData.length === 0 ? (
                  <EmptyState title="No data" description="No fee records match this filter." />
                ) : (
                  <Box sx={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart data={classWiseChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <RechartsTooltip formatter={(v) => currency(v)} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="Paid" fill="#15803d" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Due" fill="#dc2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card variant="outlined" sx={{ border: "1px solid #e4e4e7", boxShadow: "none", p: 2 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Month-wise Collection</Typography>
                {monthWiseChartData.length === 0 ? (
                  <EmptyState title="No payments" description="No payments recorded in this range." />
                ) : (
                  <Box sx={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart data={monthWiseChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                        <RechartsTooltip formatter={(v) => currency(v)} />
                        <Line type="monotone" dataKey="Collected" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
