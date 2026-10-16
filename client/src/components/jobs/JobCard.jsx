import { MapPin, Clock, Bookmark, BookmarkCheck, Building2, IndianRupee, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate, salaryText, daysLeft } from "../../utils/format";

export default function JobCard({ job, onSaveToggle, applying, onApply, compact }) {
  const navigate = useNavigate();
  const company = job.companyId || {};
  const dl = daysLeft(job.deadline);

  return (
    <div className="card group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
          {company.logo ? (
            <img src={company.logo} alt={company.name} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
          ) : (
            (company.name || "Jo").slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <button onClick={() => navigate(`/jobs/${job._id}`)} className="line-clamp-1 text-left text-base font-semibold text-slate-900 hover:text-brand-700">
            {job.title}
          </button>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
            <Building2 size={13} /> {company.name || "—"}
            <span className="text-slate-300">•</span>
            <span className="capitalize">{job.jobType?.replace("-", " ")}</span>
          </p>
        </div>
        {job.saved !== undefined && (
          <button
            aria-label={job.saved ? "Unsave job" : "Save job"}
            onClick={() => onSaveToggle?.(job)}
            className={`rounded-lg p-2 transition ${job.saved ? "text-brand-600 bg-brand-50" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
          >
            {job.saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
        <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {job.location}</span>
        {job.salary && (job.salary.min > 0 || job.salary.max > 0) && (
          <span className="flex items-center gap-1"><IndianRupee size={14} className="text-slate-400" /> {salaryText(job.salary)}</span>
        )}
        <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" /> {dl > 0 ? `${dl}d left` : "Expired"}</span>
      </div>

      {!compact && job.requiredSkills?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 4).map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
          {job.requiredSkills.length > 4 && <span className="text-xs text-slate-400">+{job.requiredSkills.length - 4}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        {job.matchPercent !== undefined && job.matchPercent > 0 ? (
          <span className="badge bg-emerald-50 text-emerald-700"><Zap size={12} /> {job.matchPercent}% Skill Match</span>
        ) : <span />}
        <div className="flex gap-2">
          <button className="btn-secondary btn-sm" onClick={() => navigate(`/jobs/${job._id}`)}>Details</button>
          {job.applyable !== false && onApply && (
            <button className="btn-primary btn-sm" disabled={applying || job.applied} onClick={() => onApply(job)}>
              {job.applied ? "Applied ✓" : applying ? "Applying…" : "Apply"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
