/**
 * Universal API Client with automatic credentials (cookies) handling
 */
const BASE_URL = '/api';

export async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Automatically passes httpOnly jwt_token cookie
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  let data = null;

  try {
    data = await response.json();
  } catch (err) {
    data = { status: 'error', message: 'Non-JSON server response' };
  }

  if (!response.ok) {
    const error = new Error(data?.message || `HTTP ${response.status} Error`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  login: (username, password) => apiRequest('/auth/login', { method: 'POST', body: { username, password } }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getSession: () => apiRequest('/auth/session', { method: 'GET' }),

  // Student
  getMyProfile: () => apiRequest('/students/me', { method: 'GET' }),
  getMyGrades: () => apiRequest('/students/me/grades', { method: 'GET' }),
  getStudentGradesById: (studentId) => apiRequest(`/students/${studentId}/grades`, { method: 'GET' }),

  // Faculty
  getFacultyCourses: () => apiRequest('/faculty/courses', { method: 'GET' }),
  getCourseStudents: (courseId) => apiRequest(`/faculty/courses/${courseId}/students`, { method: 'GET' }),
  updateGrade: (studentId, courseId, marks) =>
    apiRequest('/faculty/grades', {
      method: 'POST',
      body: { student_id: studentId, course_id: courseId, marks: parseFloat(marks) },
    }),

  // Admin
  getAllUsers: () => apiRequest('/admin/users', { method: 'GET' }),
  createUser: (userData) => apiRequest('/admin/users', { method: 'POST', body: userData }),
  updateUserRole: (userId, role) => apiRequest(`/admin/users/${userId}/role`, { method: 'PATCH', body: { role } }),
  deleteUser: (userId) => apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),
  getAllRecords: () => apiRequest('/admin/records', { method: 'GET' }),
  getAuditLogs: (limit = 100) => apiRequest(`/admin/audit-logs?limit=${limit}`, { method: 'GET' }),
};
