import { useEffect, useState, useCallback } from "react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDate, statusColor } from "../../utils/format";

export default function AdminApplications() {
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/applications", { params: { status, page } });
      setApps(res.data.applications || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [status, page]);
  useEffect(load, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Applications</h1>
          <p className="text-sm text-slate-500">Platform-wide application overview.</p>
        </div>
        <select className="input w-auto" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {["Applied","Under Review","Shortlisted","Interview Scheduled","Selected","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : apps.length === 0 ? (
        <EmptyState title="No applications" subtitle="Applications will appear here as students apply." />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Student</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Job</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {apps.map(app => (
                <tr key={app._id}>
                  <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">{app.studentId?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{app.jobId?.title || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{app.companyId?.name || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`badge ${statusColor(app.status)}`}>{app.status}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{formatDate(app.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
          <span className="text-sm text-slate-500">Page {page} of {meta.totalPages}</span>
          <button className="btn-secondary btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage(page + 1)}>→</button>
        </div>
      )}
    </div>
  );
}
