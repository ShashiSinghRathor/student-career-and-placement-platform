import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Clock, IndianRupee, Building2, Bookmark, BookmarkCheck, ArrowLeft, ListChecks, GraduationCap, Zap } from "lucide-react";
import api, { getError } from "../../services/api";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { useToast } from "../../context/ToastContext";
import { salaryText, formatDate, daysLeft, statusColor, APP_STATUSES } from "../../utils/format";

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    setError("");
    api.get(`/jobs/${id}`).then((r) => setJob(r.data.job)).catch((e) => setError(getError(e)));
  };
  useEffect(() => { load(); window.scrollTo(0, 0); }, [id]); // eslint-disable-line

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!job) return <Spinner />;

  const company = job.companyId || {};
  const dl = daysLeft(job.deadline);
  const expired = dl === 0;

  const toggleSave = async () => {
    try {
      const res = await api.post(`/saved-jobs/${job._id}/toggle`);
      toast.success(res.data.message);
      setJob((j) => ({ ...j, saved: res.data.saved }));
    } catch (e) { toast.error(getError(e)); }
  };

  const submitApply = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.post(`/jobs/${job._id}/apply`, { coverLetter });
      toast.success(res.data.message || "Application submitted!");
      setApplyOpen(false);
      navigate("/applications");
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back</button>

      {/* Header card */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-500 overflow-hidden">
            {company.logo ? <img src={company.logo} alt={company.name} className="h-full w-full object-cover" /> : (company.name || "J").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
              {job.matchPercent > 0 && <span className="badge bg-emerald-50 text-emerald-700"><Zap size={12} /> {job.matchPercent}% Skill Match</span>}
            </div>
            <Link to={`/companies/${company._id}`} className="mt-1 flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
              <Building2 size={15} /> {company.name} {company.verified && <span className="text-emerald-500">✓</span>}
            </Link>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1"><MapPin size={15} className="text-slate-400" /> {job.location} • <span className="capitalize">{job.mode}</span></span>
              <span className="flex items-center gap-1 capitalize"><Clock size={15} className="text-slate-400" /> {job.jobType?.replace("-", " ")} • {job.experience}</span>
              <span className="flex items-center gap-1"><IndianRupee size={15} className="text-slate-400" /> {salaryText(job.salary)}</span>
              <span className="flex items-center gap-1"><Clock size={15} className="text-slate-400" /> Apply by {formatDate(job.deadline)} ({expired ? "expired" : `${dl}d left`})</span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-40">
            {job.applied ? (
              <button disabled className="btn-secondary w-full">Applied ✓ <span className={`badge ${statusColor(job.appliedStatus)}`}>{job.appliedStatus}</span></button>
            ) : (
              <button className="btn-primary w-full" disabled={expired} onClick={() => setApplyOpen(true)}>
                {expired ? "Deadline passed" : "Apply Now"}
              </button>
            )}
            <button className="btn-secondary w-full" onClick={toggleSave}>
              {job.saved ? <><BookmarkCheck size={16} /> Saved</> : <><Bookmark size={16} /> Save Job</>}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900">Job Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{job.description}</p>
            {job.responsibilities?.length > 0 && (
              <>
                <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-900"><ListChecks size={16} className="text-brand-600" /> Responsibilities</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {job.responsibilities.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand-500">•</span>{r}</li>)}
                </ul>
              </>
            )}
            {job.requirements?.length > 0 && (
              <>
                <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-900"><GraduationCap size={16} className="text-brand-600" /> Requirements</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                  {job.requirements.map((r, i) => <li key={i} className="flex gap-2"><span className="text-brand-500">•</span>{r}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Required skills</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.requiredSkills?.map((s) => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">Eligibility</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {job.eligibility?.minCgpa ? <li>Minimum CGPA: <strong>{job.eligibility.minCgpa}</strong></li> : null}
              {job.eligibility?.gradYear?.length ? <li>Graduation year: <strong>{job.eligibility.gradYear.join(", ")}</strong></li> : null}
              {job.eligibility?.allowedBranches?.length ? <li>Branches: <strong>{job.eligibility.allowedBranches.join(", ")}</strong></li> : <li>Open to all branches</li>}
              <li>Openings: <strong>{job.openings}</strong></li>
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900">About {company.name}</h3>
            <p className="mt-2 line-clamp-4 text-sm text-slate-500">{company.description || "Visit the company page to know more."}</p>
            <Link to={`/companies/${company._id}`} className="mt-3 inline-block text-xs font-semibold text-brand-600 hover:text-brand-700">View company profile →</Link>
          </div>
        </div>
      </div>

      {/* Apply modal */}
      {applyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={() => !busy && setApplyOpen(false)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900">Apply for {job.title}</h2>
            <p className="mt-1 text-sm text-slate-500">Your profile resume will be used. You can also add a cover letter.</p>
            <form onSubmit={submitApply} className="mt-5 space-y-4">
              <div>
                <label className="label">Cover letter (optional)</label>
                <textarea
                  className="input min-h-32"
                  rows={6}
                  maxLength={4000}
                  placeholder="Briefly tell the recruiter why you're a great fit…"
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" disabled={busy} onClick={() => setApplyOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary flex-1" disabled={busy}>{busy ? "Submitting…" : "Submit Application"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
