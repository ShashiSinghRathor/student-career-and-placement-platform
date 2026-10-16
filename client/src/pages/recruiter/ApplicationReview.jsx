import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Building2, Calendar, Link as LinkIcon, Check, X, GraduationCap, FileText, Mail } from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState } from "../../components/ui/States";
import { formatDate, initials, statusColor, statusColor as sc, APP_STATUSES } from "../../utils/format";

export default function ApplicationReview() {
  const { id } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.get(`/applications/${id}`)
      .then(r => setApp(r.data.application))
      .catch(e => setError(getError(e)));
  }, [id]);

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  if (!app) return <Spinner />;

  const job = app.jobId || {};
  const student = app.studentId || {};
  const profile = app.studentProfile || {};
  const company = job.companyId || {};
  const currentIdx = APP_STATUSES.indexOf(app.status);

  const setStatus = async (s) => {
    try {
      await api.put(`/applications/${id}/status`, { status: s });
      toast.success(`Status updated to ${s}`);
      window.location.reload();
    } catch (e) { toast.error(getError(e)); }
  };

  const scheduleInterview = async () => {
    if (!interviewDate || !interviewTime) return;
    try {
      await api.post("/interviews", {
        applicationId: id,
        date: interviewDate,
        time: interviewTime,
        type: interviewType,
        interviewer: interviewInterviewer,
      });
      toast.success("Interview scheduled");
      window.location.reload();
    } catch (e) { toast.error(getError(e)); }
  };

  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewType, setInterviewType] = useState("Online");
  const [interviewInterviewer, setInterviewInterviewer] = useState("");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/recruiter/applicants" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft size={16} /> Back to applicants</Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-600 overflow-hidden">
              {student.profileImage ? <img src={student.profileImage} alt="" className="h-full w-full object-cover" /> : initials(student.name)}
            </div>
            <div>
              <Link to={`/recruiter/applicants/${app._id}`} className="font-semibold text-slate-900 hover:text-brand-700">{student.name}</Link>
              <p className="text-sm text-slate-500">{student.email}</p>
            </div>
          </div>
          <span className={`badge ${statusColor(app.status)}`}>{app.status}</span>
        </div>
      </div>

      {/* Job + company */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Applied for</h3>
          <p className="mt-1 text-lg font-semibold text-slate-800">{job.title}</p>
          <p className="text-sm text-slate-500">{company.name}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {job.location && <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-400" /> {job.location}</span>}
            {job.salary && job.salary.max > 0 && <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" /> {job.salary?.min && job.salary?.max ? `${job.salary.min} – ${job.salary.max}` : job.salary.max} LPA</span>}
            <span className="flex items-center gap-1"><Clock size={14} className="text-slate-400" /> Applied {formatDate(app.appliedAt)}</span>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">About the student</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p><strong>College:</strong> {profile.college || "—"}</p>
            <p><strong>Degree:</strong> {profile.degree || "—"}</p>
            <p><strong>Branch:</strong> {profile.branch || "—"}</p>
            <p><strong>Graduation:</strong> {profile.graduationYear || "—"}</p>
            <p><strong>CGPA:</strong> {profile.cgpa != null ? profile.cgpa : "—"}</p>
            <p><strong>Location:</strong> {profile.location || "—"}</p>
          </div>
          {profile.bio && <p className="mt-2 text-sm text-slate-500">{profile.bio}</p>}
        </div>
      </div>

      {/* Skills */}
      {profile.skills?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.skills.map(s => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
      )}

      {/* Projects */}
      {profile.projects?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Projects</h3>
          <div className="mt-3 space-y-3">
            {profile.projects.map((p, i) => (
              <div key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="font-medium text-slate-800">{p.title}</p>
                {p.description && <p className="mt-1 text-sm text-slate-600">{p.description}</p>}
                {p.techStack?.length && <div className="mt-1.5 flex flex-wrap gap-1">{p.techStack.map(t => <span key={t} className="chip">{t}</span>)}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {profile.education?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Education</h3>
          <div className="mt-3 space-y-2">
            {profile.education.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">{e.school}</span>
                <span className="text-slate-400">{e.degree}</span>
                {e.endYear && <span> • {e.endYear}</span>}
                {e.score && <span className="text-slate-500"> • {e.score}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resume */}
      {(app.resumeUrl || profile.resumeUrl) && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Resume</h3>
          <a href={app.resumeUrl || profile.resumeUrl} target="_blank" className="btn btn-primary btn-sm mt-2 inline-flex">
            <FileText size={15} /> View Resume
          </a>
        </div>
      )}

      {/* Cover letter */}
      {app.coverLetter && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Cover Letter</h3>
          <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{app.coverLetter}</p>
        </div>
      )}

      {/* Status timeline + actions */}
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

        <div className="mt-6 flex flex-wrap gap-2">
          {app.status !== "Selected" && app.status !== "Rejected" && (
            <>
              <button className={`btn btn-sm ${app.status === "Under Review" || app.status === "Applied" ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatus("Under Review")}>Move to Under Review</button>
              <button className="btn btn-primary btn-sm" onClick={() => setStatus("Shortlisted")}>Shortlist</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setStatus("Rejected")}>Reject</button>
              <button className="btn btn-secondary btn-sm" disabled={app.status !== "Shortlisted" && app.status !== "Interview Scheduled"}>Schedule Interview</button>
              {(app.status === "Shortlisted" || app.status === "Interview Scheduled") && (
                <div className="flex flex-col gap-2 sm:ml-4">
                  <input type="date" className="input" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} placeholder="Date" />
                  <input type="time" className="input" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} />
                  <select className="input" value={interviewType} onChange={e => setInterviewType(e.target.value)}>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Phone">Phone</option>
                  </select>
                  <input className="input" placeholder="Interviewer name" value={interviewInterviewer} onChange={e => setInterviewInterviewer(e.target.value)} />
                  <button className="btn btn-primary btn-sm" onClick={scheduleInterview} disabled={!interviewDate || !interviewTime}>Schedule</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interviews already scheduled */}
      {app.interviews?.length > 0 && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-slate-900">Scheduled interviews</h3>
          <div className="mt-3 space-y-3">
            {app.interviews.map((iv) => (
              <div key={iv._id} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{iv.round}</p>
                  <p className="text-sm text-slate-500">{formatDate(iv.date)} at {iv.time}</p>
                  <p className="text-xs text-slate-400">{iv.type}{iv.location ? ` — ${iv.location}` : ""}</p>
                  {iv.interviewer && <p className="mt-0.5 text-xs text-slate-500">Interviewer: {iv.interviewer}</p>}
                  {iv.notes && <p className="mt-0.5 text-xs text-slate-400 italic">Notes: {iv.notes}</p>}
                </div>
                <span className={`badge ${iv.status === "Scheduled" ? "bg-brand-50 text-brand-700" : "bg-emerald-50 text-emerald-700"}`}>{iv.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
