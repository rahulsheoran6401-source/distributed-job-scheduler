import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Dynamically find the root .env file regardless of current working directory or compilation output
let currentDir = __dirname;
let envPath = '';
while (currentDir !== path.parse(currentDir).root) {
  const possiblePath = path.join(currentDir, '.env');
  if (fs.existsSync(possiblePath)) {
    envPath = possiblePath;
    break;
  }
  currentDir = path.resolve(currentDir, '..');
}

if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(16).default('super-secret-jwt-key-change-me-in-prod'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
