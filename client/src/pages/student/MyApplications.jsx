import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronRight, CalendarClock } from "lucide-react";
import api, { getError } from "../../services/api";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { APP_STATUSES, statusColor, formatDate } from "../../utils/format";

function Timeline({ current }) {
  if (current === "Rejected") {
    return <div className="badge bg-rose-50 text-rose-700">Application rejected</div>;
  }
  const idx = Math.max(0, APP_STATUSES.indexOf(current));
  return (
    <div className="flex items-center gap-1.5">
      {APP_STATUSES.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5">
          <div className={`h-2 w-10 rounded-full sm:w-16 ${i <= idx ? (i === idx ? "bg-brand-600" : "bg-emerald-400") : "bg-slate-200"}`} title={s} />
        </div>
      ))}
    </div>
  );
}

export default function MyApplications() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => setPage(1), [status]);

  useEffect(() => {
    setError("");
    api.get(`/applications`, { params: { status, page } })
      .then((r) => setData(r.data))
      .catch((e) => setError(getError(e)));
  }, [status, page]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Track every application from Applied to Selected.</p>
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {[...APP_STATUSES, "Rejected"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setPage(1)} />
      ) : !data ? (
        <Spinner />
      ) : data.applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          subtitle="Start applying to jobs to see them here."
          action={<Link to="/jobs" className="btn-primary btn-sm">Find Jobs</Link>}
        />
      ) : (
        <>
          <div className="space-y-4">
            {data.applications.map((a) => {
              const job = a.jobId || {};
              const company = job.companyId || {};
              const iv = (a.interviews || [])[0];
              return (
                <button
                  key={a._id}
                  onClick={() => navigate(`/applications/${a._id}`)}
                  className="card group w-full p-5 text-left transition hover:shadow-card-hover"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-500 overflow-hidden">
                        {company.logo ? <img src={company.logo} alt="" className="h-full w-full object-cover" /> : (company.name || "J").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{job.title}</p>
                        <p className="text-sm text-slate-500">{company.name} • Applied {formatDate(a.appliedAt)}</p>
                        {iv && (
                          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-brand-700">
                            <CalendarClock size={13} /> Interview: {formatDate(iv.date)} at {iv.time}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Timeline current={a.status} />
                      <span className={`badge shrink-0 ${statusColor(a.status)}`}>{a.status}</span>
                      <ChevronRight size={18} className="hidden shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600 sm:block" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button className="btn-secondary btn-sm" disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}>← Prev</button>
              <span className="text-sm text-slate-500">Page {data.page} of {data.totalPages}</span>
              <button className="btn-secondary btn-sm" disabled={data.page >= data.totalPages} onClick={() => setPage(data.page + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
