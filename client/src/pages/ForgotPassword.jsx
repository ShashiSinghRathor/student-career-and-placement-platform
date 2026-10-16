import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800">← Back to login</Link>
        <div className="card mt-4 p-8">
          <h2 className="text-2xl font-bold text-slate-900">Forgot your password?</h2>
          <p className="mt-1 text-sm text-slate-500">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              If that email exists, a reset link has been sent. Check your inbox (valid for 10 minutes).
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {error && <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
              <input type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
