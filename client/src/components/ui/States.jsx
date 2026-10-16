import { Loader2, AlertTriangle, Inbox, RefreshCw } from "lucide-react";

export const Spinner = ({ size = 24, className = "" }) => (
  <div className={`flex items-center justify-center py-16 ${className}`} role="status" aria-label="Loading">
    <Loader2 size={size} className="animate-spin text-brand-600" />
  </div>
);

export const SkeletonCard = ({ h = "h-32" }) => <div className={`card ${h} skeleton`} />;
export const SkeletonCards = ({ n = 6 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: n }).map((_, i) => <SkeletonCard key={i} />)}
  </div>
);

export const EmptyState = ({ icon: Icon = Inbox, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
      <Icon size={26} />
    </div>
    <h3 className="text-base font-semibold text-slate-800">{title}</h3>
    {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-6 py-14 text-center">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
      <AlertTriangle size={26} />
    </div>
    <h3 className="text-base font-semibold text-rose-800">Something went wrong</h3>
    <p className="mt-1 max-w-sm text-sm text-rose-600">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="btn-primary mt-5 btn-sm">
        <RefreshCw size={14} /> Try again
      </button>
    )}
  </div>
);
