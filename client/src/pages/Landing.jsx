import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Search, CheckCircle2, GraduationCap, Building2, BarChart3, Bell, FileText, PlusCircle, Users, ChevronDown } from "lucide-react";
import api from "../services/api";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { salaryText } from "../utils/format";

const HERO_STATS = [
  { value: "500+", label: "Companies hiring" },
  { value: "12,000+", label: "Active opportunities" },
  { value: "85%", label: "Placement rate" },
  { value: "3,400+", label: "Students placed" },
];

const HOW = [
  { icon: UserPlusIcon, title: "Create your profile", text: "Add skills, projects, education and your resume once — reuse it everywhere." },
  { icon: Search, title: "Discover opportunities", text: "Search and filter jobs by skill, location, type and salary. Get match scores instantly." },
  { icon: FileText, title: "Apply in one click", text: "Track every application from Applied to Selected in your personal timeline." },
  { icon: BarChart3, title: "Land the offer", text: "Schedule interviews, receive notifications and grow with career analytics." },
];

function UserPlusIcon() { return <GraduationCap size={22} />; }

const FAQS = [
  { q: "Is CareerConnect free for students?", a: "Yes. Building your profile, searching and applying to jobs is completely free for students." },
  { q: "How does the job recommendation work?", a: "We compare the skills on your profile against each job's required skills and show a match percentage, so you can focus on roles where you're most competitive." },
  { q: "Can recruiters post internships?", a: "Absolutely. Recruiters can post internships and full-time roles with specific eligibility criteria like CGPA, branch and graduation year." },
  { q: "How do I track my applications?", a: "Every application appears in 'My Applications' with a visual timeline: Applied → Under Review → Shortlisted → Interview → Selected." },
];

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    api.get("/jobs?limit=6&hideExpired=false").then((r) => setJobs(r.data.jobs || [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">CC</span>
            <span className="text-lg font-bold text-slate-900">Career<span className="text-brand-600">Connect</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#students" className="hover:text-slate-900">For Students</a>
            <a href="#recruiters" className="hover:text-slate-900">For Recruiters</a>
            <a href="#jobs" className="hover:text-slate-900">Latest Jobs</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link to={{ student: "/dashboard", recruiter: "/recruiter", admin: "/admin" }[user.role]} className="btn-primary btn-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm hidden sm:inline-flex">Log in</Link>
                <Link to="/register" className="btn-primary btn-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/70 via-white to-white">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-24 h-72 w-72 rounded-full bg-brand-50 blur-3xl" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in">
              <span className="badge bg-brand-100 text-brand-800">🎓 Built for college placements</span>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Your Career<br />Starts <span className="text-brand-600">Here.</span>
              </h1>
              <p className="mt-5 max-w-lg text-lg text-slate-600">
                Connect with opportunities, build your professional profile, and take the next step toward your dream career.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/jobs" className="btn-primary px-6 py-3">Find Jobs <ArrowRight size={16} /></Link>
                <Link to="/register" className="btn-secondary px-6 py-3">Get Started</Link>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {HERO_STATS.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample dashboard mock */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="card overflow-hidden p-6 shadow-card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Profile completion</p>
                    <p className="text-2xl font-bold text-slate-900">82%</p>
                  </div>
                  <div className="h-16 w-16"><svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4351e8" strokeWidth="3.5" strokeDasharray="82 100" strokeLinecap="round" />
                  </svg></div>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { label: "Applications", value: 24, color: "bg-brand-500", pct: 80 },
                    { label: "Shortlisted", value: 8, color: "bg-violet-500", pct: 55 },
                    { label: "Interviews", value: 4, color: "bg-amber-500", pct: 35 },
                    { label: "Offers", value: 1, color: "bg-emerald-500", pct: 15 },
                  ].map((r) => (
                    <div key={r.label}>
                      <div className="mb-1 flex justify-between text-xs font-medium text-slate-600"><span>{r.label}</span><span className="text-slate-900">{r.value}</span></div>
                      <div className="h-1.5 rounded-full bg-slate-100"><div className={`h-1.5 rounded-full ${r.color}`} style={{ width: `${r.pct}%` }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-brand-50 p-3 text-xs text-brand-800">
                  🔔 Interview scheduled — Full Stack Developer, Oct 25 at 10:00 AM
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">How it works</h2>
        <p className="mt-2 text-center text-slate-500">From profile to offer letter in four simple steps.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW.map((s, i) => (
            <div key={s.title} className="card p-6 transition hover:shadow-card-hover">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><s.icon size={22} /></div>
              <p className="mt-4 text-xs font-bold text-brand-600">STEP {i + 1}</p>
              <h3 className="mt-1 font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For students / recruiters */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2">
          <div className="card p-8" id="students">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white"><GraduationCap size={24} /></div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">For Students</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {["Professional resume-style profile with completion score", "Search, filter and get skill-matched job recommendations", "Track every application through a visual timeline", "Real-time notifications for shortlists and interviews", "Career analytics that show what's working"].map((x) => (
                <li key={x} className="flex items-start gap-2.5"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />{x}</li>
              ))}
            </ul>
            <Link to="/register" className="btn-primary mt-6">Create student account <ArrowRight size={15} /></Link>
          </div>
          <div className="card p-8" id="recruiters">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white"><Building2 size={24} /></div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">For Recruiters</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {["Post jobs and internships in under 2 minutes", "Define eligibility: CGPA, branch, graduation year", "Review applicants with full profiles and resumes", "Shortlist, reject and schedule interviews in one place", "Recruitment analytics on your hiring funnel"].map((x) => (
                <li key={x} className="flex items-start gap-2.5"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />{x}</li>
              ))}
            </ul>
            <Link to="/register" className="btn-secondary mt-6">Create recruiter account <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      {/* Latest jobs */}
      <section id="jobs" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Latest opportunities</h2>
            <p className="mt-2 text-slate-500">Fresh roles from companies hiring on CareerConnect right now.</p>
          </div>
          <Link to="/jobs" className="hidden text-sm font-semibold text-brand-600 hover:text-brand-700 sm:block">View all →</Link>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 6).map((job) => (
            <Link key={job._id} to={user ? `/jobs/${job._id}` : "/login"} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-card-hover">
              <p className="font-semibold text-slate-900">{job.title}</p>
              <p className="mt-1 text-sm text-slate-500">{job.companyId?.name || "Company"} • <span className="capitalize">{job.jobType?.replace("-", " ")}</span></p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(job.requiredSkills || []).slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <div className="mt-4 flex justify-between text-sm text-slate-600">
                <span>{job.location}</span>
                <span className="font-medium text-slate-900">{salaryText(job.salary)}</span>
              </div>
            </Link>
          ))}
          {jobs.length === 0 && [1, 2, 3].map((i) => <div key={i} className="card h-44 skeleton" />)}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900">Loved by students & recruiters</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: "Riya Menon, CSE '25", role: "SDE Intern @ TechNova", text: "The skill-match score told me exactly which jobs to prioritize. Two weeks after applying, I had an interview and an offer." },
              { name: "Karthik Rao", role: "Talent Lead, PayStream", text: "Eligibility filters saved us hours. We went from 800 unfiltered resumes to 90 qualified applicants." },
              { name: "Dr. S. Prasad", role: "Placement Officer", text: "Our placement analytics finally live in one dashboard. Students love the timeline view of their applications." },
            ].map((t) => (
              <div key={t.name} className="card p-6">
                <p className="text-sm text-slate-600">\"{t.text}\"</p>
                <p className="mt-4 text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-900">Frequently asked questions</h2>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="card overflow-hidden">
              <button className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-slate-800" onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                {f.q}
                <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-slate-500">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Ready to take the next step?</h2>
          <p className="max-w-xl text-brand-100">Join thousands of students and recruiters already using CareerConnect to make career connections that matter.</p>
          <Link to="/register" className="btn bg-white px-7 py-3 text-brand-700 shadow-lg hover:bg-brand-50">Get Started — It's Free</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">CC</span>
            <span className="font-bold text-slate-900">CareerConnect</span>
          </div>
          <p className="text-sm text-slate-400">© 2026 CareerConnect. Built for college placement cells.</p>
          <div className="flex gap-5 text-sm text-slate-500">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <Link to="/login" className="hover:text-slate-900">Log in</Link>
            <Link to="/register" className="hover:text-slate-900">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
