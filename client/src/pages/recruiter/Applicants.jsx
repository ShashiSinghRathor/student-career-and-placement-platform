import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Search, Filter, User, FileText, Check, X, CalendarClock } from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, EmptyState, ErrorState } from "../../components/ui/States";
import { formatDate, initials, statusColor, APP_STATUSES } from "../../utils/format";

export default function Applicants() {
  const { jobId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jobFilter, setJobFilter] = useState(jobId || "");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const jRes = api.get("/jobs/my/posted");
      const jData = (await jRes).data;
      setJobs(jData.jobs || []);

      const filterJob = jobId || jobFilter;
      const params = { page };
      if (filterJob) params.jobId = filterJob;
      if (statusFilter) params.status = statusFilter;

      const aRes = await api.get("/applications", { params });
      setApplications(aRes.data.applications || []);
      setMeta({ total: aRes.data.total, totalPages: aRes.data.totalPages, page: aRes.data.page });
    } catch (e) {
      setError(getError(e));
    } finally {
      setLoading(false);
    }
  }, [jobId, jobFilter, statusFilter, page]);

  useEffect(load, [load]);

  const openApp = (app) => navigate(`/recruiter/applications/${app._id}`);

  const statusCount = (s) => applications.filter((a) => a.status === s).length;
  const totalForJob = applications.length;

  if (!jobId && jobs.length === 0) {
    return !loading ? (
      <EmptyState title="No jobs posted yet" subtitle="Post your first job to start receiving applicants." action={
        <Link to="/recruiter/jobs/new" className="btn-primary btn-sm">Post a Job</Link>
      } />
    ) : <Spinner />;
  }

  const selectedJob = jobs.find((j) => j._id === jobId) || jobs.find((j) => j._id === jobFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Applicants</h1>
          <p className="mt-1 text-sm text-slate-500">Review, shortlist, and schedule interviews for candidates.</p>
        </div>
      </div>

      {/* Job selector */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={jobId || jobFilter} onChange={(e) => { setJobFilter(e.target.value); setPage(1); }}>
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>{j.title} @ {j.companyId?.name || "Company"}</option>
          ))}
        </select>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {APP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : applications.length === 0 ? (
        <EmptyState title="No applicants yet" subtitle={selectedJob ? `No one has applied to ${selectedJob.title}.` : "Filter by job or status to see applicants."} />
      ) : (
        <>
          {/* Summary chips */}
          {selectedJob && (
            <div className="flex flex-wrap gap-2">
              {APP_STATUSES.map((s) => {
                const c = statusCount(s);
                return c > 0 ? (
                  <span key={s} className="badge flex items-center gap-1.5">{s} {c}</span>
                ) : null;
              })}
            </div>
          )}

          {/* Applicant list */}
          <div className="space-y-3">
            {applications.map((app) => {
              const job = app.jobId || {};
              const student = app.studentId || {};
              const profile = app.studentProfile || {};
              return (
                <div key={app._id} className="card p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
                        {student.profileImage ? <img src={student.profileImage} alt="" className="h-full w-full object-cover" /> : initials(student.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{student.name}</p>
                        <p className="text-sm text-slate-500">{student.email}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-500">
                          {profile.cgpa != null && <span>CGPA: {profile.cgpa}</span>}
                          {profile.branch && <span>Branch: {profile.branch}</span>}
                          {profile.graduationYear && <span>Grad: {profile.graduationYear}</span>}
                          {profile.skills?.length ? <span>Skills: {profile.skills.slice(0, 3).join(", ")}{profile.skills.length > 3 ? ` +${profile.skills.length - 3}` : ""}</span> : null}
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Applied {formatDate(app.appliedAt)} • Resume: {(app.resumeUrl || "").slice(0, 60)}…</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-end">
                      <span className={`badge ${statusColor(app.status)}`}>{app.status}</span>
                      <div className="flex gap-2">
                        <button className="btn btn-danger btn-sm" disabled={app.status === "Selected" || app.status === "Rejected"} onClick={() => {
                          const newStatus = app.status === "Shortlisted" ? "Rejected" : "Shortlisted";
                          api.put(`/applications/${app._id}/status`, { status: newStatus }).then(() => {
                            toast.success(`Moved to ${newStatus}`);
                            load();
                          }).catch(e => toast.error(getError(e)));
                        }}>
                          {app.status === "Shortlisted" ? <><X size={14} /> Reject</> : <><Check size={14} /> Shortlist</>}
                        </button>
                        <button className="btn-secondary btn-sm" onClick={() => openApp(app)}>View</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              <span className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</span>
              <button className="btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
