// backend/utils/dateUtils.js

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getDifferenceInDays = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.floor((date2 - date1) / (1000 * 60 * 60 * 24));
};

const isYesterday = (today, lastDay) => {
  if (!lastDay) return false;
  return getDifferenceInDays(lastDay, today) === 1;
};

module.exports = {
  getToday,
  isYesterday,
  getDifferenceInDays,
};
