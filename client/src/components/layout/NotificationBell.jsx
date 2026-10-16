import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { timeAgo } from "../../utils/format";

const typeIcon = { application: "📄", interview: "📅", job: "💼", system: "⚙️", recruiter: "🏢", message: "💬" };

export default function NotificationBell() {
  const { notifications, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl sm:w-96">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">Notifications</p>
              <button className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700" onClick={markAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">No notifications yet</div>
              )}
              {notifications.slice(0, 12).map((n) => (
                <button
                  key={n._id}
                  onClick={() => { markRead(n._id); setOpen(false); if (n.link) navigate(n.link); }}
                  className={`flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${!n.read ? "bg-brand-50/40" : ""}`}
                >
                  <span className="mt-0.5 text-lg">{typeIcon[n.type] || "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{n.title}</span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
