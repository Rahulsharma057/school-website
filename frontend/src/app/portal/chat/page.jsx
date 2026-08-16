"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import PortalGuard from "@/components/PortalGuard";
import ChatGroupList from "@/components/chat/ChatGroupList";
import ChatWindow from "@/components/chat/ChatWindow";
import { useMyGroups } from "@/hooks/useChat";

function ChatContent() {
  const { data: groups = [] } = useMyGroups();
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <Box sx={{ display: "flex", height: "calc(100vh - 64px)" }}>
      <ChatGroupList groups={groups} selectedGroupId={selectedGroup?._id} onSelect={setSelectedGroup} />
      <ChatWindow group={selectedGroup} />
    </Box>
  );
}

export default function PortalChatPage() {
  return (
    <PortalGuard allowedRoles={["STUDENT", "TEACHER"]}>
      <ChatContent />
    </PortalGuard>
  );
}