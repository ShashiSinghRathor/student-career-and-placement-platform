import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import DashboardLayout from "./layouts/DashboardLayout";
import { Spinner } from "./components/ui/States";

function Guard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

function Dash({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // Route-level role split
  const isRecruiterRoute = location.pathname.startsWith("/recruiter");
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isStudentRoute = !isRecruiterRoute && !isAdminRoute;
  const home = { student: "/dashboard", recruiter: "/recruiter", admin: "/admin" }[user.role];

  if (isRecruiterRoute && user.role !== "recruiter") return <Navigate to={home} replace />;
  if (isAdminRoute && user.role !== "admin") return <Navigate to={home} replace />;
  if (isStudentRoute && user.role !== "student") return <Navigate to={home} replace />;

  return <NotificationProvider><DashboardLayout>{children}</DashboardLayout></NotificationProvider>;
}

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentJobs from "./pages/student/Jobs";
import JobDetails from "./pages/student/JobDetails";
import MyApplications from "./pages/student/MyApplications";
import ApplicationDetails from "./pages/student/ApplicationDetails";
import SavedJobs from "./pages/student/SavedJobs";
import Profile from "./pages/student/Profile";
import Analytics from "./pages/student/Analytics";
import CompanyPublic from "./pages/student/CompanyPublic";

// Recruiter pages
import RecruiterDashboard from "./pages/recruiter/Dashboard";
import RecruiterJobs from "./pages/recruiter/MyJobs";
import JobForm from "./pages/recruiter/JobForm";
import Applicants from "./pages/recruiter/Applicants";
import ApplicationReview from "./pages/recruiter/ApplicationReview";
import InterviewList from "./pages/recruiter/InterviewList";
import CompanyEdit from "./pages/recruiter/CompanyEdit";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCompanies from "./pages/admin/Companies";
import AdminJobs from "./pages/admin/Jobs";
import AdminApplications from "./pages/admin/Applications";
import AdminReports from "./pages/admin/Reports";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/companies/:id" element={<CompanyPublic />} />

      {/* Student */}
      <Route path="/dashboard" element={<Dash><StudentDashboard /></Dash>} />
      <Route path="/jobs" element={<Dash><StudentJobs /></Dash>} />
      <Route path="/jobs/:id" element={<Dash><JobDetails /></Dash>} />
      <Route path="/applications" element={<Dash><MyApplications /></Dash>} />
      <Route path="/applications/:id" element={<Dash><ApplicationDetails /></Dash>} />
      <Route path="/saved-jobs" element={<Dash><SavedJobs /></Dash>} />
      <Route path="/profile" element={<Dash><Profile /></Dash>} />
      <Route path="/analytics" element={<Dash><Analytics /></Dash>} />

      {/* Recruiter */}
      <Route path="/recruiter" element={<Dash><RecruiterDashboard /></Dash>} />
      <Route path="/recruiter/jobs" element={<Dash><RecruiterJobs /></Dash>} />
      <Route path="/recruiter/jobs/new" element={<Dash><JobForm /></Dash>} />
      <Route path="/recruiter/jobs/:id/edit" element={<Dash><JobForm /></Dash>} />
      <Route path="/recruiter/applicants" element={<Dash><Applicants /></Dash>} />
      <Route path="/recruiter/applicants/:jobId" element={<Dash><Applicants /></Dash>} />
      <Route path="/recruiter/interviews" element={<Dash><InterviewList /></Dash>} />
      <Route path="/recruiter/company" element={<Dash><CompanyEdit /></Dash>} />
      <Route path="/recruiter/applications/:id" element={<Dash><ApplicationReview /></Dash>} />

      {/* Admin */}
      <Route path="/admin" element={<Dash><AdminDashboard /></Dash>} />
      <Route path="/admin/users" element={<Dash><AdminUsers /></Dash>} />
      <Route path="/admin/companies" element={<Dash><AdminCompanies /></Dash>} />
      <Route path="/admin/jobs" element={<Dash><AdminJobs /></Dash>} />
      <Route path="/admin/applications" element={<Dash><AdminApplications /></Dash>} />
      <Route path="/admin/reports" element={<Dash><AdminReports /></Dash>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
