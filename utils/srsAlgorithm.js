export function calculateNextReview(performance) {
  const now = new Date();

  if (performance === "easy") return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later
  if (performance === "medium") return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day later
  if (performance === "hard") return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours later

  return new Date(now.getTime() + 12 * 60 * 60 * 1000); // default 12 hours later
}
