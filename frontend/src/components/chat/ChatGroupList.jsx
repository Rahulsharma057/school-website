"use client";

import { Box, List, ListItemButton, ListItemText, Typography, Chip, Avatar } from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";

const typeLabel = { CLASS: "Class", TEACHERS: "Teachers", SCHOOL: "School", CUSTOM: "Custom" };
const typeColor = { CLASS: "#2563eb", TEACHERS: "#7c3aed", SCHOOL: "#16a34a", CUSTOM: "#d97706" };

export default function ChatGroupList({ groups, selectedGroupId, onSelect }) {
  return (
    <Box sx={{ width: 280, borderRight: "1px solid #e2e8f0", height: "100%", overflowY: "auto", backgroundColor: "#fff" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid #e2e8f0" }}>
        <Typography sx={{ fontWeight: 700 }}>Chats</Typography>
      </Box>
      <List disablePadding>
        {groups.map((g) => (
          <ListItemButton
            key={g._id}
            selected={selectedGroupId === g._id}
            onClick={() => onSelect(g)}
            sx={{ borderBottom: "1px solid #f1f5f9", py: 1.5 }}
          >
            <Avatar sx={{ bgcolor: typeColor[g.type] + "20", color: typeColor[g.type], mr: 1.5, width: 36, height: 36 }}>
              <GroupsIcon fontSize="small" />
            </Avatar>
            <ListItemText
              primary={g.name}
              secondary={g.lastMessage?.text || "No messages yet"}
              primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: 12.5, noWrap: true }}
            />
          </ListItemButton>
        ))}
        {groups.length === 0 && (
          <Typography variant="body2" sx={{ color: "#94a3b8", p: 3, textAlign: "center" }}>
            No chat groups yet
          </Typography>
        )}
      </List>
    </Box>
  );
}