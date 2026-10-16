export const StatCard = ({ icon: Icon, label, value, sub, tone = "brand" }) => {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
    sky: "bg-sky-50 text-sky-600",
  };
  return (
    <div className="card flex items-center gap-4 p-5 transition hover:shadow-card-hover">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon size={22} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
};

export const ChartCard = ({ title, children, right }) => (
  <div className="card p-5">
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      {right}
    </div>
    {children}
  </div>
);
