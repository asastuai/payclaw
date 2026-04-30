/**
 * Tests for the PayClaw SDK PoC verification helper.
 *
 * Builds an in-memory attested payload using the same Ed25519 primitives the
 * producer would use, then exercises the verifier through every failure path.
 *
 * Run with: npm test (from packages/sdk).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signAsync, getPublicKeyAsync, etc } from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2';
import { createHash } from 'node:crypto';

etc.sha512Async = async (...m: Uint8Array[]) =>
  sha512(etc.concatBytes(...m));

import { verifyPocCommitment, requireValidPoc } from '../src/poc';

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sortKeys) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.keys(value as object)
      .sort()
      .reduce((acc, k) => {
        (acc as Record<string, unknown>)[k] = sortKeys(
          (value as Record<string, unknown>)[k]
        );
        return acc;
      }, {} as Record<string, unknown>) as unknown as T;
  }
  return value;
}

function canonicalHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(sortKeys(payload))).digest('hex');
}

const TEST_PRIVATE_KEY = new Uint8Array(32).fill(7);

async function makeAttested(payload: Record<string, unknown>, opts: {
  endpoint?: string;
  freshnessHorizonSeconds?: number;
  ageOffsetMs?: number;
} = {}) {
  const timestamp = new Date(Date.now() - (opts.ageOffsetMs ?? 0)).toISOString();
  const endpoint = opts.endpoint ?? '/test';
  const freshnessHorizonSeconds = opts.freshnessHorizonSeconds ?? 60;
  const payloadHash = canonicalHash(payload);

  const signingMessage = JSON.stringify({
    payload_hash: payloadHash,
    source_id: 'test:operator',
    endpoint,
    timestamp,
    freshness_horizon_seconds: freshnessHorizonSeconds,
    freshness_type: 'f_i',
  });

  const sig = await signAsync(
    new TextEncoder().encode(signingMessage),
    TEST_PRIVATE_KEY
  );
  const pub = await getPublicKeyAsync(TEST_PRIVATE_KEY);

  return {
    ...payload,
    _poc: {
      version: '0.1',
      freshness_type: 'f_i' as const,
      source_id: 'test:operator',
      endpoint,
      timestamp,
      freshness_horizon_seconds: freshnessHorizonSeconds,
      payload_hash: payloadHash,
      signature: toHex(sig),
      public_key: toHex(pub),
    },
  };
}

test('verifyPocCommitment accepts a fresh, well-signed attestation', async () => {
  const attested = await makeAttested({ token: 'ETH', price: 2500 });
  const verdict = await verifyPocCommitment(attested);
  assert.equal(verdict.valid, true, `expected valid, got: ${verdict.reason}`);
  assert.equal(verdict.reason, 'ok');
  assert.ok(verdict.poc, 'poc block returned');
  assert.ok(typeof verdict.ageSeconds === 'number');
});

test('verifyPocCommitment rejects when payload is mutated', async () => {
  const attested = await makeAttested({ token: 'ETH', price: 2500 });
  attested.price = 9999;
  const verdict = await verifyPocCommitment(attested);
  assert.equal(verdict.valid, false);
  assert.equal(verdict.reason, 'payload_hash_mismatch');
});

test('verifyPocCommitment rejects when past horizon', async () => {
  const attested = await makeAttested(
    { token: 'ETH' },
    { freshnessHorizonSeconds: 5, ageOffsetMs: 10_000 }
  );
  const verdict = await verifyPocCommitment(attested);
  assert.equal(verdict.valid, false);
  assert.match(verdict.reason, /^stale:/);
});

test('verifyPocCommitment rejects when SDK maxAgeSeconds is tighter than horizon', async () => {
  const attested = await makeAttested(
    { token: 'ETH' },
    { freshnessHorizonSeconds: 60, ageOffsetMs: 30_000 }
  );
  const verdict = await verifyPocCommitment(attested, { maxAgeSeconds: 10 });
  assert.equal(verdict.valid, false);
  assert.match(verdict.reason, /^stale:/);
});

test('verifyPocCommitment rejects when public key does not match expected operator', async () => {
  const attested = await makeAttested({ token: 'ETH' });
  const verdict = await verifyPocCommitment(attested, {
    expectedPublicKey: 'a'.repeat(64),
  });
  assert.equal(verdict.valid, false);
  assert.equal(verdict.reason, 'operator_mismatch');
});

test('verifyPocCommitment rejects when _poc block is missing', async () => {
  const verdict = await verifyPocCommitment({ token: 'ETH' });
  assert.equal(verdict.valid, false);
  assert.equal(verdict.reason, 'missing_poc_block');
});

test('verifyPocCommitment rejects unsigned attestation by default', async () => {
  const attested = await makeAttested({ token: 'ETH' });
  attested._poc.signature = null;
  attested._poc.public_key = null;
  const verdict = await verifyPocCommitment(attested);
  assert.equal(verdict.valid, false);
  assert.equal(verdict.reason, 'no_signature');
});

test('verifyPocCommitment accepts unsigned when allowUnsigned is true', async () => {
  const attested = await makeAttested({ token: 'ETH' });
  attested._poc.signature = null;
  attested._poc.public_key = null;
  const verdict = await verifyPocCommitment(attested, { allowUnsigned: true });
  assert.equal(verdict.valid, true);
});

test('requireValidPoc throws on invalid commitment', async () => {
  await assert.rejects(
    requireValidPoc({ token: 'ETH' }),
    /PoC verification failed: missing_poc_block/
  );
});

test('requireValidPoc returns poc block on success', async () => {
  const attested = await makeAttested({ token: 'ETH' });
  const poc = await requireValidPoc(attested);
  assert.equal(poc.freshness_type, 'f_i');
  assert.equal(poc.source_id, 'test:operator');
});
