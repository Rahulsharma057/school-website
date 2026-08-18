"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "react-toastify";

import {
  createStudent,
  getStudents,
  getMyStudentProfile,
  updateMyStudentProfile,
  getStudentById,
  updateStudentByAdmin,
  deleteStudent,
  uploadStudentAadhar,
  uploadStudentDocument,
  deleteStudentDocument,
  downloadStudentProfilePdf,
  downloadMyStudentProfilePdf,
  uploadMyStudentProfilePhoto,
  getMyStudentDocuments,
  uploadMyStudentDocument,
  deleteMyStudentDocument,
  markStudentLeft,
  reactivateStudent,
  getLeftStudents,
} from "@/services/studentService";

// ======================================================
// QUERY KEYS
// ======================================================

export const studentKeys = {
  all: ["students"],

  // All student lists
  lists: () => [...studentKeys.all, "list"],

  // Main paginated student list
  list: (params = {}) => [
    ...studentKeys.lists(),
    {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 20,
      search: params.search || "",
      classId: params.classId || "",
      status: params.status || "",
    },
  ],

  // Students by class
  // IMPORTANT:
  // Class filtering is now handled by the paginated /students API.
  byClass: (classId, params = {}) => [
    ...studentKeys.all,
    "by-class",
    classId,
    {
      page: Number(params.page) || 1,
      limit: Number(params.limit) || 20,
      search: params.search || "",
      status: params.status || "",
    },
  ],

  // Single student
  profile: (studentId) => [
    ...studentKeys.all,
    "profile",
    studentId,
  ],

  // Current student
  me: ["students", "me"],

  // My documents
  myDocuments: ["students", "me", "documents"],

  // Left students
  left: () => [...studentKeys.all, "left"],
};

// ======================================================
// ERROR HELPER
// ======================================================

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

// ======================================================
// BLOB DOWNLOAD
// ======================================================

function triggerBlobDownload(blob, filename) {
  if (!blob || typeof window === "undefined") {
    return;
  }

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

// ======================================================
// SAFE FILE NAME
// ======================================================

function safeFilename(value = "student") {
  return (
    String(value)
      .trim()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "student"
  );
}

// ======================================================
// INVALIDATE CLASS LISTS
// ======================================================

function invalidateByClassLists(queryClient) {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey?.[0] === "students" &&
      query.queryKey?.[1] === "by-class",
  });
}

// ======================================================
// CREATE STUDENT
// ======================================================

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,

    onSuccess: () => {
      toast.success("Student created successfully");

      // Refresh all paginated student lists
      queryClient.invalidateQueries({
        queryKey: studentKeys.lists(),
      });

      // Refresh class-specific lists
      invalidateByClassLists(queryClient);
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(error, "Failed to create student")
      );
    },
  });
}

// ======================================================
// MY PROFILE
// ======================================================

export function useMyStudentProfile(options = {}) {
  return useQuery({
    queryKey: studentKeys.me,

    queryFn: async () => {
      const res = await getMyStudentProfile();

      return res?.data?.data ?? res?.data ?? null;
    },

    staleTime: 1000 * 60 * 5,

    refetchOnWindowFocus: false,

    retry: 1,

    ...options,
  });
}

// ======================================================
// UPDATE MY PROFILE
// ======================================================

export function useUpdateMyStudentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyStudentProfile,

    onSuccess: (res) => {
      toast.success(
        res?.data?.message ||
          "Profile updated successfully"
      );

      queryClient.invalidateQueries({
        queryKey: studentKeys.me,
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to update profile"
        )
      );
    },
  });
}

// ======================================================
// MY PROFILE PHOTO
// ======================================================

export function useUploadMyStudentProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMyStudentProfilePhoto,

    onSuccess: () => {
      toast.success(
        "Profile photo uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey: studentKeys.me,
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to upload profile photo"
        )
      );
    },
  });
}

// ======================================================
// MY DOCUMENTS
// ======================================================

export function useMyStudentDocuments(options = {}) {
  return useQuery({
    queryKey: studentKeys.myDocuments,

    queryFn: async () => {
      const res = await getMyStudentDocuments();

      return res?.data?.data ?? res?.data ?? [];
    },

    staleTime: 1000 * 60,

    refetchOnWindowFocus: false,

    retry: 1,

    ...options,
  });
}

// ======================================================
// UPLOAD MY DOCUMENT
// ======================================================

export function useUploadMyStudentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadMyStudentDocument,

    onSuccess: () => {
      toast.success(
        "Document(s) uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey: studentKeys.myDocuments,
      });

      queryClient.invalidateQueries({
        queryKey: studentKeys.me,
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to upload document"
        )
      );
    },
  });
}

// ======================================================
// DELETE MY DOCUMENT
// ======================================================

export function useDeleteMyStudentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId) =>
      deleteMyStudentDocument(documentId),

    onSuccess: () => {
      toast.success(
        "Document removed successfully"
      );

      queryClient.invalidateQueries({
        queryKey: studentKeys.myDocuments,
      });

      queryClient.invalidateQueries({
        queryKey: studentKeys.me,
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to remove document"
        )
      );
    },
  });
}

// ======================================================
// ALL STUDENTS
// SERVER-SIDE PAGINATION
// ======================================================

export function useStudents(params = {}, options = {}) {
  const normalizedParams = {
    page: Math.max(
      Number(params.page) || 1,
      1
    ),

    limit: Math.min(
      Math.max(
        Number(params.limit) || 20,
        1
      ),
      100
    ),

    search:
      params.search?.trim() || "",

    classId:
      params.classId || "",

    status:
      params.status || "",
  };

  return useQuery({
    queryKey: studentKeys.list(
      normalizedParams
    ),

    queryFn: async () => {
      const res =
        await getStudents(
          normalizedParams
        );

      const payload =
        res?.data?.data ??
        res?.data ??
        {};

      return {
        students:
          Array.isArray(
            payload?.students
          )
            ? payload.students
            : Array.isArray(
                payload?.data
              )
            ? payload.data
            : [],

        pagination:
          payload?.pagination ?? {
            page:
              normalizedParams.page,

            limit:
              normalizedParams.limit,

            total: 0,

            totalPages: 0,
          },
      };
    },

    enabled:
      options.enabled !== false,

    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,

    retry: 1,

    // Keep old page visible while next page loads
    placeholderData:
      (previousData) =>
        previousData,

    ...options,
  });
}

// ======================================================
// STUDENTS BY CLASS
// SERVER-SIDE PAGINATION
//
// IMPORTANT:
// We DO NOT use getStudentsByClass() here.
//
// Backend getStudentsByClass() currently returns
// a complete array without pagination.
//
// Instead we use getStudents() with classId.
// Backend already supports:
//
// GET /students
// ?page=1
// &limit=20
// &classId=XXXX
// &search=
// &status=
//
// Therefore class-wise pagination works correctly.
// ======================================================

export function useStudentsByClass(
  classId,
  params = {},
  options = {}
) {
  const normalizedParams = {
    page: Math.max(
      Number(params.page) || 1,
      1
    ),

    limit: Math.min(
      Math.max(
        Number(params.limit) || 20,
        1
      ),
      100
    ),

    search:
      params.search?.trim() || "",

    classId:
      classId || "",

    status:
      params.status || "",
  };

  return useQuery({
    queryKey: studentKeys.byClass(
      classId,
      normalizedParams
    ),

    queryFn: async () => {
      const res =
        await getStudents(
          normalizedParams
        );

      const payload =
        res?.data?.data ??
        res?.data ??
        {};

      return {
        students:
          Array.isArray(
            payload?.students
          )
            ? payload.students
            : Array.isArray(
                payload?.data
              )
            ? payload.data
            : [],

        pagination:
          payload?.pagination ?? {
            page:
              normalizedParams.page,

            limit:
              normalizedParams.limit,

            total: 0,

            totalPages: 0,
          },
      };
    },

    enabled:
      Boolean(classId) &&
      options.enabled !== false,

    staleTime: 1000 * 30,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,

    retry: 1,

    placeholderData:
      (previousData) =>
        previousData,

    ...options,
  });
}

// ======================================================
// STUDENT BY ID
// ======================================================

export function useStudentById(
  studentId,
  options = {}
) {
  return useQuery({
    queryKey:
      studentKeys.profile(
        studentId
      ),

    queryFn: async () => {
      const res =
        await getStudentById(
          studentId
        );

      return (
        res?.data?.data ??
        res?.data ??
        null
      );
    },

    enabled:
      Boolean(studentId) &&
      options.enabled !== false,

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 10,

    refetchOnWindowFocus: false,

    retry: 1,

    ...options,
  });
}

// ======================================================
// ADMIN UPDATE
// ======================================================

export function useUpdateStudentByAdmin() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      data,
    }) =>
      updateStudentByAdmin(
        studentId,
        data
      ),

    onSuccess: (
      _res,
      variables
    ) => {
      toast.success(
        "Student updated successfully"
      );

      // Refresh every paginated list
      queryClient.invalidateQueries({
        queryKey: studentKeys.lists(),
      });

      // Refresh single student
      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            variables.studentId
          ),
      });

      // Refresh class-wise lists
      invalidateByClassLists(
        queryClient
      );

      // Refresh LEFT archive
      queryClient.invalidateQueries({
        queryKey:
          studentKeys.left(),
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to update student"
        )
      );
    },
  });
}

// ======================================================
// MARK STUDENT LEFT
// ======================================================

export function useMarkStudentLeft() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      reason,
    }) =>
      markStudentLeft(
        studentId,
        reason
      ),

    onSuccess: (
      _res,
      variables
    ) => {
      toast.success(
        "Student marked as left"
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            variables.studentId
          ),
      });

      invalidateByClassLists(
        queryClient
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.left(),
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to mark student as left"
        )
      );
    },
  });
}

// ======================================================
// REACTIVATE STUDENT
// ======================================================

export function useReactivateStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: (studentId) =>
      reactivateStudent(studentId),

    onSuccess: (
      _res,
      studentId
    ) => {
      toast.success(
        "Student reactivated"
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            studentId
          ),
      });

      invalidateByClassLists(
        queryClient
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.left(),
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to reactivate student"
        )
      );
    },
  });
}

// ======================================================
// LEFT STUDENTS
// ======================================================

export function useLeftStudents(
  options = {}
) {
  return useQuery({
    queryKey:
      studentKeys.left(),

    queryFn: async () => {
      const res =
        await getLeftStudents();

      return (
        res?.data?.data ??
        res?.data ??
        []
      );
    },

    staleTime: 1000 * 30,

    refetchOnWindowFocus: false,

    retry: 1,

    ...options,
  });
}

// ======================================================
// AADHAR UPLOAD
// ======================================================

export function useUploadStudentAadhar() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      formData,
    }) =>
      uploadStudentAadhar(
        studentId,
        formData
      ),

    onSuccess: (
      _res,
      variables
    ) => {
      toast.success(
        "Aadhar card uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            variables.studentId
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      invalidateByClassLists(
        queryClient
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to upload Aadhar card"
        )
      );
    },
  });
}

// ======================================================
// DOCUMENT UPLOAD
// ======================================================

export function useUploadStudentDocument() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      formData,
    }) =>
      uploadStudentDocument(
        studentId,
        formData
      ),

    onSuccess: (
      _res,
      variables
    ) => {
      toast.success(
        "Document(s) uploaded successfully"
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            variables.studentId
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      invalidateByClassLists(
        queryClient
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to upload document"
        )
      );
    },
  });
}

// ======================================================
// DELETE DOCUMENT
// ======================================================

export function useDeleteStudentDocument() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      studentId,
      documentId,
    }) =>
      deleteStudentDocument(
        studentId,
        documentId
      ),

    onSuccess: (
      _res,
      variables
    ) => {
      toast.success(
        "Document removed successfully"
      );

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.profile(
            variables.studentId
          ),
      });

      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      invalidateByClassLists(
        queryClient
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to remove document"
        )
      );
    },
  });
}

// ======================================================
// DELETE STUDENT
// ======================================================

export function useDeleteStudent() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn:
      deleteStudent,

    onSuccess: (
      _res,
      studentId
    ) => {
      toast.success(
        "Student deleted successfully"
      );

      queryClient.removeQueries({
        queryKey:
          studentKeys.profile(
            studentId
          ),
      });

      // Refresh paginated lists
      queryClient.invalidateQueries({
        queryKey:
          studentKeys.lists(),
      });

      // Refresh class-wise lists
      invalidateByClassLists(
        queryClient
      );

      // Refresh LEFT archive
      queryClient.invalidateQueries({
        queryKey:
          studentKeys.left(),
      });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to delete student"
        )
      );
    },
  });
}

// ======================================================
// ADMIN PDF
// ======================================================

export function useDownloadStudentProfile() {
  return useMutation({
    mutationFn: async ({
      studentId,
      studentName,
    }) => {
      const res =
        await downloadStudentProfilePdf(
          studentId
        );

      triggerBlobDownload(
        res.data,
        `${safeFilename(
          studentName
        )}_profile.pdf`
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to download profile"
        )
      );
    },
  });
}

// ======================================================
// MY PDF
// ======================================================

export function useDownloadMyStudentProfile() {
  return useMutation({
    mutationFn: async () => {
      const res =
        await downloadMyStudentProfilePdf();

      triggerBlobDownload(
        res.data,
        "my_profile.pdf"
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          "Failed to download profile"
        )
      );
    },
  });
}