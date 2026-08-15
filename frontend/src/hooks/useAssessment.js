"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/assessmentService";
import { toast } from "react-toastify";

export function useParseQuestionFile() {
  return useMutation({
    mutationFn: (formData) => svc.parseQuestionFile(formData),
    onError: (e) => toast.error(e.response?.data?.message || "Failed to parse file"),
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => svc.createAssessment(data),
    onSuccess: () => {
      toast.success("Assessment created");
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Failed to create assessment"),
  });
}

export function useUpdateAssessmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => svc.updateAssessmentStatus(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["my-assessments"] });
    },
  });
}

export function useMyAssessments() {
  return useQuery({
    queryKey: ["my-assessments"],
    queryFn: async () => (await svc.getMyAssessments()).data.data,
  });
}

export function useAssessmentById(id) {
  return useQuery({
    queryKey: ["assessment", id],
    queryFn: async () => (await svc.getAssessmentById(id)).data.data,
    enabled: !!id,
  });
}

export function useMyClassAssessments() {
  return useQuery({
    queryKey: ["my-class-assessments"],
    queryFn: async () => (await svc.getMyClassAssessments()).data.data,
  });
}

export function useSubmitAssessment() {
  return useMutation({
    mutationFn: ({ id, data }) => svc.submitAssessment(id, data),
    onSuccess: () => toast.success("Submitted successfully"),
    onError: (e) => toast.error(e.response?.data?.message || "Submit failed"),
  });
}

export function useMySubmission(id) {
  return useQuery({
    queryKey: ["my-submission", id],
    queryFn: async () => (await svc.getMySubmission(id)).data.data,
    enabled: !!id,
    retry: false,
  });
}

export function useSubmissionsForAssessment(id) {
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: async () => (await svc.getSubmissionsForAssessment(id)).data.data,
    enabled: !!id,
  });
}

export function useSubmissionById(id) {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: async () => (await svc.getSubmissionById(id)).data.data,
    enabled: !!id,
  });
}

export function useGradeSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => svc.gradeSubmission(id, data),
    onSuccess: (_res, variables) => {
      toast.success("Graded successfully");
      qc.invalidateQueries({ queryKey: ["submission", variables.id] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Grading failed"),
  });
}