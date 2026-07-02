const INSECURE_JWT_SECRETS = new Set([
  'your-super-secret-jwt-key-change-this-in-production',
  'yukz-secret-dev-key-please-change-in-production',
  'dev-jwt-secret-key',
]);

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';
}

export function requireEnv(name: string, options: { minLength?: number; allowInsecureDevValue?: boolean } = {}): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }

  if (options.minLength && value.length < options.minLength) {
    throw new Error(`${name} must be at least ${options.minLength} characters long`);
  }

  if (name === 'JWT_SECRET' && isProductionRuntime() && INSECURE_JWT_SECRETS.has(value)) {
    throw new Error('JWT_SECRET uses an insecure development value in production');
  }

  return value;
}

export function getJwtSecret(): string {
  if (isProductionRuntime()) {
    return requireEnv('JWT_SECRET', { minLength: 32 });
  }

  const value = process.env.JWT_SECRET || 'yukz-local-development-secret-minimum-32-chars';
  if (value.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long when provided');
  }
  return value;
}

export function getJwtExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN || '7d';
}
