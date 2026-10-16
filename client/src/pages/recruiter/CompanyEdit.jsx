import { useEffect, useState } from "react";
import Link from "react-router-dom";
import { Building2, ExternalLink, Upload, Loader2 } from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState } from "../../components/ui/States";

const SIZES = [["1-10", "1–10 employees"], ["11-50", "11–50"], ["51-200", "51–200"], ["201-500", "201–500"], ["501-1000", "501–1,000"], ["1000+", "1,000+"]];

export default function CompanyEdit() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "", description: "", website: "", industry: "", location: "",
    size: "11-50", founded: "", logo: "",
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get("/recruiter/company");
      const c = res.data.company || { name: "", description: "", website: "", industry: "", location: "", size: "11-50", founded: "" };
      setCompany(c);
      setForm({
        name: c.name || "", description: c.description || "", website: c.website || "", industry: c.industry || "",
        location: c.location || "", size: c.size || "11-50", founded: c.founded || "", logo: c.logo || "",
      });
    } catch (e) {
      setError(getError(e));
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const body = {
        name: form.name, description: form.description, website: form.website, industry: form.industry,
        location: form.location, size: form.size, founded: form.founded ? parseInt(form.founded, 10) : undefined, logo: form.logo,
      };
      const res = await api.put("/recruiter/company", body);
      setCompany(res.data.company);
      toast.success("Company profile updated");
    } catch (e) {
      setError(getError(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-500">This is the company profile that job seekers will see.</p>
      </div>

      <div className="card overflow-hidden">
        {/* Logo preview */}
        <div className="flex items-center gap-5 p-5 border-b border-slate-100">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-100 text-xl font-bold text-slate-500 overflow-hidden">
            {form.logo ? <img src={form.logo} alt="" className="h-full w-full object-cover" /> : (form.name || "C").slice(0, 2).toUpperCase()}
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-semibold text-slate-900">{form.name || "Your Company Name"}</p>
            {form.website && <a href={form.website} target="_blank" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 mt-0.5"><ExternalLink size={12} /> {form.website}</a>}
          </div>
          <div className="ml-auto">
            <label className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
              <Upload size={14} /> Change Logo
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append("file", file);
                try {
                  const res = await api.post("/recruiter/company/logo", formData, { headers: { "Content-Type": "multipart/form-data" } });
                  setForm({ ...form, logo: res.data.logo || form.logo });
                  toast.success("Logo updated");
                } catch (err) {
                  toast.error(getError(err));
                }
              }} />
            </label>
          </div>
        </div>

        <form onSubmit={save} className="p-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company Name *</label>
              <input className="input" required value={form.name} onChange={set("name")} placeholder="e.g. TechNova Labs" />
            </div>
            <div>
              <label className="label">Industry</label>
              <input className="input" value={form.industry} onChange={set("industry")} placeholder="e.g. Software Development" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Bengaluru, India" />
            </div>
            <div>
              <label className="label">Company Size</label>
              <select className="input" value={form.size} onChange={set("size")}>
                {SIZES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" type="URL" value={form.website} onChange={set("website")} placeholder="https://example.com" />
            </div>
            <div>
              <label className="label">Founded (year)</label>
              <input type="number" className="input" value={form.founded} onChange={set("founded")} placeholder="e.g. 2018" min="1900" max={new Date().getFullYear()} />
            </div>
          </div>
          <div>
            <label className="label">About the company</label>
            <textarea className="input min-h-28" value={form.description} onChange={set("description")} placeholder="Tell job seekers what your company does and why people love working here." />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
