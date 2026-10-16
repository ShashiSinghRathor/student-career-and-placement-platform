import { useEffect, useState, useCallback } from "react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { Check, X, AlertTriangle, Flag } from "lucide-react";
import { timeAgo } from "../../utils/format";

export default function AdminReports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/reports", { params: { status: statusFilter || undefined } });
      setReports(res.data.reports || []);
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [statusFilter]);
  useEffect(load, [load]);

  const resolve = async (id, action) => {
    const note = action === "resolved" ? prompt("Resolution note (optional):") : undefined;
    try {
      await api.put(`/admin/reports/${id}/resolve`, { status: action, resolutionNote: note });
      toast.success(action === "resolved" ? "Report resolved" : "Report dismissed");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const openCount = reports.filter(r => r.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Flagged Content</h1>
          <p className="text-sm text-slate-500">Review user-flagged jobs, users, companies, or messages.</p>
        </div>
        {openCount > 0 && (
          <div className="badge bg-rose-50 text-rose-700 text-sm px-3 py-1 rounded-full">{openCount} open</div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {["", "open", "resolved", "dismissed"].map(s => (
          <button key={s} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-secondary"}`} onClick={() => setStatusFilter(s)}>
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : reports.length === 0 ? (
        <EmptyState title="No reports" subtitle="No content has been flagged yet." />
      ) : (
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge bg-slate-100 text-slate-600 capitalize">{r.targetType}</span>
                    <span className={`badge ${r.status === "open" ? "bg-rose-50 text-rose-700" : r.status === "resolved" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{r.status}</span>
                    <span className="text-xs text-slate-400">{timeAgo(r.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-900">{r.reason}</p>
                  {r.resolutionNote && <p className="mt-1 text-xs text-slate-500">Resolved: {r.resolutionNote}</p>}
                  {r.reporterId && <p className="mt-1 text-xs text-slate-400">Reporter: {r.reporterId.name} ({r.reporterId.email})</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === "open" && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => resolve(r._id, "resolved")}><Check size={14} /> Resolve</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => resolve(r._id, "dismissed")}><X size={14} /> Dismiss</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
