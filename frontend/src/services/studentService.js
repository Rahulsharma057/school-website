import api from "./api";

// ======================================================
// CREATE STUDENT
// ======================================================

export const createStudent = (data) => {
  return api.post("/students", data);
};

// ======================================================
// MY PROFILE
// ======================================================

export const getMyStudentProfile = () => {
  return api.get("/students/my-profile");
};

export const updateMyStudentProfile = (data) => {
  return api.patch("/students/my-profile", data);
};

export const uploadMyStudentProfilePhoto = (formData) => {
  return api.post("/students/me/profile-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const downloadMyStudentProfilePdf = () => {
  return api.get("/students/my-profile/download", {
    responseType: "blob",
  });
};

// ======================================================
// MY DOCUMENTS
// ======================================================

export const getMyStudentDocuments = () => {
  return api.get("/students/my-profile/documents");
};

export const uploadMyStudentDocument = (formData) => {
  return api.post("/students/my-profile/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const deleteMyStudentDocument = (documentId) => {
  return api.delete(`/students/my-profile/documents/${documentId}`);
};

// ======================================================
// ADMIN - GET ALL STUDENTS
// SERVER-SIDE PAGINATION
// ======================================================

export const getStudents = (params = {}) => {
  const page = Math.max(Number(params.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(params.limit) || 20, 1),
    100
  );

  return api.get("/students", {
    params: {
      page,
      limit,

      ...(params.search?.trim()
        ? {
            search: params.search.trim(),
          }
        : {}),

      ...(params.classId
        ? {
            classId: params.classId,
          }
        : {}),

      ...(params.status
        ? {
            status: params.status,
          }
        : {}),
    },
  });
};

// ======================================================
// ADMIN - STUDENTS BY CLASS
// SERVER-SIDE PAGINATION
// ======================================================

export const getStudentsByClass = (classId, params = {}) => {
  if (!classId) {
    throw new Error("Class ID is required");
  }

  const page = Math.max(Number(params.page) || 1, 1);

  const limit = Math.min(
    Math.max(Number(params.limit) || 20, 1),
    100
  );

  return api.get(`/students/by-class/${classId}`, {
    params: {
      page,
      limit,

      ...(params.search?.trim()
        ? {
            search: params.search.trim(),
          }
        : {}),

      ...(params.status
        ? {
            status: params.status,
          }
        : {}),
    },
  });
};

// ======================================================
// ADMIN - SINGLE STUDENT
// ======================================================

export const getStudentById = (studentId) => {
  return api.get(`/students/${studentId}`);
};

// ======================================================
// ADMIN - UPDATE STUDENT
// ======================================================

export const updateStudentByAdmin = (studentId, data) => {
  return api.patch(`/students/${studentId}`, data);
};

// ======================================================
// ADMIN - DELETE STUDENT
// ======================================================

export const deleteStudent = (studentId) => {
  return api.delete(`/students/${studentId}`);
};

// ======================================================
// ADMIN - AADHAR
// ======================================================

export const uploadStudentAadhar = (studentId, formData) => {
  return api.post(`/students/${studentId}/aadhar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ======================================================
// ADMIN - OTHER DOCUMENTS
// ======================================================

export const uploadStudentDocument = (studentId, formData) => {
  return api.post(`/students/${studentId}/documents`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// ======================================================
// ADMIN - DELETE DOCUMENT
// ======================================================

export const deleteStudentDocument = (studentId, documentId) => {
  return api.delete(
    `/students/${studentId}/documents/${documentId}`
  );
};

// ======================================================
// ADMIN - STUDENT PROFILE PDF
// ======================================================

export const downloadStudentProfilePdf = (studentId) => {
  return api.get(`/students/${studentId}/download`, {
    responseType: "blob",
  });
};

// ======================================================
// ADMIN - LIFECYCLE
// ======================================================

export const markStudentLeft = (studentProfileId, reason = "") => {
  return api.patch(
    `/students/${studentProfileId}/mark-left`,
    {
      reason: reason?.trim() || "",
    }
  );
};

export const reactivateStudent = (studentProfileId) => {
  return api.patch(
    `/students/${studentProfileId}/reactivate`
  );
};

export const getLeftStudents = () => {
  return api.get("/students/left");
};