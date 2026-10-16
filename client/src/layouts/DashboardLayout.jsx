import { useState } from "react";
import { Outlet, Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, LayoutDashboard, Briefcase, FileText, Bookmark, User, Building2, Users, ShieldCheck, BarChart3, ClipboardList, Flag, Settings, LogOut, Menu, X, MessageSquare } from "lucide-react";
import NotificationBell from "../components/layout/NotificationBell";
import { useAuth } from "../context/AuthContext";
import { initials } from "../utils/format";

const NAVS = {
  student: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/jobs", label: "Find Jobs", icon: Briefcase },
    { to: "/applications", label: "My Applications", icon: FileText },
    { to: "/saved-jobs", label: "Saved Jobs", icon: Bookmark },
    { to: "/analytics", label: "Career Analytics", icon: BarChart3 },
    { to: "/profile", label: "My Profile", icon: User },
  ],
  recruiter: [
    { to: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
    { to: "/recruiter/jobs", label: "My Jobs", icon: Briefcase },
    { to: "/recruiter/applicants", label: "Applicants", icon: Users },
    { to: "/recruiter/interviews", label: "Interviews", icon: ClipboardList },
    { to: "/recruiter/company", label: "Company Profile", icon: Building2 },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/companies", label: "Companies", icon: Building2 },
    { to: "/admin/jobs", label: "Job Approvals", icon: Briefcase },
    { to: "/admin/applications", label: "Applications", icon: FileText },
    { to: "/admin/reports", label: "Reports", icon: Flag },
  ],
};

const roleHome = { student: "/dashboard", recruiter: "/recruiter", admin: "/admin" };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = NAVS[user?.role] || NAVS.student;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const Sidebar = (
    <div className="flex h-full flex-col">
      <Link to={roleHome[user?.role] || "/"} className="flex items-center gap-2 px-6 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">CC</span>
        <span className="text-lg font-bold text-slate-900">Career<span className="text-brand-600">Connect</span></span>
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/recruiter" || to === "/admin" || to === "/dashboard"}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-100 bg-white lg:block">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden">{Sidebar}</aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {user?.role === "student" ? `Hi, ${user?.name?.split(" ")[0]} 👋` : user?.role === "recruiter" ? "Recruiter Workspace" : "Admin Console"}
              </p>
              <p className="text-xs text-slate-400 capitalize">{user?.role} account</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link to={user?.role === "student" ? "/profile" : "#"} className="hidden items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-3 hover:bg-slate-200 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white overflow-hidden">
                {user?.profileImage ? <img src={user.profileImage} alt="" className="h-full w-full object-cover" /> : initials(user?.name)}
              </span>
              <span className="max-w-[10rem] truncate text-xs font-semibold text-slate-700">{user?.name}</span>
            </Link>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
