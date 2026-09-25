/**
 * Keeps `.env.example` and the canonical schema in step (#1088).
 *
 * Before this, `.env.example` documented nine variables that neither validator
 * knew about — eight of which the code genuinely reads (`src/lib/redis.ts`,
 * `src/config/wagmi.ts`, `src/lib/blockchainCacheInvalidator.ts` and others) and
 * one, `NEXT_PUBLIC_DEMO_TX`, that appeared nowhere in the repository at all.
 * Two more were validated but undocumented. Operators had no reliable way to
 * tell which of the two lists to trust.
 *
 * This test fails if either side gains an entry the other lacks, so the drift
 * cannot silently return.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { listEnvKeys } from '../introspect';
import { envVariableDescriptions } from '../schema';

const EXAMPLE_PATH = join(process.cwd(), '.env.example');
const exampleSource = readFileSync(EXAMPLE_PATH, 'utf8');

/** Variable names assigned in `.env.example`, split by whether they are active. */
function parseExample(): { active: string[]; commented: string[] } {
  const active: string[] = [];
  const commented: string[] = [];

  for (const line of exampleSource.split('\n')) {
    const text = line.trim();

    const activeMatch = /^([A-Z][A-Z0-9_]*)=/.exec(text);
    if (activeMatch) {
      active.push(activeMatch[1]);
      continue;
    }

    // `# FOO=bar` documents an optional variable without setting a default.
    const commentedMatch = /^#\s*([A-Z][A-Z0-9_]*)=/.exec(text);
    if (commentedMatch) commented.push(commentedMatch[1]);
  }

  return { active, commented };
}

const { active, commented } = parseExample();
const documented = [...active, ...commented].sort();

describe('.env.example and the schema agree', () => {
  it('documents every variable the schema validates', () => {
    const missing = listEnvKeys().filter((key) => !documented.includes(key));
    expect(missing).toEqual([]);
  });

  it('documents no variable the schema does not validate', () => {
    // A var here but not in the schema is the failure mode this issue was
    // about: operators set it expecting it to configure something.
    const unvalidated = documented.filter((key) => !listEnvKeys().includes(key));
    expect(unvalidated).toEqual([]);
  });

  it('assigns each variable exactly once', () => {
    const duplicates = documented.filter((key, index) => documented.indexOf(key) !== index);
    expect(duplicates).toEqual([]);
  });
});

describe('schema self-consistency', () => {
  it('describes every variable it validates', () => {
    // envVariableDescriptions is typed Record<keyof EnvConfig, string>, so TS
    // already enforces this; asserting it too makes the failure legible at test
    // time rather than only as a type error.
    const described = Object.keys(envVariableDescriptions).sort();
    expect(described).toEqual(listEnvKeys());
  });

  it('gives every variable a non-empty description', () => {
    const blank = Object.entries(envVariableDescriptions)
      .filter(([, description]) => description.trim() === '')
      .map(([key]) => key);
    expect(blank).toEqual([]);
  });
});

describe('previously dead variables stay removed', () => {
  it.each(['NEXT_PUBLIC_DEMO_TX', 'CHAINALYSIS_API_URL'])(
    'does not reintroduce %s',
    (key) => {
      // Both were documented but referenced nowhere in the repository.
      expect(documented).not.toContain(key);
    },
  );
});

describe('variables the code reads are validated', () => {
  // Spot-check the ones this issue surfaced: documented and consumed, but
  // previously validated by neither entrypoint.
  it.each([
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_DB',
    'BLOCKCHAIN_RPC_URL',
    'PROPERTY_CONTRACT_ADDRESS',
    'NEXT_PUBLIC_BATCH_PURCHASE_ADDRESS',
    'NEXT_PUBLIC_MOCK_WALLET',
    'NEXT_PUBLIC_MANIFEST_SIGNING_KEY',
  ])('%s is in the schema', (key) => {
    expect(listEnvKeys()).toContain(key);
  });
});
