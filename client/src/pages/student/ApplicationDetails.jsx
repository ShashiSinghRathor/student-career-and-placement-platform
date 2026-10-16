import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, IndianRupee, Building2, Calendar, Link as LinkIcon, FileText, AlertCircle, Check } from "lucide-react";
import api, { getError } from "../../services/api";
import { Spinner, ErrorState } from "../../components/ui/States";
import { statusColor, formatDate, daysLeft, APP_STATUSES } from "../../utils/format";

export default function ApplicationDetails() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get(`/applications/${id}`)
      .then((r) => setApp(r.data.application))
      .catch((e) => setError(getError(e)));
  }, [id]);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!app) return <Spinner />;

  const job = app.jobId || {};
  const company = job.companyId || {};
  const currentIdx = Math.max(0, APP_STATUSES.indexOf(app.status));
  const expired = daysLeft(job.deadline) === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/applications" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back</Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
            {company.logo ? <img src={company.logo} alt="" className="h-full w-full object-cover" /> : (company.name || "J").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{job.title}</p>
            <Link to={`/companies/${company._id}`} className="mt-0.5 text-sm text-slate-500 hover:text-brand-600 flex items-center gap-1">
              <Building2 size={13} /> {company.name}
            </Link>
          </div>
          <span className={`badge ${statusColor(app.status)}`}>{app.status}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900">Application timeline</h3>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {APP_STATUSES.map((s, i) => (
            <div key={s} className="flex flex-col items-center">
              <div className={`h-2.5 w-2.5 rounded-full ${i < currentIdx ? "bg-emerald-400" : i === currentIdx ? "bg-brand-600" : "bg-slate-200"}`} />
              <span className="mt-1 text-[11px] text-slate-600">{s}</span>
            </div>
          ))}
        </div>
        {app.history?.length > 0 && (
          <div className="mt-5 space-y-3">
            {app.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${i === 0 ? "bg-brand-600" : "bg-emerald-400"}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{h.status}</p>
                  <p className="text-xs text-slate-500">{formatDate(h.at)}, {h.note || "Status update"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interviews */}
      {app.interviews?.length > 0 ? (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Interviews</h3>
          <div className="mt-4 divide-y divide-slate-50">
            {app.interviews.map((iv) => (
              <div key={iv._id} className="flex flex-col gap-2 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{iv.round}</span>
                  <span className={`badge ${iv.status === "Scheduled" ? "bg-brand-50 text-brand-700" : "bg-emerald-50 text-emerald-700"}`}>{iv.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span>{formatDate(iv.date)}</span>
                  <span>{iv.time}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-slate-600">
                  {iv.location && <span className="flex items-center gap-1"><MapPin size={12} /> {iv.location}</span>}
                  {iv.meetingLink && (
                    <a href={iv.meetingLink} target="_blank" className="flex items-center gap-1 text-brand-600 hover:text-brand-700"><LinkIcon size={12} /> Join meeting</a>
                  )}
                  {iv.interviewer && <span>Interviewer: {iv.interviewer}</span>}
                </div>
                {iv.notes && <p className="text-xs text-slate-400 italic">Notes: {iv.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Interviews</h3>
          <p className="mt-2 text-sm text-slate-400">No interviews scheduled yet.</p>
        </div>
      )}

      {/* Company info */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-slate-900">Company</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 text-slate-400" /> {company.location || "—"}</div>
          {company.website && (
            <a href={company.website} target="_blank" className="flex items-center gap-1.5 text-slate-600 hover:text-brand-600"><LinkIcon size={14} /> {company.website}</a>
          )}
          {company.industry && <p><strong>Industry:</strong> {company.industry}</p>}
          {company.size && <p><strong>Company size:</strong> {company.size} employees</p>}
        </div>
        {company.description && <p className="mt-3 text-sm text-slate-500">{company.description}</p>}
      </div>

      {/* Deadline notice */}
      {expired && <div className="card border-rose-100 bg-rose-50 p-4 text-sm text-rose-600">This posting has expired. Applications are no longer being accepted.</div>}
    </div>
  );
}
