/* eslint-disable */
require("../config/env") && null;
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const {
  User, StudentProfile, RecruiterProfile, Company, Job,
  Application, Interview, Notification, SavedJob, Skill,
} = require("../models");

const randomOf = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 3600 * 1000);
const daysAgo = (n) => new Date(Date.now() - n * 24 * 3600 * 1000);

const COMPANIES = [
  { name: "TechNova Labs", industry: "Software Development", location: "Bengaluru, India", website: "https://technova.example.com", size: "201-500", founded: 2015, description: "TechNova builds cloud-native developer tools used by 40,000+ teams worldwide.", logo: "https://ui-avatars.com/api/?name=TN&background=0D8ABC&color=fff&size=128" },
  { name: "DataForge Analytics", industry: "Data Analytics & AI", location: "Hyderabad, India", website: "https://dataforge.example.com", size: "51-200", founded: 2018, description: "DataForge turns raw enterprise data into decisions with ML-powered analytics.", logo: "https://ui-avatars.com/api/?name=DF&background=7C3AED&color=fff&size=128" },
  { name: "CloudSprint", industry: "Cloud Infrastructure", location: "Remote (India)", website: "https://cloudsprint.example.com", size: "11-50", founded: 2020, description: "CloudSprint helps startups deploy and scale on multi-cloud in minutes.", logo: "https://ui-avatars.com/api/?name=CS&background=EA580C&color=fff&size=128" },
  { name: "PayStream Fintech", industry: "Financial Services", location: "Mumbai, India", website: "https://paystream.example.com", size: "501-1000", founded: 2016, description: "PayStream powers frictionless payments for 2 million merchants.", logo: "https://ui-avatars.com/api/?name=PS&background=059669&color=fff&size=128" },
  { name: "MediCore Health", industry: "HealthTech", location: "Pune, India", website: "https://medicore.example.com", size: "51-200", founded: 2019, description: "MediCore digitizes hospital workflows across 300+ facilities.", logo: "https://ui-avatars.com/api/?name=MC&background=DC2626&color=fff&size=128" },
  { name: "Alpha Retail Systems", industry: "Retail & E-Commerce", location: "Gurugram, India", website: "https://alpharetail.example.com", size: "1000+", founded: 2011, description: "Alpha Retail operates omnichannel stores with a nationwide logistics network.", logo: "https://ui-avatars.com/api/?name=AR&background=2563EB&color=fff&size=128" },
  { name: "CircuitEdge Semiconductors", industry: "Semiconductors", location: "Chennai, India", website: "https://circuitedge.example.com", size: "201-500", founded: 2014, description: "CircuitEdge designs low-power chips for IoT and automotive.", logo: "https://ui-avatars.com/api/?name=CE&background=CA8A04&color=fff&size=128" },
  { name: "GreenGrid Energy", industry: "CleanTech", location: "Ahmedabad, India", website: "https://greengrid.example.com", size: "51-200", founded: 2017, description: "GreenGrid optimizes solar grids with predictive software.", logo: "https://ui-avatars.com/api/?name=GG&background=16A34A&color=fff&size=128" },
  { name: "EduSpark Learning", industry: "EdTech", location: "Remote (India)", website: "https://eduspark.example.com", size: "11-50", founded: 2021, description: "EduSpark personalizes learning with AI tutors for K-12.", logo: "https://ui-avatars.com/api/?name=ES&background=DB2777&color=fff&size=128" },
  { name: "NexaGaming Studios", industry: "Gaming & Entertainment", location: "Noida, India", website: "https://nexagaming.example.com", size: "201-500", founded: 2018, description: "NexaGaming builds multiplayer titles played by 15M+ players.", logo: "https://ui-avatars.com/api/?name=NG&background=9333EA&color=fff&size=128" },
];

const SKILL_POOL = ["React", "Node.js", "MongoDB", "Express", "Python", "Django", "Java", "Spring Boot", "C++", "SQL", "PostgreSQL", "Docker", "Kubernetes", "AWS", "Git", "TypeScript", "Next.js", "Tailwind CSS", "Redux", "Machine Learning", "TensorFlow", "Pandas", "Vue.js", "Flask", "Go", "DevOps", "CI CD", "GraphQL", "Firebase", "Redis"];

const BRANCHES = ["Computer Science", "Information Technology", "Electronics & Communication", "Electrical Engineering", "Mechanical Engineering", "Data Science"];
const COLLEGES = ["Greenwood Institute of Technology", "St. Mary's Engineering College", "Regional Engineering Campus", "Calcutta Institute of Technology", "National University of Applied Sciences"];
const DEGREE_POOL = ["B.Tech", "B.E", "BCA", "M.Tech", "MCA"];
const FIRST = ["Aarav", "Vihaan", "Ananya", "Diya", "Ishaan", "Aadhya", "Kabir", "Meera", "Rohan", "Sara", "Arjun", "Nisha", "Dev", "Priya", "Aditya", "Tara", "Karan", "Zara", "Nikhil", "Riya", "Siddharth", "Anjali"];
const LAST = ["Sharma", "Verma", "Reddy", "Iyer", "Patel", "Khan", "Das", "Kapoor", "Menon", "Bose", "Rao", "Joshi", "Malhotra", "Nair", "Chopra"];

const JOBS = [
  { title: "Software Engineer Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Bengaluru, India", salary: { min: 20000, max: 30000 }, durationMonths: 6, requiredSkills: ["React", "Node.js", "MongoDB", "Git"] },
  { title: "Frontend Developer", jobType: "full-time", experience: "fresher", mode: "onsite", location: "Hyderabad, India", salary: { min: 6, max: 10 }, requiredSkills: ["React", "TypeScript", "Redux", "Tailwind CSS"] },
  { title: "Backend Engineer (Node.js)", jobType: "full-time", experience: "1-3 years", mode: "hybrid", location: "Remote (India)", salary: { min: 8, max: 14 }, requiredSkills: ["Node.js", "Express", "MongoDB", "Redis", "Docker"] },
  { title: "Data Analyst Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Hyderabad, India", salary: { min: 15000, max: 25000 }, durationMonths: 3, requiredSkills: ["Python", "Pandas", "SQL"] },
  { title: "Machine Learning Intern", jobType: "internship", experience: "fresher", mode: "remote", location: "Remote (India)", salary: { min: 18000, max: 28000 }, durationMonths: 6, requiredSkills: ["Python", "TensorFlow", "Machine Learning", "Pandas"] },
  { title: "Full Stack Developer", jobType: "full-time", experience: "1-3 years", mode: "hybrid", location: "Bengaluru, India", salary: { min: 9, max: 15 }, requiredSkills: ["React", "Node.js", "MongoDB", "AWS", "Docker"] },
  { title: "DevOps Engineer", jobType: "full-time", experience: "1-3 years", mode: "remote", location: "Remote (India)", salary: { min: 10, max: 16 }, requiredSkills: ["Docker", "Kubernetes", "AWS", "CI CD", "DevOps"] },
  { title: "Payments Software Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Mumbai, India", salary: { min: 25000, max: 35000 }, durationMonths: 6, requiredSkills: ["Java", "SQL", "Git"] },
  { title: "Backend Intern (Java)", jobType: "internship", experience: "fresher", mode: "onsite", location: "Pune, India", salary: { min: 18000, max: 24000 }, durationMonths: 4, requiredSkills: ["Java", "Spring Boot", "PostgreSQL"] },
  { title: "Mobile App Developer", jobType: "full-time", experience: "fresher", mode: "onsite", location: "Gurugram, India", salary: { min: 7, max: 11 }, requiredSkills: ["Node.js", "GraphQL", "MongoDB"] },
  { title: "Embedded Systems Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Chennai, India", salary: { min: 15000, max: 22000 }, durationMonths: 6, requiredSkills: ["C++", "Git"] },
  { title: "Cloud Support Intern", jobType: "internship", experience: "fresher", mode: "remote", location: "Remote (India)", salary: { min: 12000, max: 18000 }, durationMonths: 3, requiredSkills: ["AWS", "Linux"] },
  { title: "Full Stack Intern", jobType: "internship", experience: "fresher", mode: "hybrid", location: "Remote (India)", salary: { min: 14000, max: 22000 }, durationMonths: 6, requiredSkills: ["Vue.js", "Flask", "Python", "SQL"] },
  { title: "Game Developer (C++)", jobType: "full-time", experience: "1-3 years", mode: "onsite", location: "Noida, India", salary: { min: 8, max: 13 }, requiredSkills: ["C++", "Go", "Python"] },
  { title: "QA Engineer", jobType: "full-time", experience: "fresher", mode: "onsite", location: "Noida, India", salary: { min: 5, max: 8 }, requiredSkills: ["Python", "Git", "SQL"] },
  { title: "AI Research Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Pune, India", salary: { min: 22000, max: 30000 }, durationMonths: 6, requiredSkills: ["Python", "Machine Learning", "TensorFlow"] },
  { title: "Platform Engineer", jobType: "full-time", experience: "3-5 years", mode: "hybrid", location: "Bengaluru, India", salary: { min: 18, max: 28 }, requiredSkills: ["Kubernetes", "AWS", "DevOps", "Go"] },
  { title: "Business Intelligence Intern", jobType: "internship", experience: "fresher", mode: "onsite", location: "Gurugram, India", salary: { min: 16000, max: 24000 }, durationMonths: 4, requiredSkills: ["SQL", "Excel", "Python"] },
  { title: "React Frontend Intern", jobType: "internship", experience: "fresher", mode: "remote", location: "Remote (India)", salary: { min: 10000, max: 18000 }, durationMonths: 3, requiredSkills: ["React", "JavaScript", "Git"] },
  { title: "Data Engineer", jobType: "full-time", experience: "1-3 years", mode: "hybrid", location: "Hyderabad, India", salary: { min: 12, max: 20 }, requiredSkills: ["Python", "SQL", "AWS", "Pandas"] },
];

const DESCRIPT = (t, c) => `We are looking for a passionate ${t} to join the ${c} team. You will work alongside experienced engineers on production systems, contribute to code reviews, and ship features used by thousands of users. This is a great opportunity to grow your engineering career with mentorship, modern tooling, and real ownership from day one.`;

async function seed() {
  await connectDB();

  console.log("🌱 Clearing existing data...");
  await Promise.all([
    User.deleteMany({}), StudentProfile.deleteMany({}), RecruiterProfile.deleteMany({}),
    Company.deleteMany({}), Job.deleteMany({}), Application.deleteMany({}),
    Interview.deleteMany({}), Notification.deleteMany({}), SavedJob.deleteMany({}), Skill.deleteMany({}),
  ]);

  // Skills catalog
  await Skill.insertMany(SKILL_POOL.map((name) => ({ name: name.toLowerCase() })));

  // ── ADMIN ──────────────────────────────────────────────
  console.log("👤 Creating admin...");
  await User.create({
    name: "Placement Cell Admin",
    email: process.env.DEMO_ADMIN_EMAIL || "admin@careerconnect.demo",
    password: process.env.DEMO_ADMIN_PASSWORD || "Admin@123",
    role: "admin",
    approved: true,
    isVerified: true,
  });

  // ── COMPANIES + RECRUITERS ─────────────────────────────
  console.log("🏢 Creating companies & recruiters...");
  const companies = await Company.insertMany(
    COMPANIES.map((c, i) => ({ ...c, verified: i !== 9, createdBy: null }))
  );

  const recruiters = [];
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const name = `${randomOf(FIRST)} ${randomOf(LAST)}`;
    const user = await User.create({
      name,
      email: i === 0 ? (process.env.DEMO_RECRUITER_EMAIL || "recruiter@careerconnect.demo") : `hr.${company.name.split(" ")[0].toLowerCase()}${randInt(100, 999)}@careerconnect.demo`,
      password: process.env.DEMO_RECRUITER_PASSWORD || "Recruiter@123",
      role: "recruiter",
      approved: i !== 9,
      isVerified: i !== 9,
    });
    await RecruiterProfile.create({
      userId: user._id,
      companyId: company._id,
      designation: i === 0 ? "Senior Talent Acquisition Manager" : randomOf(["HR Manager", "Talent Acquisition Lead", "Campus Hiring Manager"]),
      phone: `+91 9${randInt(100000000, 999999999)}`,
    });
    recruiters.push(user);
  }
  companies[companies.length - 1].createdBy = recruiters[recruiters.length - 1]._id;

  // ── STUDENTS ───────────────────────────────────────────
  console.log("🎓 Creating students...");
  const students = [];
  for (let i = 0; i < 20; i++) {
    const name = i === 0
      ? "Ananya Sharma"
      : `${randomOf(FIRST)} ${randomOf(LAST)}`;
    const user = await User.create({
      name,
      email: i === 0 ? (process.env.DEMO_STUDENT_EMAIL || "student@careerconnect.demo") : `student${i}${randInt(10, 99)}@careerconnect.demo`,
      password: process.env.DEMO_STUDENT_PASSWORD || "Student@123",
      role: "student",
      approved: true,
      isVerified: true,
    });

    const branch = i === 0 ? "Computer Science" : randomOf(BRANCHES);
    const skills = [...SKILL_POOL].sort(() => Math.random() - 0.5).slice(0, randInt(3, 7));

    const profile = await StudentProfile.create({
      userId: user._id,
      college: i === 0 ? "Greenwood Institute of Technology" : randomOf(COLLEGES),
      degree: i === 0 ? "B.Tech" : randomOf(DEGREE_POOL),
      branch,
      graduationYear: randomOf([2025, 2025, 2026, 2026, 2027]),
      cgpa: +(randInt(60, 92) / 10).toFixed(1),
      bio: i === 0
        ? "Final-year CSE student passionate about full-stack development and open source. Built 3 production apps and love problem solving."
        : `${branch} student interested in building real-world software and learning modern tools.`,
      headline: i === 0 ? "Full-Stack Developer | CSE '26" : `${branch} Student`,
      skills,
      education: [{
        school: i === 0 ? "Greenwood Institute of Technology" : randomOf(COLLEGES),
        degree: i === 0 ? "B.Tech in Computer Science" : `B.Tech in ${branch}`,
        branch,
        startYear: 2022,
        endYear: 2026,
        score: `${randInt(70, 95)}%`,
      }],
      projects: i === 0 ? [
        { title: "CareerConnect Platform", description: "Full-stack placement portal with role-based dashboards, real-time notifications and job recommendation engine.", techStack: ["React", "Node.js", "MongoDB"], link: "https://github.com/ananya/careerconnect" },
        { title: "CodeCollab", description: "Real-time collaborative code editor with rooms, chat and syntax highlighting.", techStack: ["Socket.IO", "React", "Redis"], link: "https://github.com/ananya/codecollab" },
      ] : [{
        title: `${skills[0]} Project`,
        description: `A mini project built with ${skills.slice(0, 2).join(" and ")}.`,
        techStack: skills.slice(0, 3),
      }],
      certifications: i === 0 ? [
        { name: "AWS Certified Cloud Practitioner", issuer: "AWS", issueDate: "2025-06" },
        { name: "Meta Front-End Developer Certificate", issuer: "Coursera", issueDate: "2024-11" },
      ] : [{ name: `${randomOf(["Python", "Java", "Cloud"])} ${randomOf(["Basics", "Intermediate", "Bootcamp"])}`, issuer: "NPTEL", issueDate: "2024" }],
      achievements: i === 0 ? [
        { title: "Winner – Smart India Hackathon 2024 (Internal Round)", description: "Led a 5-member team to build an accessibility prototype.", date: "2024-09" },
        { title: "Top 10% – ICPC Regionals participant", date: "2024-10" },
      ] : [{ title: "Dean's List 2024", date: "2024" }],
      githubUrl: `https://github.com/${user.name.split(" ")[0].toLowerCase()}`,
      linkedinUrl: `https://linkedin.com/in/${user.name.split(" ")[0].toLowerCase()}`,
      location: randomOf(["Bengaluru", "Hyderabad", "Mumbai", "Pune", "Delhi"],
      ),
    });
    students.push(user);
  }

  // ── JOBS ───────────────────────────────────────────────
  console.log("💼 Creating jobs...");
  const jobs = await Job.insertMany(
    JOBS.map((j, i) => {
      const company = companies[i % companies.length];
      const recruiter = recruiters[i % recruiters.length];
      const isInternship = j.jobType === "internship";
      return {
        ...j,
        companyId: company._id,
        recruiterId: recruiter._id,
        description: DESCRIPT(j.title, company.name),
        responsibilities: [
          `Design, build and ship features as ${j.title}`,
          "Collaborate with product & design in agile sprints",
          "Write clean, tested, reviewed code",
        ],
        requirements: [`${j.experience === "fresher" ? "Pursuing/completed a relevant degree" : "Prior professional experience"}`, `Working knowledge of ${j.requiredSkills.slice(0, 3).join(", ")}`],
        openings: randInt(1, 6),
        eligibility: {
          minCgpa: randInt(6, 8) + 0.5 > 8 ? 7.5 : 6.5,
          allowedBranches: randomOf([[], [BRANCHES[0]], [BRANCHES[0], BRANCHES[1]]]),
          gradYear: [2025, 2026],
        },
        deadline: daysFromNow(randInt(10, 45)),
        status: i === 18 ? "pending" : "active",
        createdAt: daysAgo(randInt(2, 50)),
        updatedAt: daysAgo(randInt(1, 5)),
      };
    })
  );

  // ── APPLICATIONS (30+) ─────────────────────────────────
  console.log("📄 Creating applications...");
  const STATUSES = ["Applied", "Applied", "Applied", "Under Review", "Under Review", "Shortlisted", "Shortlisted", "Interview Scheduled", "Selected", "Rejected"];
  const made = new Set();
  const applicationList = [];
  for (let n = 0; n < 40; n++) {
    const student = randomOf(students);
    const job = randomOf(jobs.filter((j) => j.status === "active"));
    const key = `${student._id}-${job._id}`;
    if (made.has(key)) continue;
    made.add(key);

    const status = randomOf(STATUSES);
    const appliedAt = daysAgo(randInt(5, 60));
    const history = [{ status: "Applied", note: "Application submitted", at: appliedAt }];
    if (status !== "Applied") history.push({ status, note: "", at: new Date(appliedAt.getTime() + 7 * 24 * 3600 * 1000) });

    const app = await Application.create({
      studentId: student._id,
      jobId: job._id,
      recruiterId: job.recruiterId,
      companyId: job.companyId,
      resumeUrl: "http://localhost:5000/uploads/sample-resume.pdf",
      coverLetter: `I am excited to apply for ${job.title} at ${companies.find(c => c._id.equals(job.companyId))?.name}. ${job.requiredSkills.slice(0, 3).join(", ")} are my strongest skills and I have used them in multiple projects.`,
      status,
      history,
      appliedAt,
      updatedAt: appliedAt,
    });
    applicationList.push(app);
  }

  // ── INTERVIEWS (for scheduled/selected apps) ───────────
  console.log("📅 Creating interviews...");
  for (const app of applicationList.filter((a) => a.status === "Interview Scheduled" || a.status === "Selected")) {
    await Interview.create({
      applicationId: app._id,
      studentId: app.studentId,
      recruiterId: app.recruiterId,
      round: randomOf(["Technical Round 1", "Technical Round 2", "HR Round"]),
      date: daysFromNow(randInt(1, 20)),
      time: randomOf(["10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"]),
      type: randomOf(["Online", "Online", "Phone", "Offline"]),
      meetingLink: "https://meet.example.com/" + mongoose.Types.ObjectId().toString().slice(-6),
      interviewer: randomOf(FIRST) + " " + randomOf(LAST),
      notes: "DS & problem-solving round. Review the project on your resume.",
      status: "Scheduled",
    });
  }

  // ── SAVED JOBS + NOTIFICATIONS (personalize demo student) ──
  const demoStudent = students[0];
  const profile0 = await StudentProfile.findOne({ userId: demoStudent._id });
  for (const job of jobs.slice(0, 4)) {
    await SavedJob.create({ studentId: demoStudent._id, jobId: job._id });
  }
  await Notification.insertMany([
    { userId: demoStudent._id, title: "Application update 🎉", message: "Your application for Backend Engineer (Node.js) has been moved to \"Shortlisted\".", type: "application", read: false, createdAt: daysAgo(1) },
    { userId: demoStudent._id, title: "Interview scheduled 📅", message: "Your interview has been scheduled. Check the Interviews section for details.", type: "interview", read: false, createdAt: daysAgo(2) },
    { userId: demoStudent._id, title: "New job matching your skills", message: "Full Stack Developer at TechNova Labs was just posted — 79% skill match.", type: "job", read: true, createdAt: daysAgo(3) },
  ]);

  await Notification.insertMany([
    { userId: recruiters[0]._id, title: "New application received", message: "Ananya Sharma applied for Software Engineer Intern", type: "application", read: false, createdAt: daysAgo(1) },
  ]);

  const counts = {
    users: await User.countDocuments(),
    companies: await Company.countDocuments(),
    jobs: await Job.countDocuments(),
    students: students.length,
    applications: applicationList.length,
    interviews: await Interview.countDocuments(),
  };
  console.log("✅ Seed complete:", counts);
  await mongoose.disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
