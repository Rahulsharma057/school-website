// FIX: NEW — add this hook to your existing hooks/useAttendance.js
// alongside useClassAttendance / useMarkAttendance / useUpdateAttendance.
// I don't have your actual axios instance's import path, so adjust the
// `api` import below to match whatever the rest of that file already
// uses (likely the same one useClassAttendance calls through).

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api"; // <-- match this to your project's real axios instance path

const getClassAttendanceReport = ({ classId, from, to }) =>
  api
    .get("/attendance/class/report", { params: { classId, from, to } })
    .then((res) => res.data?.data);

/**
 * Date-range attendance report for a whole class — every active
 * student, with present/absent/leave counts and a percentage, tallied
 * across every marked day in [from, to].
 */
export function useClassAttendanceReport(classId, from, to) {
  return useQuery({
    queryKey: ["attendance-report", classId, from, to],
    queryFn: () => getClassAttendanceReport({ classId, from, to }),
    enabled: Boolean(classId && from && to),
  });
}
