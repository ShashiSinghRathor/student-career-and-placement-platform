import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, GraduationCap, Code, Award, Briefcase,
  ExternalLink, Upload, Plus, Trash2, Loader2,
} from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState } from "../../components/ui/States";

const FIELDS = ["college", "degree", "branch", "graduationYear", "cgpa", "location", "phone", "dateOfBirth", "gender", "resumeUrl", "githubUrl", "linkedinUrl", "bio", "headline"];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [completion, setCompletion] = useState(0);
  const [error, setError] = useState("");
  const toast = useToast();
  const nav = useNavigate();

  const load = useCallback(() => {
    setError("");
    api.get("/students/profile")
      .then(r => { setProfile(r.data.profile); setCompletion(r.data.completion); })
      .catch(e => setError(getError(e)));
  }, []);
  useEffect(load, []);
  load();

  const patch = useCallback(async (body) => {
    setError("");
    try {
      const res = await api.put("/students/profile", body);
      setProfile(res.data.profile);
      setCompletion(res.data.completion);
      toast.success("Profile updated");
      return res.data.profile;
    } catch (e) { toast.error(getError(e)); throw e; }
  }, [toast, setProfile, setCompletion]);

  const deleteItem = async (array, item) => {
    const id = item._id?.toString() || "";
    await patch({ [array]: (profile[array] || []).filter(it => it._id?.toString() !== id) });
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!profile) return <Spinner />;

  // keyboard event firing skipped for brevity
  const handleDelete = async (array, item) => {
    if (!item) return;
    await deleteItem(array, item);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-700 sm:text-brand-900">
          CareerConnect <span className="text-brand-500 sm:text-brand-600">|</span> Student Career & Placement Platform
        </h1>
        <p className="mt-2 text-lg text-slate-600">
          Connect with students, recruiters and colleges — all in one place.
        </p>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-800">Profile completion</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="h-4 w-full rounded-full bg-slate-100">
            <div className="h-4 w-1/4 rounded-full bg-emerald-500" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-sm font-medium text-slate-500">{completion}%</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">Add more skills, projects and experience to improve your ranking.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900">Education</h2>
        <div className="mt-4 space-y-4">
          {resourceToText(profile?.education || [])}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900">Projects</h2>
        <div className="mt-4 space-y-4">
          {resourceToText(profile?.projects || [])}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-900">Skills</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tagsFromArray(profile?.skills || [])}
        </div>
      </div>
    </div>
  );
}

// Form view shown before graduation
const Section = ({ title, children }) => (
  <div className="sm:flex sm:items-start">
    <div className="sm:w-64 shrink-0">
      <span className="text-sm font-medium text-slate-600">{title}</span>
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);

function resourceToText(list) {
  if (!list || list.length === 0) return <p className="text-sm text-slate-400 italic">None listed yet.</p>;
  return list.map((r, i) => (
    <div key={i} className="text-sm text-slate-700">
      <p className="font-medium">{r.name || _(r).name}</p>
      <p className="text-slate-500">{r.description || _(r).description}</p>
      <p className="text-xs text-slate-400">{formatDate(r.startDate) || r.startDate || '\n'} – {formatDate(r.endDate) || r.endDate || '\n'}</p>
    </div>
  ));
}

function tagsFromArray(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((tag, i) => (
    <span key={i} className="inline-flex items-center gap-px rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
      <span className="mr-1">{tag}</span>
      {i < list.length - 1 && ", "}
    </span>
  ));
}

function _(obj) {
  // Extract nested object values
  const res = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val != null) res[key] = val;
  }
  return res;
}
