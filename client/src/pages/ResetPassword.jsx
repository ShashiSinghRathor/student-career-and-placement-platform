import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getError } from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      navigate("/login", { state: { resetOk: true } });
    } catch (err) {
      setError(getError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-slate-900">Set a new password</h2>
          <p className="mt-1 text-sm text-slate-500">Choose a strong password with at least 8 characters, a letter and a number.</p>
          {error && <div className="mt-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input type="password" required minLength={8} className="input" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500"><Link to="/login" className="text-brand-600">Back to login</Link></p>
        </div>
      </div>
    </div>
  );
}
