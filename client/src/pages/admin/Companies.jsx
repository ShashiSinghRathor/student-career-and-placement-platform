import { useEffect, useState, useCallback } from "react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { Check, X } from "lucide-react";

export default function AdminCompanies() {
  const toast = useToast();
  const [companies, setCompanies] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/companies", { params: { page } });
      setCompanies(res.data.companies || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [page]);
  useEffect(load, [load]);

  const toggleVerify = async (id, current) => {
    try {
      await api.put(`/admin/companies/${id}/verify`);
      toast.success(current ? "Company verification removed" : "Company verified");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-sm text-slate-500">Manage verified company profiles.</p>
        </div>
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : companies.length === 0 ? (
        <EmptyState title="No companies" subtitle="Companies will appear here as they register." />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Company</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Industry</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {companies.map(c => (
                <tr key={c._id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
                        {c.logo ? <img src={c.logo} alt="" className="h-full w-full object-cover" /> : (c.name || "C").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{c.industry || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{c.location || "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{c.size || "—"}</td>
                  <td className="px-4 py-3">
                    {c.verified ? (
                      <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => toggleVerify(c._id, true)}>
                        <Check size={13} className="text-emerald-600" /> Verified
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm flex items-center gap-1" onClick={() => toggleVerify(c._id, false)}>
                        <X size={13} /> Verify
                      </button>
                    )}
                  </td>
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
