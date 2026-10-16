import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import api, { getError } from "../../services/api";
import JobCard from "../../components/jobs/JobCard";
import { Spinner, ErrorState, EmptyState } from "../../components/ui/States";
import { useToast } from "../../context/ToastContext";

export default function SavedJobs() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState("");
  const toast = useToast();

  const load = () => {
    setError("");
    api.get("/saved-jobs").then((r) => setJobs(r.data.savedJobs)).catch((e) => setError(getError(e)));
  };
  useEffect(load, []);

  const unsave = async (job) => {
    try {
      await api.post(`/saved-jobs/${job._id}/toggle`);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
      toast.success("Removed from saved jobs");
    } catch (e) { toast.error(getError(e)); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saved Jobs</h1>
        <p className="mt-1 text-sm text-slate-500">Your bookmarked opportunities. Apply before the deadline!</p>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : !jobs ? (
        <Spinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No saved jobs yet"
          subtitle="Bookmark interesting jobs from the Jobs page to revisit them later."
          action={<Link to="/jobs" className="btn-primary btn-sm">Browse Jobs</Link>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => <JobCard key={job._id} job={job} onSaveToggle={unsave} />)}
        </div>
      )}
    </div>
  );
}
