const { z } = require('zod');

/**
 * SECURITY CONTROL: Input Validation Schemas
 * Prevents parameter tampering, prototype pollution, type confusion, and malformed inputs.
 */

const loginSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
});

const updateGradeSchema = z.object({
  student_id: z.number().int().positive(),
  course_id: z.number().int().positive(),
  marks: z.number().min(0).max(100),
});

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['student', 'faculty', 'admin']),
  name: z.string().trim().min(2).max(100).optional(),
  dept: z.string().trim().min(2).max(50).optional(),
  year: z.number().int().min(1).max(5).optional(),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['student', 'faculty', 'admin']),
});

module.exports = {
  loginSchema,
  updateGradeSchema,
  createUserSchema,
  updateUserRoleSchema,
};
