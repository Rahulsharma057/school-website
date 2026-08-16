const TeacherAssignment = require("../models/TeacherAssignment");
const StudentProfile = require("../models/StudentProfile");

const STAFF_ROLES = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];

// ye check karta hai — kya ye user is group ka member hai (ya staff hai, isliye oversight ke liye access hai)
const canAccessGroup = async (user, group) => {
  if (STAFF_ROLES.includes(user.role)) return true; // staff har group dekh/monitor kar sakta hai

  if (group.type === "SCHOOL") return true; // sabko access

  if (group.type === "TEACHERS") return user.role === "TEACHER";

  if (group.type === "CLASS") {
    if (user.role === "STUDENT") {
      const profile = await StudentProfile.findOne({ user: user._id }).select("class").lean();
      return profile && String(profile.class) === String(group.class);
    }
    if (user.role === "TEACHER") {
      const assignment = await TeacherAssignment.findOne({
        teacher: user._id,
        class: group.class,
        status: "ACTIVE",
      }).lean();
      return !!assignment;
    }
    return false;
  }

  if (group.type === "CUSTOM") {
    return group.members.some((m) => String(m) === String(user._id));
  }

  return false;
};

// ye user ke saare accessible groups nikalta hai (student/teacher ke "My Groups" list ke liye)
const getAccessibleGroupIds = async (user, ChatGroup) => {
  const STAFF = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"];
  if (STAFF.includes(user.role)) {
    return null; // null = "sab dikhao", staff ke liye special-case handle honge caller mein
  }

  const orConditions = [{ type: "SCHOOL" }];

  if (user.role === "TEACHER") {
    orConditions.push({ type: "TEACHERS" });

    const assignments = await TeacherAssignment.find({ teacher: user._id, status: "ACTIVE" }).select("class").lean();
    const classIds = [...new Set(assignments.map((a) => String(a.class)))];
    if (classIds.length > 0) orConditions.push({ type: "CLASS", class: { $in: classIds } });
  }

  if (user.role === "STUDENT") {
    const profile = await require("../models/StudentProfile").findOne({ user: user._id }).select("class").lean();
    if (profile) orConditions.push({ type: "CLASS", class: profile.class });
  }

  orConditions.push({ type: "CUSTOM", members: user._id });

  const groups = await ChatGroup.find({ $or: orConditions }).select("_id").lean();
  return groups.map((g) => g._id);
};

module.exports = { canAccessGroup, getAccessibleGroupIds, STAFF_ROLES };