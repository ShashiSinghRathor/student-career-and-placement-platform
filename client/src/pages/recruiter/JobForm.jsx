import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState } from "../../components/ui/States";

const JOB_TYPES = [["internship", "Internship"], ["full-time", "Full-Time"], ["part-time", "Part-Time"], ["contract", "Contract"]];
const MODES = [["onsite", "On-site"], ["remote", "Remote"], ["hybrid", "Hybrid"]];
const EXPERIENCE = [["fresher", "Fresher"], ["1-3 years", "1–3 years"], ["3-5 years", "3–5 years"], ["5+ years", "5+ years"]];

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isNew = !id;

  const [form, setForm] = useState({
    title: "", description: "", responsibilities: "", requirements: "",
    jobType: "internship", mode: "onsite", location: "", salaryMin: "", salaryMax: "",
    durationMonths: "", openings: "1", requiredSkills: "", eligibilityCgpa: "", eligibilityBranches: "", experience: "fresher",
    deadline: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isNew) {
      api.get(`/jobs/${id}`).then(r => {
        const j = r.data.job;
        setForm({
          title: j.title || "", description: j.description || "", responsibilities: (j.responsibilities || []).join("\n") || "",
          requirements: (j.requirements || []).join("\n") || "", jobType: j.jobType || "internship", mode: j.mode || "onsite",
          location: j.location || "", salaryMin: j.salary?.min || "", salaryMax: j.salary?.max || "",
          durationMonths: j.durationMonths || "", openings: j.openings || "1", requiredSkills: (j.requiredSkills || []).join(", "),
          eligibilityCgpa: j.eligibility?.minCgpa || "", eligibilityBranches: (j.eligibility?.allowedBranches || []).join(", "),
          experience: j.experience || "fresher", deadline: j.deadline ? new Date(j.deadline).toISOString().slice(0, 16) : "",
        });
      }).catch(e => setError(getError(e)));
    }
  }, [id, isNew]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        jobType: form.jobType,
        mode: form.mode,
        location: form.location,
        salary: {
          min: form.salaryMin ? parseFloat(form.salaryMin) : undefined,
          max: form.salaryMax ? parseFloat(form.salaryMax) : undefined,
        },
        deadline: form.deadline,
        openings: parseInt(form.openings, 10) || 1,
        requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
        experience: form.experience,
        eligibility: {
          minCgpa: form.eligibilityCgpa ? parseFloat(form.eligibilityCgpa) : undefined,
          allowedBranches: form.eligibilityBranches.split(",").map(s => s.trim()).filter(Boolean),
        },
      };
      if (form.durationMonths) body.durationMonths = parseInt(form.durationMonths, 10);

      const descriptionLines = form.description.split("\n").filter(Boolean);
      if (descriptionLines.length < 1) throw new Error("Description is required");
      if (form.title.length < 3) throw new Error("Title must be at least 3 characters");

      const reqsLines = form.requirements.split("\n").filter(Boolean);
      if (reqsLines.length === 0) throw new Error("Add at least one requirement");

      if (isNew) {
        const res = await api.post("/jobs", body);
        toast.success("Job posted! It will be reviewed and published shortly.");
        navigate("/recruiter/jobs");
      } else {
        await api.put(`/jobs/${id}`, body);
        toast.success("Job updated");
        navigate("/recruiter/jobs");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || getError(err);
      if (msg.includes("Validation failed") || msg.includes("required") || msg.includes("Invalid")) {
        setError(msg);
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/recruiter/jobs" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><span className="text-lg transition-transform hover:translate-x-0.5">← Back</span></Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Post a New Job" : "Edit Job Posting"}</h1>
        <p className="mt-1 text-sm text-slate-500">{isNew ? "Fill in the details below and we'll review it before it goes live." : "Update the job posting details."}</p>
      </div>

      <div className="card p-6 space-y-5">
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Job Title *</label>
              <input className="input" required value={form.title} onChange={set("title")} placeholder="e.g. Software Engineer Intern" />
            </div>
            <div>
              <label className="label">Job Type *</label>
              <select className="input" value={form.jobType} onChange={set("jobType")}>
                {JOB_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Work Mode</label>
              <select className="input" value={form.mode} onChange={set("mode")}>
                {MODES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location *</label>
              <input className="input" required value={form.location} onChange={set("location")} placeholder="e.g. Bengaluru, India" />
            </div>
            <div>
              <label className="label">Salary / Stipend (monthly ₹)</label>
              <div className="flex gap-2">
                <input type="number" className="input flex-1" value={form.salaryMin} onChange={set("salaryMin")} placeholder="Min" />
                <input type="number" className="input flex-1" value={form.salaryMax} onChange={set("salaryMax")} placeholder="Max" />
              </div>
            </div>
            <div>
              <label className="label">Openings</label>
              <input type="number" min="1" className="input" value={form.openings} onChange={set("openings")} />
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select className="input" value={form.experience} onChange={set("experience")}>
                {EXPERIENCE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Duration (months, for internships)</label>
              <input type="number" className="input" value={form.durationMonths} onChange={set("durationMonths")} placeholder="e.g. 6" />
            </div>
            <div>
              <label className="label">Application Deadline *</label>
              <input type="datetime-local" className="input" required value={form.deadline} onChange={set("deadline")} />
            </div>
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea className="input min-h-28" required value={form.description} onChange={set("description")} placeholder="Describe the role, team, and what the candidate will do." />
          </div>

          <div>
            <label className="label">Responsibilities (one per line)</label>
            <textarea className="input min-h-24" value={form.responsibilities} onChange={set("responsibilities")} placeholder="Design and build features&#10;Collaborate with product&#10;Write clean, tested code" />
          </div>

          <div>
            <label className="label">Requirements (one per line)</label>
            <textarea className="input min-h-24" value={form.requirements} onChange={set("requirements")} placeholder="Pursuing/completed a relevant degree&#10;Working knowledge of React" />
          </div>

          <div>
            <label className="label">Required Skills (comma separated)</label>
            <input className="input" value={form.requiredSkills} onChange={set("requiredSkills")} placeholder="React, Node.js, MongoDB, Git" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Minimum CGPA (0–10)</label>
              <input type="number" step="0.01" min="0" max="10" className="input" value={form.eligibilityCgpa} onChange={set("eligibilityCgpa")} placeholder="e.g. 6.5" />
            </div>
            <div>
              <label className="label">Allowed Branches (optional)</label>
              <input className="input" value={form.eligibilityBranches} onChange={set("eligibilityBranches")} placeholder="Computer Science, IT" />
              <p className="mt-1 text-xs text-slate-400">Leave blank for all branches.</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Saving…" : isNew ? "Post Job" : "Save Changes"}
            </button>
            <Link to="/recruiter/jobs" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
