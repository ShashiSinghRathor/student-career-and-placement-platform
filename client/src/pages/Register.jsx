import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", college: "", companyName: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({}); setBusy(true);
    const res = await register({ ...form, role });
    setBusy(false);
    if (res.ok) {
      toast.success("Account created! Welcome to CareerConnect.");
      navigate(role === "student" ? "/profile" : "/recruiter/company");
    } else {
      if (res.fieldErrors?.length) {
        const map = {};
        res.fieldErrors.forEach((f) => (map[f.field] = f.msg));
        setErrors(map);
      }
      toast.error(res.error);
    }
  };

  const fieldError = (name) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]}</p> : null;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex w-full items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <Link to="/" className="mb-8 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">CC</span>
            <span className="text-lg font-bold text-slate-900">Career<span className="text-brand-600">Connect</span></span>
          </Link>
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="mt-1 text-sm text-slate-500">Join thousands of students and recruiters on CareerConnect.</p>

            {/* Role toggle */}
            <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
              {[
                { id: "student", label: "I'm a Student", icon: GraduationCap },
                { id: "recruiter", label: "I'm a Recruiter", icon: Building2 },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${role === r.id ? "bg-white text-brand-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <r.icon size={16} /> {r.label}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" required value={form.name} onChange={set("name")} placeholder="Ananya Sharma" />
                {fieldError("name")}
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" required value={form.email} onChange={set("email")} placeholder="you@example.com" />
                {fieldError("email")}
              </div>
              {role === "student" ? (
                <div>
                  <label className="label">College</label>
                  <input className="input" value={form.college} onChange={set("college")} placeholder="Greenwood Institute of Technology" />
                  {fieldError("college")}
                </div>
              ) : (
                <div>
                  <label className="label">Company name</label>
                  <input className="input" value={form.companyName} onChange={set("companyName")} placeholder="TechNova Labs" />
                  <p className="mt-1 text-xs text-slate-400">A company profile will be created; you can complete it after signup.</p>
                  {fieldError("companyName")}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Password</label>
                  <input type="password" className="input" required value={form.password} onChange={set("password")} placeholder="Min 8 chars, 1 letter + number" />
                  {fieldError("password")}
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input type="password" className="input" required value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" />
                  {fieldError("confirmPassword")}
                </div>
              </div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account…" : `Create ${role} account`}</button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
