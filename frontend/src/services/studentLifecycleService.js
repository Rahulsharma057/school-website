// FIX: this file used to call a separate "/student-lifecycle/*" API prefix
// that the backend no longer exposes (lifecycle actions were merged into
// the main student routes under "/students/*"). Rather than leaving two
// diverging copies of this logic around, this file now just re-exports
// the corrected functions from studentService.js.
//
// Recommended: update any imports of this file to import directly from
// "./studentService" instead, then delete this file once nothing
// references it anymore.

export {
  markStudentLeft,
  reactivateStudent,
  getLeftStudents,
} from "./studentService";
