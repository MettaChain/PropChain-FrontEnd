/**
 * Introspection helpers over the canonical env schema (#1089).
 *
 * `scripts/validate-env.js` and the parity test both read the variable list from
 * here, so there is exactly one definition of which variables exist and which
 * are required. Previously the script carried its own hand-rolled copy, which
 * drifted: eleven variables were validated at runtime but not in CI, and
 * `AUTH_SECRET` / `CSRF_SECRET` were validated in CI but not at runtime.
 *
 * Deliberately free of `@/` imports and of anything Next-specific, so the module
 * loads under plain Node via `ts-node/register`.
 */
import type { ZodType } from "zod";
import { envRequirementsSchema, envSchema } from "./schema";

export type NodeEnvName = "development" | "staging" | "production";

/**
 * True when a field accepts `undefined` — because it is `.optional()` or carries
 * a `.default()`.
 *
 * Determined by parsing rather than by inspecting zod internals, so it keeps
 * working across zod versions.
 */
export function acceptsUndefined(field: ZodType): boolean {
  return field.safeParse(undefined).success;
}

/** Every variable the schema knows about, sorted. */
export function listEnvKeys(): string[] {
  return Object.keys(envSchema.shape).sort();
}

/** Variables that must be supplied regardless of environment, sorted. */
export function listAlwaysRequiredKeys(): string[] {
  return Object.entries(envSchema.shape)
    .filter(([, field]) => !acceptsUndefined(field as ZodType))
    .map(([key]) => key)
    .sort();
}

/** Variables that are optional at the base schema, sorted. */
export function listOptionalKeys(): string[] {
  return Object.entries(envSchema.shape)
    .filter(([, field]) => acceptsUndefined(field as ZodType))
    .map(([key]) => key)
    .sort();
}

/**
 * Variables the given environment additionally requires, sorted.
 *
 * Production is included even though `validateEnvRequirements` only warns there
 * — the list is what the environment *expects*, and the warn-vs-throw decision
 * belongs to the validator, not to this description of the schema.
 */
export function listRequiredKeysFor(env: NodeEnvName): string[] {
  const requirements = envRequirementsSchema.shape[env];

  return Object.entries(requirements.shape)
    .filter(([, field]) => !acceptsUndefined(field as ZodType))
    .map(([key]) => key)
    .sort();
}

/** Human-readable summary used by the CLI validator. */
export function describeSchema(env: NodeEnvName): {
  total: number;
  alwaysRequired: string[];
  requiredForEnv: string[];
  optional: string[];
} {
  return {
    total: listEnvKeys().length,
    alwaysRequired: listAlwaysRequiredKeys(),
    requiredForEnv: listRequiredKeysFor(env),
    optional: listOptionalKeys(),
  };
}
