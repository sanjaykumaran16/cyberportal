const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { createUserSchema, updateUserRoleSchema } = require('../schemas/validation.schemas');

// SECURITY: All admin routes strictly require valid authentication and 'admin' role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/users - List all users
router.get('/users', adminController.getAllUsers);

// POST /api/admin/users - Create a new user with role
router.post('/users', validate(createUserSchema), adminController.createUser);

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/users/:id/role', validate(updateUserRoleSchema), adminController.updateUserRole);

// DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', adminController.deleteUser);

// GET /api/admin/records - System-wide view of all courses, students, and marks
router.get('/records', adminController.getAllRecords);

// GET /api/admin/audit-logs - View immutable audit logs
router.get('/audit-logs', adminController.getAuditLog);

module.exports = router;
