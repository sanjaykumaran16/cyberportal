# College Portal with Role-Based Access Control (RBAC)

A secure, local-only web application developed for cybersecurity assessments. This portal demonstrates the implementation of **Role-Based Access Control (RBAC)**, **Insecure Direct Object Reference (IDOR) prevention**, **cryptographic session security**, **input validation**, and **immutable security audit logging** adhering to OWASP guidelines and the Principle of Least Privilege.

---

## 1. System Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["User Personas & Client Layer"]
        S["Student Browser<br/>(Alice / Bob)"]
        F["Faculty Browser<br/>(Dr. Alan / Dr. Ada)"]
        A["Admin Browser<br/>(Admin User)"]
    end

    subgraph Frontend["React (Vite) Single-Page Application"]
        UI["Protected UI Views & Dashboards"]
        PC["Security Assessment Probe Console"]
    end

    subgraph SecurityPerimeter["Express API Gateway & Security Middleware"]
        HL["Helmet & CORS Gateway"]
        RL["Rate Limiter (Brute-Force Shield)"]
        ZV["Zod Schema Input Validator"]
        AUTH["Auth Middleware (httpOnly Cookie / JWT)"]
        RBAC["RBAC Middleware: requireRole(...)<br/>(Deny-by-Default)"]
        OWN["Ownership & Anti-IDOR Middleware<br/>(Student & Faculty Assignment Checks)"]
        ERR["Generic Safe Error Handler<br/>(Zero Stack-Trace Disclosure)"]
    end

    subgraph Storage["Database & Audit Layer (SQLite WAL)"]
        DB[(College Portal Relational DB)]
        AL[(Immutable Security Audit Log)]
    end

    S -->|HTTP/Cookies| UI
    F -->|HTTP/Cookies| UI
    A -->|HTTP/Cookies| UI
    UI -->|REST API Calls| HL
    PC -->|Vulnerability Probes| HL

    HL --> RL --> ZV --> AUTH --> RBAC --> OWN

    OWN -->|Authorized Operations| DB
    AUTH -.->|Login / Fail / Expire| AL
    RBAC -.->|Unauthorized Access Denied (403)| AL
    OWN -.->|IDOR / Unassigned Tampering Denied (403)| AL
    DB -.->|Grade Mutations & Role Updates| AL
    ERR --- SecurityPerimeter
```

---

## 2. Role-Permission Matrix (Server-Side Enforced)

All routes follow a **Deny-by-Default** security posture. Any action or endpoint not explicitly permitted below yields a `403 Forbidden` response.

| Resource / Endpoint | Action | Student | Faculty | Admin | Server Enforcement Mechanism |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `POST /api/auth/login` | Authenticate & establish session | ✅ | ✅ | ✅ | Rate limited + `bcrypt.compare` + `httpOnly` cookie |
| `POST /api/auth/logout` | Invalidate session | ✅ | ✅ | ✅ | Clears cookie + logs event |
| `GET /api/auth/session` | Get active session state | ✅ | ✅ | ✅ | Verified via server-side JWT signature |
| `GET /api/students/me` | View own student profile | ✅ | ❌ | ❌ | `requireRole('student')` + `req.user.id` |
| `GET /api/students/me/grades` | View own enrolled grades | ✅ | ❌ | ❌ | Queries DB strictly for `req.user.id` |
| `GET /api/students/:id/grades` | View specific student's grades | ❌ (Own only) | ❌ | ✅ | `requireStudentOwnership('studentId')` (Anti-IDOR) |
| `GET /api/faculty/courses` | View assigned teaching courses | ❌ | ✅ | ❌ | `requireRole('faculty')` + `WHERE faculty_id = req.user.id` |
| `GET /api/faculty/courses/:id/students` | View students in assigned course | ❌ | ✅ (Assigned) | ✅ | `requireFacultyCourseAssignment` middleware |
| `POST /api/faculty/grades` | Update grade for course student | ❌ | ✅ (Assigned) | ✅ | Validates course assignment & enrollment |
| `GET /api/admin/users` | List all system accounts | ❌ | ❌ | ✅ | `requireRole('admin')` |
| `POST /api/admin/users` | Provision new user account | ❌ | ❌ | ✅ | `requireRole('admin')` + bcrypt hash + Zod schema |
| `PATCH /api/admin/users/:id/role` | Modify user role | ❌ | ❌ | ✅ | `requireRole('admin')` + self-demotion lockout check |
| `DELETE /api/admin/users/:id` | Remove user account | ❌ | ❌ | ✅ | `requireRole('admin')` + self-delete lockout check |
| `GET /api/admin/records` | View all courses, students, marks | ❌ | ❌ | ✅ | `requireRole('admin')` |
| `GET /api/admin/audit-logs` | Inspect immutable security log | ❌ | ❌ | ✅ | `requireRole('admin')` |
| `ANY /undefined-route` | Undefined endpoints | ❌ (404) | ❌ (404) | ❌ (404) | Deny-by-default fallback handler |

---

## 3. Libraries & Dependencies Inventory

All dependencies are actively maintained and standard for enterprise Node.js environments:

| Package | Version | Layer | Purpose & Security Rationale |
| :--- | :--- | :--- | :--- |
| `express` | `^4.21.2` | Backend | Robust, lightweight HTTP routing framework |
| `better-sqlite3` | `^11.8.1` | Backend | High-performance synchronous SQLite driver; uses parameterized SQL to prevent SQLi |
| `bcryptjs` | `^2.4.3` | Backend | Secure adaptive one-way password hashing with unique per-user salts |
| `jsonwebtoken` | `^9.0.2` | Backend | Cryptographically signed session tokens (HMAC-SHA256) |
| `cookie-parser` | `^1.4.7` | Backend | Parses `httpOnly`, `SameSite=Lax` session cookies |
| `helmet` | `^8.0.0` | Backend | Applies HTTP security headers (CSP, X-Content-Type-Options, Frameguard) |
| `express-rate-limit` | `^7.5.0` | Backend | Throttles brute-force login attempts & mitigates DoS |
| `zod` | `^3.24.2` | Backend | Strict runtime input and payload schema validation |
| `cors` | `^2.8.5` | Backend | Origin restriction with credentials support |
| `dotenv` | `^16.4.7` | Backend | Loads environment secrets without hardcoding |
| `jest` | `^29.7.0` | Testing | Automated test runner for security test suite |
| `supertest` | `^7.0.0` | Testing | End-to-end HTTP assertion framework for Jest |
| `react` & `react-dom` | `^18.3.1` | Frontend | Declarative UI rendering |
| `vite` | `^6.2.0` | Frontend | Fast, modern frontend build tool & dev proxy |
| `lucide-react` | `^1.16.0` | Frontend | Consistent visual security icons |

---

## 4. Setup, Seeding & Execution Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **npm**: v9+ (tested on npm v11)

### Quick Start (One Command Setup)
From the project root (`ioc/`):

```bash
# 1. Install dependencies for both backend & frontend and seed the database
npm run setup
```

### Manual Individual Commands

#### 1. Backend Setup & Seeding
```bash
cd backend
npm install
npm run seed
```

#### 2. Running Automated Security Tests
```bash
cd backend
npm test
```
*Executes all 10 automated test cases (TC-01 to TC-10) and prints the pass/fail verification table.*

#### 3. Starting the Backend API Server
```bash
cd backend
npm start
# Runs at http://localhost:5000
```

#### 4. Starting the Frontend UI
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:5173
```

---

## 5. Synthetic Test Personas & Credentials

All synthetic accounts share the default test password: `Password123!`

| Role | Username | Password | Notes & Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin_user` | `Password123!` | System oversight, user creation/role management, audit logs |
| **Faculty 1** | `prof_alan` | `Password123!` | Instructor for **CS101** (Computer Systems) and **CS201** (Algorithms) |
| **Faculty 2** | `prof_ada` | `Password123!` | Instructor for **CY301** (Network & App Security) |
| **Student 1** | `student_alice` | `Password123!` | Enrolled in **CS101** (92.5) and **CY301** (95.0) |
| **Student 2** | `student_bob` | `Password123!` | Enrolled in **CS101** (84.0) and **CS201** (78.5) |
| **Student 3** | `student_charlie` | `Password123!` | Enrolled in **CS201** (88.0) and **CY301** (91.0) |
| **Student 4** | `student_david` | `Password123!` | Enrolled in **CY301** (82.5) |

---

## 6. Common Vulnerabilities & Mistakes Avoided

| Vulnerability / Anti-Pattern | Description of Common Flaw | How This Codebase Avoids It | File Reference |
| :--- | :--- | :--- | :--- |
| **Client-Side Role Trust** | Trusting `req.body.role` or client-side storage to authorize actions. | Role is extracted **strictly** from cryptographically verified server-side JWT session and re-queried against the database. | [`backend/src/middleware/auth.js`](file:///d:/Projects/ioc/backend/src/middleware/auth.js) |
| **Hidden Button Security (Security by Obscurity)** | Hiding UI buttons for unauthorized roles without server-side validation. | Server-side `requireRole(...)` middleware rejects unauthorized API requests with `403`, regardless of client manipulation. | [`backend/src/middleware/rbac.js`](file:///d:/Projects/ioc/backend/src/middleware/rbac.js) |
| **Insecure Direct Object Reference (IDOR)** | Permitting users to fetch `/api/students/:id/grades` simply by changing the ID. | `requireStudentOwnership` ensures students can ONLY access records where `student_id` matches their own session ID. | [`backend/src/middleware/ownership.js`](file:///d:/Projects/ioc/backend/src/middleware/ownership.js) |
| **Unassigned Course Tampering** | Allowing any faculty to edit any course grade. | `requireFacultyCourseAssignment` verifies the course instructor matches `req.user.id` before allowing updates. | [`backend/src/middleware/ownership.js`](file:///d:/Projects/ioc/backend/src/middleware/ownership.js) |
| **Permissive Default Posture** | Allowing access to routes unless explicitly blocked. | **Deny-by-default**: Routes are blocked unless explicitly allowed by middleware; unmatched routes return `404/403`. | [`backend/src/app.js`](file:///d:/Projects/ioc/backend/src/app.js) |
| **Information Disclosure / Leaky Errors** | Leaking stack traces or SQL errors on exceptions. | Centralized error handler masks internal diagnostics with generic `"Access denied"` or `"An unexpected error occurred"`. | [`backend/src/middleware/errorHandler.js`](file:///d:/Projects/ioc/backend/src/middleware/errorHandler.js) |
| **Infinite / Long-Lived Sessions** | Session tokens never expire or last weeks. | JWT expiration set to `15m` idle time; cookies configure `maxAge: 900000` (15 min) with explicit logout invalidation. | [`backend/src/config/env.js`](file:///d:/Projects/ioc/backend/src/config/env.js) |
| **Missing Audit Trail** | Silent access denials or untracked grade changes. | All logins, failures, denied access attempts, grade mutations, and role changes are stored in an immutable SQLite audit log. | [`backend/src/services/audit.service.js`](file:///d:/Projects/ioc/backend/src/services/audit.service.js) |

---

## 7. Evidence Collection & Screenshot Guide

When compiling assessment deliverables, capture the following evidence:

1. **Terminal Test Run**: Screenshot of `npm test` output showing all 10 test cases passing and the summary table.
2. **Student Dashboard**: Screenshot showing Alice's own profile and her grades.
3. **Student IDOR Block Proof**: In Student Dashboard, click *"Attempt Fetching Student #2 Grades"* and capture the green/red alert box displaying `HTTP 403 Response: IDOR Successfully Blocked`.
4. **Faculty Dashboard**: Screenshot showing Dr. Alan Turing editing grades for CS101 and the success notification.
5. **Faculty Unassigned Course Block**: In Faculty Dashboard, click *"Simulate Grade Tampering for Unassigned Course"* and capture `HTTP 403 Forbidden`.
6. **Admin Dashboard**:
   - Screenshot of User Management with role selector dropdowns.
   - Screenshot of the **Central Security Audit Log Trail** displaying logged `LOGIN_SUCCESS`, `IDOR_VIOLATION_ATTEMPT`, `GRADE_UPDATE`, and `ROLE_CHANGE` events.
7. **Interactive Assessment Probe Console**: Click *"Security Assessment Probe"* in the top navigation bar to demonstrate live penetration probes directly in the UI.
