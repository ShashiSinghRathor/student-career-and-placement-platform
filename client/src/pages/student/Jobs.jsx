import { useEffect, useCallback, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import api, { getError } from "../../services/api";
import JobCard from "../../components/jobs/JobCard";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { useToast } from "../../context/ToastContext";

const TYPES = ["", "internship", "full-time", "part-time", "contract"];
const MODES = ["", "onsite", "remote", "hybrid"];
const EXPERIENCE = ["", "fresher", "1-3 years", "3-5 years", "5+ years"];
const SORTS = [["newest", "Newest first"], ["deadline", "Deadline soonest"], ["salary", "Highest salary"], ["oldest", "Oldest first"]];

export default function StudentJobs() {
  const [params, setParams] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const get = (k) => params.get(k) || "";
  const page = parseInt(params.get("page") || "1", 10);

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v && v !== "all" ? next.set(k, v) : next.delete(k)));
    if (!patch.page) next.delete("page");
    setParams(next, { replace: true });
  };

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/jobs", { params: Object.fromEntries(params) });
      setJobs(res.data.jobs || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) {
      setError(getError(e));
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { load(); }, [load]);

  const apply = async (job) => {
    setApplyingId(job._id);
    try {
      const res = await api.post(`/jobs/${job._id}/apply`, {});
      toast.success(res.data.message || "Application submitted!");
      update({ refresh: Date.now() });
      setTimeout(() => navigate("/applications"), 900);
    } catch (e) {
      toast.error(getError(e));
    } finally {
      setApplyingId(null);
    }
  };

  const toggleSave = async (job) => {
    try {
      const res = await api.post(`/saved-jobs/${job._id}/toggle`);
      toast.success(res.data.message);
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, saved: res.data.saved } : j)));
    } catch (e) {
      toast.error(getError(e));
    }
  };

  const activeFilters = ["location", "type", "mode", "experience", "skills", "minSalary"].filter((k) => get(k));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Find Jobs</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? "Searching…" : `${meta.total} opportunities match your search`}</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={get("sort") || "newest"} onChange={(e) => update({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="btn-secondary lg:hidden" onClick={() => setShowFilters((s) => !s)}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-11"
            placeholder="Search by job title, company, skill or location…"
            value={get("q")}
            onChange={(e) => update({ q: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && update({ q: get("q") })}
          />
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? "block" : "hidden"} w-full shrink-0 space-y-4 lg:block lg:w-64`}>
          <div className="card space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><SlidersHorizontal size={15} /> Filters</p>
              {activeFilters.length > 0 && (
                <button onClick={() => { setParams(new URLSearchParams(), { replace: true }); }} className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700">
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="e.g. Bengaluru" value={get("location")} onChange={(e) => update({ location: e.target.value })} />
            </div>
            <div>
              <label className="label">Job type</label>
              <select className="input" value={get("type")} onChange={(e) => update({ type: e.target.value })}>
                {TYPES.map((t) => <option key={t} value={t}>{t ? t.replace("-", " ") : "All types"}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Work mode</label>
              <select className="input" value={get("mode")} onChange={(e) => update({ mode: e.target.value })}>
                {MODES.map((t) => <option key={t} value={t}>{t ? t : "All modes"}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Experience</label>
              <select className="input" value={get("experience")} onChange={(e) => update({ experience: e.target.value })}>
                {EXPERIENCE.map((t) => <option key={t} value={t}>{t || "Any experience"}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Skills</label>
              <input className="input" placeholder="e.g. React, Python" value={get("skills")} onChange={(e) => update({ skills: e.target.value })} />
            </div>
            <div>
              <label className="label">Min monthly stipend / salary (₹)</label>
              <input type="number" className="input" placeholder="e.g. 15000" min="0" value={get("minSalary")} onChange={(e) => update({ minSalary: e.target.value })} />
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => <div key={i} className="card h-56 skeleton" />)}
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : jobs.length === 0 ? (
            <EmptyState title="No jobs found" subtitle="Try adjusting your search or filters to see more results." />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job) => (
                  <JobCard key={job._id} job={job} onApply={apply} applying={applyingId === job._id} onSaveToggle={toggleSave} />
                ))}
              </div>
              {meta.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => update({ page: page - 1 })}>← Prev</button>
                  <span className="text-sm text-slate-500">Page {page} of {meta.totalPages}</span>
                  <button className="btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => update({ page: page + 1 })}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
