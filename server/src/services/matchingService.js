const Job = require("../models/Job");

const norm = (s) => (s || "").toString().trim().toLowerCase();
const normSkill = (s) => norm(s).replace(/\bnode\.?js\b/g, "nodejs").replace(/\s+/g, "");

function computeMatch(studentSkills = [], jobSkills = []) {
  const sSet = new Set(studentSkills.map(normSkill).filter(Boolean));
  const jSet = new Set(jobSkills.map(normSkill).filter(Boolean));
  if (!jSet.size) return 0;
  const common = [...jSet].filter((j) => sSet.has(j)).length;
  return Math.round((common / jSet.size) * 100);
}

/**
 * Recommended open jobs for a student, sorted by skill match %.
 * Returns array of { job, matchPercent }.
 */
async function recommendJobs(studentProfile, { limit = 10, page = 1 }) {
  const jobs = await Job.find({
    status: "active",
    deadline: { $gt: new Date() },
  })
    .populate("companyId", "name logo location industry")
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  const studentSkills = studentProfile.skills || [];

  const scored = jobs
    .map((job) => {
      const matchPercent = computeMatch(studentSkills, job.requiredSkills || []);
      return { job, matchPercent };
    })
    .filter((x) => x.matchPercent > 0)
    .sort((a, b) => b.matchPercent - a.matchPercent || new Date(b.job.createdAt) - new Date(a.job.createdAt));

  const start = (page - 1) * limit;
  return {
    items: scored.slice(start, start + limit),
    total: scored.length,
    page,
    totalPages: Math.max(1, Math.ceil(scored.length / limit)),
  };
}

/** Jobs matching a student's computed stats for the dashboard widget */
async function topMatches(studentProfile, topN = 5) {
  const { items } = await recommendJobs(studentProfile, { limit: topN, page: 1 });
  return items;
}

module.exports = { computeMatch, recommendJobs, topMatches, normSkill };
