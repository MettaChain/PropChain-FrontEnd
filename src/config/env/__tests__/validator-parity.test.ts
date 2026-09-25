/**
 * Tests that CI-time and runtime env validation cannot drift (#1089).
 *
 * `scripts/validate-env.cjs` used to carry its own hand-rolled schema. The two
 * copies had diverged: eleven variables were validated at runtime but not in CI,
 * and AUTH_SECRET / CSRF_SECRET were validated in CI but not at runtime — so a
 * value could pass `npm run validate:env` and still fail at boot, or vice versa.
 *
 * These tests pin the properties that keep them in step: one definition, one
 * introspection helper, and a script that declares no schema of its own.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  acceptsUndefined,
  listAlwaysRequiredKeys,
  listEnvKeys,
  listOptionalKeys,
  listRequiredKeysFor,
} from '../introspect';
import { envRequirementsSchema, envSchema, sensitiveVariables } from '../schema';

const VALIDATE_ENV = join(process.cwd(), 'scripts', 'validate-env.cjs');
const scriptSource = readFileSync(VALIDATE_ENV, 'utf8');

describe('introspection matches the schema it describes', () => {
  it('lists exactly the schema keys', () => {
    expect(listEnvKeys()).toEqual(Object.keys(envSchema.shape).sort());
  });

  it('partitions every key into required or optional, with no overlap', () => {
    const required = listAlwaysRequiredKeys();
    const optional = listOptionalKeys();

    expect([...required, ...optional].sort()).toEqual(listEnvKeys());
    expect(required.filter((key) => optional.includes(key))).toEqual([]);
  });

  it('treats a defaulted field as optional rather than required', () => {
    // NEXT_PUBLIC_APP_NAME has a default, so process.env need not supply it.
    expect(acceptsUndefined(envSchema.shape.NEXT_PUBLIC_APP_NAME)).toBe(true);
    expect(listOptionalKeys()).toContain('NEXT_PUBLIC_APP_NAME');
  });

  it('derives per-environment requirements from the requirements schema', () => {
    for (const env of ['development', 'staging', 'production'] as const) {
      const derived = listRequiredKeysFor(env);
      const shape = envRequirementsSchema.shape[env].shape;

      for (const key of derived) {
        expect(Object.keys(shape)).toContain(key);
        expect(acceptsUndefined(shape[key as keyof typeof shape])).toBe(false);
      }
    }
  });
});

describe('the CLI validator has no schema of its own', () => {
  it('loads the canonical schema module', () => {
    expect(scriptSource).toContain('src/config/env/schema.ts');
    expect(scriptSource).toContain('src/config/env/introspect.ts');
  });

  it('declares no local envSchema or envRequirements object', () => {
    // The duplicate definitions this issue removed. Requiring them absent is
    // what stops the drift being reintroduced by a future edit.
    expect(scriptSource).not.toMatch(/const\s+envSchema\s*=\s*\{/);
    expect(scriptSource).not.toMatch(/const\s+envRequirements\s*=\s*\{/);
  });

  it('does not hand-roll URL validation any more', () => {
    expect(scriptSource).not.toMatch(/function\s+isValidUrl/);
  });
});

describe('secrets are validated on both sides', () => {
  it.each(['AUTH_SECRET', 'CSRF_SECRET'])('%s is part of the canonical schema', (key) => {
    // Previously present only in the CI script, so a deployment could boot with
    // an unset secret and fail closed later.
    expect(listEnvKeys()).toContain(key);
  });

  it.each(['AUTH_SECRET', 'CSRF_SECRET'])('%s is required in staging', (key) => {
    expect(listRequiredKeysFor('staging')).toContain(key);
  });

  it.each(['AUTH_SECRET', 'CSRF_SECRET'])('%s is required in production', (key) => {
    expect(listRequiredKeysFor('production')).toContain(key);
  });

  it.each(['AUTH_SECRET', 'CSRF_SECRET'])('%s is not required in development', (key) => {
    // Deliberate: the previous CI script hard-required a 32-char AUTH_SECRET in
    // development, which made `npm run validate:env` fail against the shipped
    // .env.example. Local development stays usable; deployed environments do not.
    expect(listRequiredKeysFor('development')).not.toContain(key);
  });

  it.each(['AUTH_SECRET', 'CSRF_SECRET'])('%s is marked sensitive so it is masked', (key) => {
    expect(sensitiveVariables).toContain(key);
  });

  it('rejects a too-short AUTH_SECRET', () => {
    const result = envSchema.safeParse({ AUTH_SECRET: 'too-short' });
    expect(result.success).toBe(false);
  });

  it('accepts a 32-character AUTH_SECRET', () => {
    const result = envSchema.safeParse({ AUTH_SECRET: 'a'.repeat(32) });
    expect(result.success).toBe(true);
  });
});
