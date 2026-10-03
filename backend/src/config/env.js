const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Zod schema to enforce strict configuration requirements.
 * Application will fail-fast on startup if critical secrets or variables are missing.
 */
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for cryptographical strength'),
  SESSION_EXPIRES_IN: z.string().default('15m'),
  SESSION_MAX_AGE_MS: z.string().default('900000').transform((val) => parseInt(val, 10)),
  DB_PATH: z.string().default('./data/college_portal.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  COOKIE_SECURE: z.string().default('false').transform((val) => val === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('CRITICAL: Invalid environment configuration:', parsedEnv.error.format());
  process.exit(1);
}

module.exports = parsedEnv.data;
