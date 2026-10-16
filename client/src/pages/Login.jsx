import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const homeFor = (role) => ({ student: "/dashboard", recruiter: "/recruiter", admin: "/admin" }[role] || "/dashboard");

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setBusy(true);
    const res = await login(form.email.trim(), form.password);
    setBusy(false);
    if (res.ok) {
      toast.success(`Welcome back, ${res.user.name.split(" ")[0]}!`);
      navigate(location.state?.from || homeFor(res.user.role), { replace: true });
    } else setError(res.error);
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden flex-1 flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-sm font-black">CC</span>
          <span className="text-lg font-bold">CareerConnect</span>
        </Link>
        <div>
          <h1 className="text-4xl font-black leading-tight">Your Career<br />Starts Here.</h1>
          <p className="mt-4 max-w-md text-brand-100">Connect with opportunities, build your professional profile, and take the next step toward your dream career.</p>
        </div>
        <p className="text-sm text-brand-200">© 2026 CareerConnect</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">CC</span>
            <span className="text-lg font-bold text-slate-900">Career<span className="text-brand-600">Connect</span></span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900">Log in to your account</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back! Please enter your details.</p>

          {error && <div className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" required className="input" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" required className="input" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">Forgot password?</Link>
            </div>
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in…" : "Log in"}</button>
          </form>

          <div className="mt-8 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Demo accounts</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <button type="button" onClick={() => fillDemo("student@careerconnect.demo", "Student@123")} className="block w-full rounded-md bg-white px-3 py-2 text-left shadow-sm hover:ring-1 hover:ring-brand-300">
                🎓 student@careerconnect.demo <span className="text-slate-400">/ Student@123</span>
              </button>
              <button type="button" onClick={() => fillDemo("recruiter@careerconnect.demo", "Recruiter@123")} className="block w-full rounded-md bg-white px-3 py-2 text-left shadow-sm hover:ring-1 hover:ring-brand-300">
                🏢 recruiter@careerconnect.demo <span className="text-slate-400">/ Recruiter@123</span>
              </button>
              <button type="button" onClick={() => fillDemo("admin@careerconnect.demo", "Admin@123")} className="block w-full rounded-md bg-white px-3 py-2 text-left shadow-sm hover:ring-1 hover:ring-brand-300">
                🛡️ admin@careerconnect.demo <span className="text-slate-400">/ Admin@123</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here? <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
