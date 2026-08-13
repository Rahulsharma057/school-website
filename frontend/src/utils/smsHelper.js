// Builds a native "sms:" link so tapping it opens the phone's OWN SMS app
// with the message pre-filled — no paid gateway, no server-side sending,
// works purely through the device's inbox/Messages app.
//
// iOS and Android use slightly different query separators for the body
// param, so we branch on user agent to maximise compatibility.
export function buildSmsLink(phone, message) {
  if (!phone) return null;

  const cleanPhone = String(phone).replace(/[^\d+]/g, "");
  if (!cleanPhone) return null;

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const body = encodeURIComponent(message || "");

  return isIOS ? `sms:${cleanPhone}&body=${body}` : `sms:${cleanPhone}?body=${body}`;
}

// Standard due-fee reminder text. Kept short — SMS apps split long
// messages into multiple segments.
export function buildDueReminderMessage({ studentName, className, totalDue, academicYear }) {
  const classPart = className ? ` (${className})` : "";
  const yearPart = academicYear ? ` for ${academicYear}` : "";
  return `Dear Parent, ${studentName}'s${classPart} school fee of Rs. ${Number(totalDue).toLocaleString("en-IN")} is due${yearPart}. Kindly pay at the earliest. - School Admin`;
}
