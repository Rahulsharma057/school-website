const Holiday = require("../models/Holiday");

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const getHolidayDateSet = async (fromDate, toDate) => {
  const holidays = await Holiday.find({ date: { $gte: fromDate, $lte: toDate } });
  return new Set(holidays.map((h) => toDateKey(h.date)));
};

const isNonWorkingDay = (date, holidayDateSet) => {
  return date.getDay() === 0 || holidayDateSet.has(toDateKey(date));
};

// NEW — range ke andar sirf working days count karo (Sunday/Holiday exclude)
// Leave aur Salary dono isi se hisaab lagayenge, taaki denominator
// (workingDays) aur numerator (paidLeaveDays) hamesha same basis pe rahein
const countWorkingDaysInRange = (start, end, holidayDateSet) => {
  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!isNonWorkingDay(d, holidayDateSet)) count++;
  }
  return count;
};

module.exports = { toDateKey, getHolidayDateSet, isNonWorkingDay, countWorkingDaysInRange };