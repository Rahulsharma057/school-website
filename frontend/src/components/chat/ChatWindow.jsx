"use client";

import { useEffect, useRef, useState } from "react";
import { Box, TextField, IconButton, Typography, Avatar, Stack, CircularProgress } from "@mui/material";
import { Send, LockOutlined } from "@mui/icons-material";
import { useMessages, useSendMessage } from "@/hooks/useChat";
import { useAuth } from "@/context/AuthContext";

export default function ChatWindow({ group }) {
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useMessages(group?._id);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage({ groupId: group._id, data: { text } }, { onSuccess: () => setText("") });
  };

  if (!group) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
        Select a group to start chatting
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
        <Typography sx={{ fontWeight: 700 }}>{group.name}</Typography>
        {!group.allowMediaUpload && (
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <LockOutlined sx={{ fontSize: 13, color: "#94a3b8" }} />
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>Media sharing disabled</Typography>
          </Stack>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2, backgroundColor: "#f8fafc" }}>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Stack spacing={1.5}>
            {messages.map((m) => {
              const isMine = m.sender?._id === user?._id;
              return (
                <Box key={m._id} sx={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                  <Box sx={{ maxWidth: "70%" }}>
                    {!isMine && (
                      <Typography variant="caption" sx={{ color: "#64748b", ml: 1, fontWeight: 600 }}>
                        {m.sender?.name} ({m.sender?.role})
                      </Typography>
                    )}
                    <Box
                      sx={{
                        p: 1.5, borderRadius: 2, mt: 0.3,
                        backgroundColor: isMine ? "#2563eb" : "#fff",
                        color: isMine ? "#fff" : "#1e293b",
                        border: isMine ? "none" : "1px solid #e2e8f0",
                      }}
                    >
                      <Typography variant="body2">{m.text}</Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
            {messages.length === 0 && (
              <Typography variant="body2" sx={{ color: "#94a3b8", textAlign: "center", py: 4 }}>
                No messages yet — say hi!
              </Typography>
            )}
            <div ref={bottomRef} />
          </Stack>
        )}
      </Box>

      <Box sx={{ p: 2, borderTop: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth size="small" placeholder="Type a message..."
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={isPending}>
            <Send />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
}