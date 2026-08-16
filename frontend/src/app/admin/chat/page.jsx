"use client";

import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import AdminGuard from "@/components/admin/AdminGuard";
import ChatGroupList from "@/components/chat/ChatGroupList";
import ChatWindow from "@/components/chat/ChatWindow";
import ManageGroupsTab from "@/components/chat/ManageGroupsTab";
import { useMyGroups } from "@/hooks/useChat";

function AdminChatContent() {
  const [tab, setTab] = useState(0);
  const { data: groups = [] } = useMyGroups(); // staff ke liye sab groups milte hain
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <Box>
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ px: 3, pt: 2, borderBottom: "1px solid #e2e8f0" }}>
        <Tab label="Chats" />
        <Tab label="Manage Groups" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ display: "flex", height: "calc(100vh - 130px)" }}>
          <ChatGroupList groups={groups} selectedGroupId={selectedGroup?._id} onSelect={setSelectedGroup} />
          <ChatWindow group={selectedGroup} />
        </Box>
      )}

      {tab === 1 && <ManageGroupsTab />}
    </Box>
  );
}

export default function AdminChatPage() {
  return (
    <AdminGuard>
      <AdminChatContent />
    </AdminGuard>
  );
}