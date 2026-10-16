import { useEffect, useState, useCallback } from "react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { User, ShieldCheck, GraduationCap, Building2, Check, X } from "lucide-react";
import { initials } from "../../utils/format";

const ROLE_ICONS = { student: GraduationCap, recruiter: Building2, admin: ShieldCheck };

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.get("/admin/users", { params: { role: role || undefined, q: q || undefined, page } });
      setUsers(res.data.users || []);
      setMeta({ total: res.data.total, totalPages: res.data.totalPages, page: res.data.page });
    } catch (e) { setError(getError(e)); }
    finally { setLoading(false); }
  }, [role, q, page]);
  useEffect(load, [load]);

  const toggleActive = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-active`);
      toast.success("User status updated");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const approveRecruiter = async (id, approved) => {
    try {
      await api.put(`/admin/recruiters/${id}/approve`, { approve: !approved });
      toast.success(approved ? "Recruiter approval removed" : "Recruiter approved");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Manage students, recruiters, and admins.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="student">Students</option>
            <option value="recruiter">Recruiters</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <input className="input flex-1 max-w-sm" placeholder="Search by name or email…" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} />
      </div>

      {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : users.length === 0 ? (
        <EmptyState title="No users" subtitle="No users match your search." />
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => {
                const Icon = ROLE_ICONS[u.role] || User;
                const active = u.isActive !== false;
                const isRecruiter = u.role === "recruiter";
                return (
                  <tr key={u._id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600 overflow-hidden">
                          {u.profileImage ? <img src={u.profileImage} alt="" className="h-full w-full object-cover" /> : initials(u.name)}
                        </div>
                        <div>
                          <span className="font-medium text-slate-900">{u.name}</span>
                          <span className="block text-xs text-slate-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Icon size={14} className="text-slate-400" /> {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {active ? (
                          <span className="badge bg-emerald-50 text-emerald-700 flex items-center gap-1"><Check size={11} /> Active</span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500 flex items-center gap-1"><X size={11} /> Inactive</span>
                        )}
                        {isRecruiter && (
                          <span className="text-xs text-slate-500 ml-2">
                            {u.approved ? "✅ Approved" : "⏳ Pending"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn btn-secondary btn-sm" onClick={() => toggleActive(u._id)}>
                          {active ? "Deactivate" : "Activate"}
                        </button>
                        {isRecruiter && (
                          <button className="btn btn-secondary btn-sm" onClick={() => approveRecruiter(u._id, u.approved)}>
                            {u.approved ? "Revoke" : "Approve"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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
