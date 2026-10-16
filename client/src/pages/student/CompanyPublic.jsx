import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Globe, Building2, Users, ExternalLink, Briefcase } from "lucide-react";
import api, { getError } from "../../services/api";
import { Spinner, ErrorState } from "../../components/ui/States";
import { formatDate, salaryText, daysLeft } from "../../utils/format";

export default function CompanyPublic() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    Promise.all([
      api.get(`/admin/companies`),
      api.get(`/jobs?companyId=${id}&limit=30`),
    ]).then(async ([resC, resJ]) => {
      const allCompanies = resC.data.companies || [];
      const matched = allCompanies.find((c) => c._id === id) || { name: "Unknown Company" };
      setCompany({ ...matched, _id: id });
      setJobs(resJ.data.jobs || []);
    }).catch((e) => setError(getError(e)));
  }, [id]);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!company) return <Spinner />;

  const openCount = jobs.filter((j) => j.status === "active" && daysLeft(j.deadline) > 0).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/jobs" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} />Back to jobs</Link>

      {/* Company card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-500 overflow-hidden">
            {company.logo ? <img src={company.logo} alt="" className="h-full w-full object-cover" onChange={(e) => e.target.style.display = "none"} /> : (company.name || "C").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              {company.verified && <span className="badge bg-emerald-50 text-emerald-700">Verified</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              {company.industry && <span className="flex items-center gap-1"><Building2 size={15} className="text-slate-400" /> {company.industry}</span>}
              {company.size && <span className="flex items-center gap-1"><Users size={15} className="text-slate-400" /> {company.size} employees</span>}
              {company.founded && <span>Founded {company.founded}</span>}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
              {company.location && <span className="flex items-center gap-1"><MapPin size={15} className="text-slate-400" /> {company.location}</span>}
              {company.website && (
                <a href={company.website} target="_blank" className="flex items-center gap-1 text-slate-600 hover:text-brand-600">
                  <Globe size={15} /> {company.website.replace(/https?:\/\//, "")}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
        {company.description && <p className="mt-4 text-sm text-slate-600 whitespace-pre-line">{company.description}</p>}
      </div>

      {/* Open positions */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900"><Briefcase size={18} className="text-brand-600" /> Open Positions</h2>
          <span className="badge bg-slate-100 text-slate-600">{openCount} open</span>
        </div>
        {jobs.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No open positions right now. Check back later.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-50 sm:grid sm:grid-cols-2 sm:gap-x-6">
            {jobs.map((job) => {
              const expired = daysLeft(job.deadline) === 0;
              return (
                <div key={job._id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        {job.status !== "active" && <span className="badge bg-slate-100 text-slate-500 text-[10px]">{job.status}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500 capitalize">{job.jobType?.replace("-", " ")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {job.location}</span>
                        <span className="flex items-center gap-1"><Building2 size={11} className="text-slate-400" /> {salaryText(job.salary)}</span>
                        {expired ? <span className="text-rose-500">Deadline passed</span> : <span className="text-slate-400">Apply by {formatDate(job.deadline)}</span>}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(job.requiredSkills || []).slice(0, 4).map((s) => (
                          <span key={s} className="chip">{s}</span>
                        ))}
                        {job.requiredSkills?.length > 4 && <span className="text-xs text-slate-400">+{job.requiredSkills.length - 4}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-50 pt-3">
                    <Link to={`/jobs/${job._id}`} className="text-xs font-semibold text-brand-600 hover:text-brand-700">View details</Link>
                    {!expired && job.applyable !== false && (
                      <Link to="/login" className="btn btn-primary btn-sm">Apply</Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
