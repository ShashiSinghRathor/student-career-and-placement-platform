# CareerConnect — Student Career & Placement Platform

[![React](https://img.shields.io/badge/react-18-blue.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/vite-5-646cff.svg)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/tailwind-css.svg)](https://tailwindcss.com)
[![Node.js](https://img.shields.io/badge/node-20+-green.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/express-4-f8f8f8.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/mongodb-atlas-green.svg)](https://www.mongodb.com/atlas)
[![Socket](https://img.shields.io/badge/socketio-4.7-green.svg)](https://socket.io)

CareerConnect is a **full-stack, production-quality platform** connecting Students, Companies/Recruiters, and College Administrators for internships, jobs, placements, applications, interviews, and career management — purpose-built for college placement cells.

---

## ✨ Features

### Students
- Register / login with JWT auth
- Complete profile (education, skills, projects, experience, certifications, achievements)
- Upload resume (Cloudinary)
- Search, filter, sort jobs with skill match %
- Apply to jobs (resume + cover letter)
- Track applications via a visual timeline (Applied → Under Review → Shortlisted → Interview → Selected)
- Save / bookmark jobs
- Real-time notifications (Socket.IO)
- Career analytics dashboard
- Profile completion score
- Skill-based job recommendations

### Recruiters
- Register / login
- Create company profile with logo upload
- Post jobs & internships with eligibility criteria (CGPA, branch, graduation year, skills)
- View, filter, shortlist, reject applicants
- Schedule interviews (online / offline / phone) and update statuses
- Recruitment analytics dashboard
- Real-time notifications

### Admin
- Platform statistics (students, recruiters, companies, jobs, applications, placements)
- Approve / reject recruiters
- Approve / reject job postings
- Manage users, companies, reports
- Charts: applications over time, placements over time, jobs by category, students by branch, top hiring companies

### Platform
- REST API with comprehensive error handling (400/401/403/404/409/500)
- Role-based access control (RBAC)
- JWT + bcrypt
- Input validation (express-validator)
- Rate limiting (auth endpoints + general API)
- Helmet, CORS, compression
- Multipart uploads (Cloudinary or local disk fallback)
- Email notifications via Nodemailer
- MongoDB Atlas ready
- Real-time Socket.IO notifications
- Responsive design for desktop, tablet, mobile

## 🛠 Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 18, Vite, React Router 6, Tailwind CSS 3, Axios, Recharts, Lucide React, Socket.IO Client |
| Backend | Node.js, Express, JSON Web Tokens, bcryptjs, express-validator |
| Database | MongoDB, Mongoose |
| Realtime | Socket.IO |
| Storage | Cloudinary (optional; local disk fallback) |
| Email | Nodemailer |
| Security | Helmet, CORS, compression, express-rate-limit, cookie-parser |

## 🏗 Architecture

```
careerconnect/
├── server/                 Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/        env, db
│   │   ├── controllers/   auth, student, recruiter, job, application, interview, notification, savedJob, admin
│   │   ├── middleware/    auth, error, validate, upload, rateLimiter
│   │   ├── models/        12 Mongoose models
│   │   ├── routes/        per-resource route files
│   │   ├── services/      notification, email, matching/recommendation
│   │   ├── sockets/       Socket.IO server setup
│   │   ├── utils/         ApiError, asyncHandler, pagination, normalize
│   │   └── server.js      entry point
│   └── package.json
├── client/                 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    ui, jobs, layout
│   │   ├── context/       AuthContext, ToastContext, NotificationContext
│   │   ├── layouts/       DashboardLayout
│   │   ├── pages/         Landing, auth, student, recruiter, admin
│   │   ├── services/      api, socket
│   │   ├── utils/         format
│   │   ├── App.jsx        router
│   │   ├── main.jsx       entry
│   │   └── index.css
│   └── package.json
├── .env.example
├── .gitignore
└── README.md
```

### Database Design

**Core models**

- **User** — name, email, password (bcrypt-hashed, excluded from serialization), role (`student|recruiter|admin`), profileImage, isVerified, isActive, approved (recruiter), JWT reset tokens
- **StudentProfile** — userId (unique), college, degree, branch, graduationYear, cgpa, bio, headline, location, phone, skills[], education[], projects[], experience[], certifications[], achievements[], resumeUrl, githubUrl, linkedinUrl; `completionPercent()` computed method
- **RecruiterProfile** — userId (unique), companyId ref, designation, bio, phone
- **Company** — name, logo, description, website, industry, location, size, founded, verified, createdBy
- **Job** — companyId, recruiterId, title, description, responsibilities[], requirements[], jobType, mode, location, salary{min,max,currency}, durationMonths, openings, requiredSkills[], eligibility{minCgpa, allowedBranches[], gradYear[]}, experience, deadline, status{pending|active|rejected|closed|draft}, rejectionReason, views; virtual `applicantCount`
- **Application** — studentId, jobId, recruiterId, companyId, resumeUrl, coverLetter, status, history[], scheduledInterviews[], appliedAt; unique compound {studentId, jobId}
- **Interview** — applicationId, studentId, recruiterId, round, date, time, type:online|offline|phone, meetingLink, location, interviewer, notes, status{Scheduled|Completed|Cancelled|Rescheduled}
- **Notification** — userId, title, message, type, link, meta, read, createdAt
- **SavedJob** — studentId, jobId; unique {studentId, jobId}
- **Message** — senderId, recipientId, applicationId, body, read
- **Skill** — name (unique), category; static `search()`
- **Report** — reporterId, targetType, targetId, reason, status, resolutionNote, resolvedBy

**Indexes**: text indexes on User.email, Company.name, Job.title/description; compound indexes for lookups and filtering; virtual population for applicantCount.

### API Documentation

All APIs return `{ success: true, ...payload }` or `{ success: false, message, errors? }`.

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| POST | /api/auth/register | no | any | Register student or recruiter (admin requires manual creation) |
| POST | /api/auth/login | no | any | Login, returns JWT token |
| GET | /api/auth/me | yes | any | Current user |
| PUT | /api/auth/update-me | yes | any | Update name/phone/profileImage |
| PUT | /api/auth/password | yes | any | Change password |
| POST | /api/auth/forgot-password | no | any | Request password reset (email enumeration-safe) |
| POST | /api/auth/reset-password/:token | no | any | Reset password |
| POST | /api/auth/logout | yes | any | Clear cookie (client clears token) |
| GET | /api/students/profile | yes | student | Own student profile |
| PUT | /api/students/profile | yes | student | Update profile fields + nested arrays |
| DELETE | /api/students/profile/:array/:itemId | yes | student | Remove education/project/experience/cert/achievement |
| GET | /api/students/dashboard | yes | student | Dashboard stats, counts, status chart, recent apps, upcoming interviews, notifications |
| GET | /api/students/analytics | yes | student | by status, by month, by job type, demand skills |
| GET | /api/students/recommendations | yes | student | Skill-matched job recommendations with % |
| GET | /api/jobs | public | — | Search / filter / sort / paginate jobs (student gets saved/applied flags + match %) |
| GET | /api/jobs/:id | public | — | Job details |
| POST | /api/jobs | yes | recruiter | Post a job (becomes “active” if company verified, else “pending”) |
| PUT | /api/jobs/:id | yes | recruiter\|admin | Edit job |
| DELETE | /api/jobs/:id | yes | recruiter\|admin | Delete job + applications + saved refs |
| GET | /api/jobs/my/posted | yes | recruiter | Recruiter's own jobs with per-job stats |
| GET | /api/jobs/:id/applicants | yes | recruiter\|admin | Applicants for a job |
| POST | /api/jobs/:id/apply | yes | student | Apply (validates profile ≥40%, no duplicate, resume required) |
| GET | /api/applications | yes | any | Student's own applications |
| GET | /api/applications/:id | yes | any | Application detail + interviews |
| PUT | /api/applications/:id/status | yes | recruiter\|admin | Update status + notify student |
| GET | /api/interviews | yes | any | Student: own; recruiter: own |
| GET | /api/interviews/me | yes | student | Student's interviews |
| POST | /api/interviews | yes | recruiter\|admin | Schedule interview |
| PUT | /api/interviews/:id | yes | recruiter\|admin | Update / reschedule / cancel |
| GET | /api/notifications | yes | any | List + unread count |
| PUT | /api/notifications/:id/read | yes | any | Mark one read |
| PUT | /api/notifications/read-all | yes | any | Mark all read |
| POST | /api/saved-jobs/:jobId/toggle | yes | student | Toggle saved job |
| GET | /api/saved-jobs | yes | student | List saved jobs |
| GET | /api/admin/statistics | yes | admin | Platform-wide stats + charts |
| GET | /api/admin/users | yes | admin | Paginated users |
| PUT | /api/admin/users/:id/toggle-active | yes | admin | Activate/deactivate user |
| PUT | /api/admin/recruiters/:id/approve | yes | admin | Approve/reject recruiter |
| GET | /api/admin/companies | yes | admin | Companies |
| PUT | /api/admin/companies/:id/verify | yes | admin | Toggle verified |
| GET | /api/admin/jobs | yes | admin | All jobs (filter by status) |
| PUT | /api/admin/jobs/:id/moderate | yes | admin | Approve / reject / close job |
| GET | /api/admin/applications | yes | admin | All applications |
| GET | /api/admin/reports | yes | admin | Flagged content |
| PUT | /api/admin/reports/:id/resolve | yes | admin | Resolve / dismiss report |

### Environment Variables

```bash
# server/.env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/careerconnect
JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

# Cloudinary (optional; uploads fall back to local uploads/uploads/)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (optional)
EMAIL_USER=
EMAIL_PASSWORD=

# Demo account credentials (seed script uses env fallbacks)
DEMO_STUDENT_EMAIL=student@careerconnect.demo
DEMO_RECRUITER_EMAIL=recruiter@careerconnect.demo
DEMO_ADMIN_EMAIL=admin@careerconnect.demo
DEMO_STUDENT_PASSWORD=Student@123
DEMO_RECRUITER_PASSWORD=Recruiter@123
DEMO_ADMIN_PASSWORD=Admin@123

# client/.env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Never commit `.env` with real secrets.** A `.env.example` is provided.

### Folder Structure

See the Architecture table above.

### Installation

**Backend**

```bash
cd server
npm install
# Copy .env.example → .env and fill in MONGO_URI + JWT_SECRET (and optional Cloudinary/email)
npm run dev      # listen on port 5000
```

**Frontend**

```bash
cd client
npm install
# Copy .env.example → .env (defaults point to localhost:5000)
npm run dev      # listen on port 5173
```

### Running Locally

1. Ensure MongoDB is reachable at `MONGO_URI`.
2. Start the backend: `cd server && npm run dev`.
3. Start the frontend: `cd client && npm run dev`.
4. Seed the database (optional, creates demo data and demo accounts):
   ```bash
   cd server
   npm run seed
   ```
   This seeds 10 companies, 20 jobs, 20 students, and 30+ applications plus demo accounts:
   - `student@careerconnect.demo` / `Student@123`
   - `recruiter@careerconnect.demo` / `Recruiter@123`
   - `admin@careerconnect.demo` / `Admin@123`

> Demo account passwords are read from env vars so they can be changed per environment. Never hard-code production credentials.

### Deployment

**Recommended: Render (backend) + Vercel/Cloudflare Pages for the static frontend**, or serve the built frontend from the backend in production.


#### Backend on Render

1. Push `server/` to GitHub.
2. On Render, create a **Web Service** pointing to `server/`.
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`, `PORT=5000` (Render auto-sets the port, but your env should still declare it), `CLIENT_URL` (set to your frontend URL or the Render URL during dev).
4. Start command: `npm start` (or use the Node runtime directly).
5. For MongoDB Atlas, whitelist Render's IP ranges or use VPC peering.

#### Frontend

- Build: `npm run build` → deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, Render Static Site).
- Set `VITE_API_URL` to your backend URL.
- Ensure CORS on the backend allows the frontend origin via `CLIENT_URL`.

#### Production considerations

- Use a managed MongoDB Atlas cluster with appropriate network access.
- Configure Cloudinary credentials for file uploads.
- Enable HTTPS everywhere.
- Use a proper SMTP provider for email.
- Set `NODE_ENV=production`.
- Rotate `JWT_SECRET` and invalidate sessions on rotation.

### Demo Accounts

The seed script creates three demo accounts. Credentials come from environment variables so they're changeable per environment:

| Role | Email | Password |
|------|-------|----------|
| Student | `student@careerconnect.demo` | Varies per env (default shown in seed) |
| Recruiter | `recruiter@careerconnect.demo` | Varies per env |
| Admin | `admin@careerconnect.demo` | Varies per env |

### Screenshots

Real screenshots are generated when you run the app. The UI includes:

- Landing page with hero, how-it-works, features, latest jobs, testimonials, FAQ, CTA
- Student dashboard with stats, status pie chart, recent applications, upcoming interviews, recommended jobs
- Jobs page with search, filters, sort, pagination
- Job details page with apply flow
- Application timeline, interview details
- Profile editor with completion score
- Career analytics with bar/pie charts
- Recruiter dashboard with jobs, applicants, interviews, company profile
- Admin console with management tables for users, companies, jobs, applications, reports

## 🚀 Future Improvements

- ~~Add WebAuthn / magic link login~~
- OAuth2 (Google, GitHub, LinkedIn) for sign-in
- Salary negotiation chat / recruiter messaging inbox
- Video interview scheduling with calendar sync
- File storage for resumes with expiry + virus scan
- WebSocket chat between students and recruiters on an application
- Export application CSV for placement cells
- Placement analytics export to PDF
- Multi-college / multi-tenant support
- Advanced recommendation: location, experience, branch, CGPA, historical placement data
- Role-based exports, audit logs
- GDPR / data retention policies
- Rate limiting per role, bot detection
- Accessibility audits, keyboard navigation improvements
- PWA with offline profile cache
- i18n support

## 📝 License

This project is provided as-is for educational and placement purposes. Not for commercial deployment without review.

---

Built with ❤️ for students and placement cells.

#### How to deploy on Render

1. Create a Render account at [https://render.com](https://render.com) and connect this GitHub repository.
2. Create a **Web Service** for the backend:
   - Root directory: `server/`
   - Build command: `npm install`
   - Start command: `node src/server.js`
3. Add these environment variables to the Render Web Service:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `PORT`
   - `CLIENT_URL`
4. Set `CLIENT_URL` to your frontend URL once the frontend is deployed, or to the backend Render URL while you are still setting things up.
5. For production email and file uploads, also add the Cloudinary and SMTP environment variables described in `server/.env.example`.
6. Deploy the frontend separately as a static site, or serve the built `client/dist/` from the backend in production.
