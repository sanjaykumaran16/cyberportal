# Automated RBAC Security Test Results

**Assessment Date**: October 2026  
**Environment**: Local Node.js Test Environment (`jest` + `supertest`)  
**Target System**: College Portal with Role-Based Access Control (RBAC)  
**Overall Verdict**: **10/10 PASSED (100% SUCCESS)**

---

## 1. Executive Summary Table

| ID | Scenario | Security Control Tested | Expected HTTP Status & Behavior | Actual Output | Result |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | Student views own record | Authenticated Session & Profile Access | `200 Allowed` (Returns own grades) | `200 success` | **PASS** |
| **TC-02** | Student views peer record | Insecure Direct Object Reference (IDOR) Protection | `403 Denied` ("Access denied") | `403 Denied` | **PASS** |
| **TC-03** | Student opens admin route | Vertical Privilege Escalation Prevention | `403 Denied` ("Access denied") | `403 Denied` | **PASS** |
| **TC-04** | Protected URL without login | Session Verification & Authentication Enforcement | `401 Unauthorized` | `401 Unauthorized` | **PASS** |
| **TC-05** | Expired session access | Session Lifetime & Expiration Invalidation | `401 Session Expired` | `401 Expired` | **PASS** |
| **TC-06** | Client forges role in JWT/body | Cryptographic Signature & DB Role Ground-Truth | `401 Invalid Token / Signature` | `401 Denied/Invalid` | **PASS** |
| **TC-07** | Faculty edits unassigned course | Course Assignment Anti-IDOR Check | `403 Forbidden` ("Access denied") | `403 Forbidden` | **PASS** |
| **TC-08** | Faculty edits assigned course | Authorized Instructor Grade Mutation | `200 Allowed` | `200 Success` | **PASS** |
| **TC-09** | Audit log access (Admin vs Student) | Sensitive Resource Access Control | `Admin: 200` \| `Student: 403` | `Admin: 200` \| `Student: 403` | **PASS** |
| **TC-10** | Input validation on grade bounds | Zod Schema Range Enforcement (`0 <= marks <= 100`) | `400 Bad Request` | `400 Validation Error` | **PASS** |

---

## 2. Test Execution Details & Evidence

```text
PASS tests/rbac.test.js
  College Portal RBAC Security Test Suite
    √ TC-01: Student views own record (profile & own grades) -> 200 Allowed (7 ms)
    √ TC-02: Student views peer record -> 403 Denied (4 ms)
    √ TC-03: Student opens admin route -> 403 Denied (4 ms)
    √ TC-04: Protected URL without login -> 401 Denied (5 ms)
    √ TC-05: Expired session -> 401 Re-authentication required (5 ms)
    √ TC-06 (Extra): Student tampers role in JWT signature -> 401 Invalid Signature (5 ms)
    √ TC-07 (Extra): Faculty edits grade for non-assigned course -> 403 Forbidden (5 ms)
    √ TC-08 (Extra): Faculty edits grade for assigned course -> 200 Allowed (5 ms)
    √ TC-09 (Extra): Admin accesses audit log -> 200; Student accesses audit log -> 403 (8 ms)
    √ TC-10 (Extra): Input validation rejects negative or invalid grade marks -> 400 Bad Request (7 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        1.738 s
```

---

## 3. Detailed Breakdown of Key Security Test Cases

### TC-01: Authorized Student Profile Access
- **Action**: Authenticated user `student_alice` (Student ID `1`) requests `GET /api/students/1/grades`.
- **Enforcement**: `authenticate` middleware verifies the signed `httpOnly` cookie; `requireRole('student')` permits the role; `requireStudentOwnership('studentId')` validates that `req.user.id` maps to student record `1`.
- **Verification**: Status `200 OK`, returns array of enrolled courses with respective grades.

### TC-02: Anti-IDOR Horizontal Access Prevention
- **Action**: `student_alice` (Student ID `1`) requests `GET /api/students/2/grades` attempting to inspect `student_bob`'s academic record.
- **Enforcement**: `requireStudentOwnership` extracts `studentId` param (`2`), compares it against Alice's session (`1`), detects the mismatch, records an `IDOR_VIOLATION_ATTEMPT` to `audit_log`, and halts execution.
- **Verification**: Status `403 Forbidden`, response body generic `"Access denied. You may only view your own records."`.

### TC-03: Vertical Privilege Escalation Prevention
- **Action**: `student_alice` attempts to query `GET /api/admin/users`.
- **Enforcement**: `requireRole('admin')` inspects server session `req.user.role`. Because `req.user.role === 'student'`, it triggers an audit log entry for `ACCESS_ATTEMPT: DENIED` and returns `403`.
- **Verification**: Status `403 Forbidden`, response body `"Access denied. You do not have sufficient permissions."`.

### TC-05: Expired Session Invalidation
- **Action**: Client sends an expired JWT token (simulating idle expiration past 15 minutes).
- **Enforcement**: `jwt.verify` fails with `TokenExpiredError`, records `FAILED` authentication in `audit_log`, and clears any lingering state.
- **Verification**: Status `401 Unauthorized`, message `"Session expired. Please log in again."`.

### TC-07: Faculty Course Assignment IDOR Prevention
- **Action**: Faculty member `prof_alan` (assigned to CS101, CS201) submits `POST /api/faculty/grades` targeting Course `3` (CY301, taught by `prof_ada`).
- **Enforcement**: `requireFacultyCourseAssignment` queries the `courses` database table, verifies `faculty_id !== req.user.id`, logs `UNASSIGNED_COURSE_ACCESS_ATTEMPT: DENIED`, and denies mutation.
- **Verification**: Status `403 Forbidden`, preventing unauthorized grade tampering across instructors.
