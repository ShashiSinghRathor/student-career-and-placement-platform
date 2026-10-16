export const formatDate = (d, opts = {}) => {
  if (!d) return "—";
  const date = new Date(d);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", ...opts });
};

const UNITS = [[31536000000, "year"], [2592000000, "month"], [604800000, "week"], [86400000, "day"], [3600000, "hour"], [60000, "minute"]];

export const timeAgo = (d) => {
  const diff = Date.now() - new Date(d || 0).getTime();
  for (const [ms, name] of UNITS) {
    if (Math.abs(diff) >= ms) return `${Math.round(Math.abs(diff) / ms)} ${name}${Math.round(Math.abs(diff) / ms) > 1 ? "s" : ""} ago`;
  }
  return "just now";
};

export const salaryText = (salary) => {
  if (!salary || (salary.min <= 0 && salary.max <= 0)) return "Not disclosed";
  const L = (v) => (v >= 1000 ? `₹${(v / 100000).toFixed(1).replace(/\.0$/, "")} LPA` : `₹${v}/mo`);
  if (salary.min && salary.max) return `${L(salary.min)} – ${L(salary.max)}`;
  return L(salary.max || salary.min);
};

export const daysLeft = (deadline) => {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((new Date(deadline) - Date.now()) / (24 * 3600 * 1000)));
};

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "CC";

export const APP_STATUSES = ["Applied", "Under Review", "Shortlisted", "Interview Scheduled", "Selected"];

export const statusColor = (status) => {
  const map = {
    Applied: "bg-sky-50 text-sky-700",
    "Under Review": "bg-amber-50 text-amber-700",
    Shortlisted: "bg-violet-50 text-violet-700",
    "Interview Scheduled": "bg-brand-50 text-brand-700",
    Selected: "bg-emerald-50 text-emerald-700",
    Rejected: "bg-rose-50 text-rose-700",
  };
  return map[status] || "bg-slate-100 text-slate-600";
};
