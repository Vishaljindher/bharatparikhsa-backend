// utils/testTypeMapper.js

export const getTestType = (title = "") => {
  const lower = title.toLowerCase();

  if (lower.includes("timed")) return "timed";
  if (lower.includes("exam")) return "exam";
  if (lower.includes("adaptive")) return "adaptive";
  if (lower.includes("practice")) return "practice";

  // default agar kuch match nahi hua
  return "normal";
};
