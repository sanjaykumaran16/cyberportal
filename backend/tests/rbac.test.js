const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/database');
const env = require('../src/config/env');
const seed = require('../scripts/seed');

// Storage for test result summary table
const testResults = [];

function recordResult(id, scenario, expected, actual, passed) {
  testResults.push({
    id,
    scenario,
    expected,
    actual,
    result: passed ? 'PASS' : 'FAIL',
  });
}

describe('College Portal RBAC Security Test Suite', () => {
  let adminToken = '';
  let facultyAlanToken = '';
  let facultyAdaToken = '';
  let studentAliceToken = '';
  let studentBobToken = '';

  beforeAll(async () => {
    // Re-seed DB to a known clean state
    await seed();

    // Authenticate test personas
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin_user', password: 'Password123!' });
    adminToken = adminRes.body.token;

    const alanRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'prof_alan', password: 'Password123!' });
    facultyAlanToken = alanRes.body.token;

    const adaRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'prof_ada', password: 'Password123!' });
    facultyAdaToken = adaRes.body.token;

    const aliceRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student_alice', password: 'Password123!' });
    studentAliceToken = aliceRes.body.token;

    const bobRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student_bob', password: 'Password123!' });
    studentBobToken = bobRes.body.token;
  });

  afterAll(() => {
    // Print formatted Pass/Fail Table
    console.log('\n========================================================================================================');
    console.log('                                 RBAC SECURITY TEST RESULTS SUMMARY                                     ');
    console.log('========================================================================================================');
    console.log(
      '| ID     | Scenario                                              | Expected           | Actual             | Result |'
    );
    console.log(
      '|:-------|:------------------------------------------------------|:-------------------|:-------------------|:-------|'
    );
    testResults.forEach((t) => {
      const id = t.id.padEnd(6);
      const scenario = t.scenario.padEnd(53);
      const exp = t.expected.padEnd(18);
      const act = t.actual.padEnd(18);
      const res = t.result.padEnd(6);
      console.log(`| ${id} | ${scenario} | ${exp} | ${act} | ${res} |`);
    });
    console.log('========================================================================================================\n');
  });

  // TC-01: Student views own record -> 200 Allowed
  test('TC-01: Student views own record (profile & own grades) -> 200 Allowed', async () => {
    // Alice is student_id = 1
    const res = await request(app)
      .get('/api/students/1/grades')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    const actual = `${res.status} ${res.body.status || 'Response'}`;
    const passed = res.status === 200 && Array.isArray(res.body.data);
    recordResult('TC-01', 'Student views own record', '200 Allowed', actual, passed);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  // TC-02: Student views peer record -> 403 Denied (Anti-IDOR)
  test('TC-02: Student views peer record -> 403 Denied', async () => {
    // Alice (id=1) attempts to query Bob (id=2)
    const res = await request(app)
      .get('/api/students/2/grades')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    const actual = `${res.status} ${res.body.message || 'Denied'}`;
    const passed = res.status === 403;
    recordResult('TC-02', 'Student views peer record (Horizontal IDOR)', '403 Denied', `${res.status} Denied`, passed);

    expect(res.status).toBe(403);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/Access denied/i);
  });

  // TC-03: Student opens admin route -> 403 Denied (Vertical Privilege Escalation)
  test('TC-03: Student opens admin route -> 403 Denied', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    const actual = `${res.status} Denied`;
    const passed = res.status === 403;
    recordResult('TC-03', 'Student opens admin route (Vertical Privilege)', '403 Denied', actual, passed);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });

  // TC-04: Protected URL without login -> 401 Denied
  test('TC-04: Protected URL without login -> 401 Denied', async () => {
    const res = await request(app).get('/api/students/me');

    const actual = `${res.status} Unauthorized`;
    const passed = res.status === 401;
    recordResult('TC-04', 'Protected URL without login', '401 Unauthorized', actual, passed);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  // TC-05: Expired session -> re-authentication required
  test('TC-05: Expired session -> 401 Re-authentication required', async () => {
    // Generate an expired JWT token
    const expiredToken = jwt.sign(
      { id: 4, username: 'student_alice', role: 'student' },
      env.JWT_SECRET,
      { expiresIn: '-1s' }
    );

    const res = await request(app)
      .get('/api/students/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    const actual = `${res.status} Expired`;
    const passed = res.status === 401 && /Session expired/i.test(res.body.message);
    recordResult('TC-05', 'Expired session access attempt', '401 Session Expired', actual, passed);

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Session expired/i);
  });

  // Extra Test 1: Student tampers role in request body / forged JWT -> rejected
  test('TC-06 (Extra): Student tampers role in JWT signature -> 401 Invalid Signature', async () => {
    // Generate token signed with wrong secret (simulating client forged token)
    const forgedToken = jwt.sign(
      { id: 4, username: 'student_alice', role: 'admin' },
      'attacker_fake_secret_key_1234567890'
    );

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${forgedToken}`);

    const actual = `${res.status} Denied/Invalid`;
    const passed = res.status === 401;
    recordResult('TC-06', 'Client forges JWT role to admin', '401 Invalid Token', actual, passed);

    expect(res.status).toBe(401);
  });

  // Extra Test 2: Faculty edits grade for non-assigned course -> 403
  test('TC-07 (Extra): Faculty edits grade for non-assigned course -> 403 Forbidden', async () => {
    // prof_alan (faculty_id for CS101, CS201) attempts to modify grade for CY301 (course_id: 3, assigned to prof_ada)
    const res = await request(app)
      .post('/api/faculty/grades')
      .set('Authorization', `Bearer ${facultyAlanToken}`)
      .send({
        student_id: 1, // Alice
        course_id: 3,  // CY301 (Prof Ada's course)
        marks: 100,
      });

    const actual = `${res.status} Forbidden`;
    const passed = res.status === 403;
    recordResult('TC-07', 'Faculty edits unassigned course grade', '403 Denied', actual, passed);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });

  // Extra Test 3: Faculty edits grade for assigned course -> 200 OK
  test('TC-08 (Extra): Faculty edits grade for assigned course -> 200 Allowed', async () => {
    // prof_alan updates grade for CS101 (course_id: 1)
    const res = await request(app)
      .post('/api/faculty/grades')
      .set('Authorization', `Bearer ${facultyAlanToken}`)
      .send({
        student_id: 1, // Alice
        course_id: 1,  // CS101
        marks: 97.5,
      });

    const actual = `${res.status} Success`;
    const passed = res.status === 200;
    recordResult('TC-08', 'Faculty edits assigned course grade', '200 Allowed', actual, passed);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  // Extra Test 4: Admin accesses audit log -> 200; Student accesses audit log -> 403
  test('TC-09 (Extra): Admin accesses audit log -> 200; Student accesses audit log -> 403', async () => {
    const adminRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    const studentRes = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${studentAliceToken}`);

    const actual = `Admin:${adminRes.status} | Student:${studentRes.status}`;
    const passed = adminRes.status === 200 && studentRes.status === 403;
    recordResult('TC-09', 'Audit log access (Admin vs Student)', 'Admin:200 | Stud:403', actual, passed);

    expect(adminRes.status).toBe(200);
    expect(Array.isArray(adminRes.body.data)).toBe(true);
    expect(studentRes.status).toBe(403);
  });

  // Extra Test 5: Input validation catches invalid marks (<0 or >100) -> 400 Bad Request
  test('TC-10 (Extra): Input validation rejects negative or invalid grade marks -> 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/faculty/grades')
      .set('Authorization', `Bearer ${facultyAlanToken}`)
      .send({
        student_id: 1,
        course_id: 1,
        marks: 150, // Invalid mark (>100)
      });

    const actual = `${res.status} Validation Error`;
    const passed = res.status === 400;
    recordResult('TC-10', 'Input validation on grade bounds', '400 Bad Request', actual, passed);

    expect(res.status).toBe(400);
  });
});
