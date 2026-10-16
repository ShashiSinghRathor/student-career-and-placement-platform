import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Link as LinkIcon, MapPin, Video, Phone, Users, Check, X } from "lucide-react";
import api, { getError } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { formatDate, statusColor } from "../../utils/format";

export default function InterviewList() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = () => {
    setError("");
    api.get("/interviews")
      .then(r => setInterviews(r.data.interviews || []))
      .catch(e => setError(getError(e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const cancelInterview = async (id) => {
    if (!window.confirm("Cancel this interview?")) return;
    try {
      await api.put(`/interviews/${id}`, { status: "Cancelled" });
      toast.success("Interview cancelled");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const completeInterview = async (id) => {
    try {
      await api.put(`/interviews/${id}`, { status: "Completed" });
      toast.success("Marked as completed");
      load();
    } catch (e) { toast.error(getError(e)); }
  };

  const now = new Date();

  const upcoming = interviews.filter((iv) => new Date(iv.date) >= now && iv.status === "Scheduled");
  const past = interviews.filter((iv) => new Date(iv.date) < now || iv.status !== "Scheduled");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Interviews</h1>
        <p className="mt-1 text-sm text-slate-500">Manage scheduled interviews with candidates.</p>
      </div>

      {error ? <ErrorState message={error} onRetry={load} /> : interviews.length === 0 ? (
        <EmptyState title="No interviews scheduled" subtitle="Schedule interviews from the application review page." />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Upcoming</h2>
              <div className="divide-y divide-slate-50">
                {upcoming.map((iv) => (
                  <div key={iv._id} className="card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                          <Calendar size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900">{iv.round}</p>
                          <p className="text-sm text-slate-500">
                            {formatDate(iv.date)} • {iv.time}
                          </p>
                          <p className="text-sm text-slate-400">{iv.type}</p>
                          {iv.meetingLink && (
                            <a href={iv.meetingLink} target="_blank" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1">
                              <LinkIcon size={12} /> Join meeting
                            </a>
                          )}
                          {iv.location && typeof iv.location === "string" && (
                            <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                              <MapPin size={12} className="inline" /> {iv.location}
                            </p>
                          )}
                          {iv.interviewer && <p className="mt-0.5 text-xs text-slate-500">Interviewer: {iv.interviewer}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="btn btn-success btn-sm" onClick={() => completeInterview(iv._id)}>Mark Completed</button>
                        <button className="btn btn-danger btn-sm" onClick={() => cancelInterview(iv._id)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Past</h2>
              <div className="space-y-2">
                {past.map((iv) => (
                  <div key={iv._id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-slate-600">{formatDate(iv.date)} at {iv.time}</span>
                    <span className="text-slate-400">{iv.type}</span>
                    <span className="ml-auto text-slate-400 capitalize">{iv.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
