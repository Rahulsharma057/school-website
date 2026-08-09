"use client";

import { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";

import QuoteForm from "@/components/admin/quotes/QuoteForm";
import QuotesTable from "@/components/admin/quotes/QuotesTable";
import QuoteSectionForm from "@/components/admin/quotes/QuoteSectionForm";
import QuoteSectionsTable from "@/components/admin/quotes/QuoteSectionsTable";

function TabPanel({ value, index, children }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 3 }}>{children}</Box>;
}

export default function AdminQuotesPage() {
  const [tab, setTab] = useState(0);

  const [editQuote, setEditQuote] = useState(null);
  const [editSection, setEditSection] = useState(null);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ color: "#18181b", mb: 0.5 }}>
        Quotes
      </Typography>
      <Typography sx={{ fontSize: 13, color: "#71717a", mb: 2.5 }}>
        Manage individual quotes, and the titled, styled pages built from them.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 1, borderBottom: "1px solid #e4e4e7" }}
      >
        <Tab label="Quotes" />
        <Tab label="Pages" />
      </Tabs>

      {/* ---- Individual quote content ---- */}
      <TabPanel value={tab} index={0}>
        <QuoteForm editData={editQuote} clearEdit={() => setEditQuote(null)} />
        <Box mt={5}>
          <QuotesTable onEdit={(data) => setEditQuote(data)} />
        </Box>
      </TabPanel>

      {/* ---- Titled/routed/styled pages built on top of the quotes above ---- */}
      <TabPanel value={tab} index={1}>
        <QuoteSectionForm editData={editSection} clearEdit={() => setEditSection(null)} />
        <Box mt={5}>
          <QuoteSectionsTable onEdit={(data) => setEditSection(data)} />
        </Box>
      </TabPanel>
    </Box>
  );
}
