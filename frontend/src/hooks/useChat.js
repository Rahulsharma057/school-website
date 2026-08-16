"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/chatService";
import { toast } from "react-toastify";

export function useMyGroups() {
  return useQuery({
    queryKey: ["my-chat-groups"],
    queryFn: async () => (await svc.getMyGroups()).data.data,
    refetchInterval: 15000, // group list (last message preview) — halka polling
  });
}

export function useAllGroups() {
  return useQuery({
    queryKey: ["all-chat-groups"],
    queryFn: async () => (await svc.getAllGroups()).data.data,
  });
}

export function useMemberOptions() {
  return useQuery({
    queryKey: ["chat-member-options"],
    queryFn: async () => {
      const users = (await svc.getMemberOptions()).data.data;
      // _id ke hisaab se dedupe, taaki kabhi duplicate na aaye
      const uniqueMap = new Map(users.map((u) => [u._id, u]));
      return [...uniqueMap.values()];
    },
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => svc.createGroup(data),
    onSuccess: () => {
      toast.success("Group created");
      qc.invalidateQueries({ queryKey: ["all-chat-groups"] });
      qc.invalidateQueries({ queryKey: ["my-chat-groups"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to create group"),
  });
}

export function useToggleMediaUpload() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, allowMediaUpload }) => svc.toggleMediaUpload(id, allowMediaUpload),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["all-chat-groups"] });
    },
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => svc.deleteGroup(id),
    onSuccess: () => {
      toast.success("Group deleted");
      qc.invalidateQueries({ queryKey: ["all-chat-groups"] });
      qc.invalidateQueries({ queryKey: ["my-chat-groups"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Delete failed"),
  });
}

// Messages — polling based "near real-time"
export function useMessages(groupId) {
  return useQuery({
    queryKey: ["chat-messages", groupId],
    queryFn: async () => (await svc.getMessages(groupId)).data.data,
    enabled: !!groupId,
    refetchInterval: 4000, // 4 second polling — halka aur fast dono
    refetchIntervalInBackground: false,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, data }) => svc.sendMessage(groupId, data),
    onSuccess: (_res, variables) => {
      qc.invalidateQueries({ queryKey: ["chat-messages", variables.groupId] });
      qc.invalidateQueries({ queryKey: ["my-chat-groups"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to send message"),
  });
}