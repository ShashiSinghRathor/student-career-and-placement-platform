import { useEffect, useState, useCallback } from "react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { Check, X, Clock, MapPin, Briefcase } from "lucide-react";
import { formatDate, daysLeft, salaryText } from "../../utils/format";

export default function AdminJobs() {
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/jobs", { params: { status, page } });
      setJobs(res.data.jobs || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [status, page]);
  useEffect(load, [load]);

  const moderate = async (id, action, reason) => {
    try {
      await api.put(`/admin/jobs/${id}/moderate`, { action, reason });
      toast.success(`Job ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "closed"}`);
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const pendingCount = jobs.filter(j => j.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Approvals</h1>
          <p className="text-sm text-slate-500">Review and approve job / internship postings.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All</option>
            {["pending","active","rejected","closed","draft"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="badge bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full">{pendingCount} pending review</div>
      )}

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : jobs.length === 0 ? (
        <EmptyState title="No jobs" subtitle="Jobs will appear here as recruiters post them." />
      ) : (
        <div className="space-y-3">
          {jobs.map(job => {
            const company = job.companyId || {};
            const dl = daysLeft(job.deadline);
            const expired = dl === 0;
            return (
              <div key={job._id} className="card p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <span className={`badge ml-2 ${job.status === "active" ? "bg-emerald-50 text-emerald-700" : job.status === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{job.status}</span>
                      {job.rejectionReason && <span className="text-xs text-rose-500">{job.rejectionReason}</span>}
                    </div>
                    <p className="text-sm text-slate-500">
                      <span className="font-medium text-slate-700">{company.name || "Company"}</span>
                      {" • "}
                      <span className="capitalize">{job.jobType?.replace("-", " ")}</span>
                      {" • "}
                      <span className="flex items-center gap-1"><MapPin size={12} className="inline" /> {job.location}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                      {job.salary && (job.salary.min > 0 || job.salary.max > 0) && <span className="flex items-center gap-1"><Briefcase size={12} className="inline" /> {salaryText(job.salary)}</span>}
                      {job.deadline && <span className="flex items-center gap-1"><Clock size={12} className="inline" /> {expired ? "Expired" : `Deadline ${formatDate(job.deadline)}`}</span>}
                      <span className="flex items-center gap-1 text-slate-400">Posted {formatDate(job.createdAt)}</span>
                    </div>
                    {job.requiredSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {job.requiredSkills.slice(0, 4).map(s => <span key={s} className="chip">{s}</span>)}
                        {job.requiredSkills.length > 4 && <span className="text-xs text-slate-400">+{job.requiredSkills.length - 4}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 sm:justify-end">
                    {job.status === "pending" && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => moderate(job._id, "approve")}><Check size={14} /> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          const r = prompt("Reason for rejection (optional):");
                          moderate(job._id, "reject", r || undefined);
                        }}><X size={14} /> Reject</button>
                      </>
                    )}
                    {job.status === "active" && (
                      <button className="btn btn-secondary btn-sm" onClick={() => moderate(job._id, "close")}>Close</button>
                    )}
                    {job.status === "rejected" && (
                      <button className="btn btn-secondary btn-sm" onClick={() => moderate(job._id, "approve")}>Re-approve</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          <span className="text-sm text-slate-500">Page {page} of {meta.totalPages}</span>
          <button className="btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
