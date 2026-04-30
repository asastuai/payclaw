/**
 * Proof-of-Context (PoC) verification helper for PayClaw.
 *
 * Lets agents verify a counterparty's PoC commitment before submitting a
 * payment. If the commitment is stale, signature is invalid, or the operator
 * does not match the expected public key, the helper rejects, and the agent
 * never pays.
 *
 * This is the SDK-side enforcement of the "PoC release condition optional"
 * policy framing in the README. On-chain enforcement (a Solidity policy hook
 * that revert()s if the commitment fails verification) is the next phase and
 * lives in the contracts package.
 *
 * Reference primitive: github.com/asastuai/proof-of-context-impl
 * Position paper:      github.com/asastuai/proof-of-context
 *
 * @example
 * ```ts
 * import { verifyPocCommitment } from 'payclaw-ai';
 *
 * const oracle = await fetch('https://baseoracle.example/api/v1/prices?token=ETH');
 * const data = await oracle.json();
 *
 * const verdict = await verifyPocCommitment(data, {
 *   expectedPublicKey: '8c1f...d4',     // operator's known key
 *   maxAgeSeconds: 30,                  // SDK-side override of horizon
 * });
 *
 * if (!verdict.valid) {
 *   throw new Error(`PoC check failed: ${verdict.reason}`);
 * }
 *
 * // Only now do we pay
 * await wallet.pay({ to: '0x...', token: 'USDC', amount: 25 });
 * ```
 */

import { verifyAsync, etc } from '@noble/ed25519';
import { sha512, sha256 } from '@noble/hashes/sha2';

// noble/ed25519 v2.x: wire sha512 via the etc namespace. Required for
// async verification primitives.
etc.sha512Async = async (...m: Uint8Array[]) =>
  sha512(etc.concatBytes(...m));

/**
 * The shape a PoC-attested response carries under the `_poc` key.
 */
export interface PocBlock {
  version: string;
  freshness_type: 'f_c' | 'f_m' | 'f_i' | 'f_s';
  source_id: string;
  endpoint: string;
  timestamp: string;
  freshness_horizon_seconds: number;
  payload_hash: string;
  signature: string | null;
  public_key: string | null;
  anchors?: {
    server_timestamp?: string;
    block_height?: number | null;
    drand_round?: number | null;
  };
  scope_disclaimer?: string;
}

/**
 * Result of `verifyPocCommitment`.
 */
export interface PocVerdict {
  /** Whether the commitment is acceptable for settlement. */
  valid: boolean;
  /** Machine-readable reason. `'ok'` when valid. */
  reason: string;
  /** Parsed PoC block, present even on failure (when extractable). */
  poc?: PocBlock;
  /** Age in seconds at verification time. */
  ageSeconds?: number;
}

/**
 * Options for `verifyPocCommitment`.
 */
export interface VerifyPocOptions {
  /**
   * Expected operator public key (hex, 64 chars). If set, mismatched keys
   * cause the verdict to fail with `operator_mismatch`. Strongly recommended
   * for production: pin the operator you trust, refuse the rest.
   */
  expectedPublicKey?: string;
  /**
   * Max age in seconds the SDK will accept, regardless of the
   * `freshness_horizon_seconds` declared by the operator. Useful when the
   * agent's downstream settlement window is tighter than the operator's
   * default. Defaults to whatever the operator declared.
   */
  maxAgeSeconds?: number;
  /**
   * Allow attestations without a signature (operator did not configure a
   * signing key). Defaults to `false`. Only enable for development /
   * testing — in production an unsigned PoC block is identical to no PoC
   * block at all.
   */
  allowUnsigned?: boolean;
}

function fromHex(hex: string): Uint8Array {
  const matches = hex.match(/.{1,2}/g);
  if (!matches) return new Uint8Array(0);
  return Uint8Array.from(matches.map((b) => parseInt(b, 16)));
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

function utf8(str: string): Uint8Array {
  // Cross-runtime UTF-8 encoder. TextEncoder is available globally in Node 18+
  // and browsers; this wrapper avoids the TS lib dependency.
  // @ts-ignore — TextEncoder is globally available in supported runtimes.
  return new TextEncoder().encode(str);
}

function toHexBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function canonicalHash(payload: unknown): string {
  const ordered = sortKeys(payload);
  const json = JSON.stringify(ordered);
  return toHexBytes(sha256(utf8(json)));
}

/**
 * Verify a PoC-attested response.
 *
 * Verification checks (in order of failure):
 * 1. `_poc` block is present.
 * 2. Signature exists (unless `allowUnsigned`).
 * 3. Age does not exceed `maxAgeSeconds` (or operator's declared horizon).
 * 4. Re-computed payload hash matches the attested hash.
 * 5. Ed25519 signature is valid for the canonical signing message.
 * 6. Public key matches `expectedPublicKey` (when provided).
 *
 * Each failure returns a structured `PocVerdict` with `reason` set, so the
 * caller can distinguish "stale" from "tampered" from "wrong operator".
 */
export async function verifyPocCommitment(
  attestedPayload: Record<string, unknown> & { _poc?: PocBlock },
  opts: VerifyPocOptions = {}
): Promise<PocVerdict> {
  if (!attestedPayload || !attestedPayload._poc) {
    return { valid: false, reason: 'missing_poc_block' };
  }

  const poc = attestedPayload._poc;

  if (!poc.signature && !opts.allowUnsigned) {
    return { valid: false, reason: 'no_signature', poc };
  }

  const ageSeconds =
    (Date.now() - new Date(poc.timestamp).getTime()) / 1000;

  const horizon =
    opts.maxAgeSeconds ?? poc.freshness_horizon_seconds;

  if (ageSeconds > horizon) {
    return {
      valid: false,
      reason: `stale: age=${ageSeconds.toFixed(1)}s, horizon=${horizon}s`,
      poc,
      ageSeconds,
    };
  }

  // Re-compute payload hash.
  const { _poc: _ignored, ...rawPayload } = attestedPayload;
  const recomputed = canonicalHash(rawPayload);
  if (recomputed !== poc.payload_hash) {
    return { valid: false, reason: 'payload_hash_mismatch', poc, ageSeconds };
  }

  // Verify signature when present.
  if (poc.signature && poc.public_key) {
    const signingMessage = JSON.stringify({
      payload_hash: poc.payload_hash,
      source_id: poc.source_id,
      endpoint: poc.endpoint,
      timestamp: poc.timestamp,
      freshness_horizon_seconds: poc.freshness_horizon_seconds,
      freshness_type: poc.freshness_type,
    });
    const messageBytes = utf8(signingMessage);
    const sigBytes = fromHex(poc.signature);
    const pubBytes = fromHex(poc.public_key);

    try {
      const ok = await verifyAsync(sigBytes, messageBytes, pubBytes);
      if (!ok) {
        return { valid: false, reason: 'signature_invalid', poc, ageSeconds };
      }
    } catch (e) {
      return {
        valid: false,
        reason: `signature_check_failed: ${(e as Error).message}`,
        poc,
        ageSeconds,
      };
    }

    if (
      opts.expectedPublicKey &&
      poc.public_key !== opts.expectedPublicKey
    ) {
      return {
        valid: false,
        reason: 'operator_mismatch',
        poc,
        ageSeconds,
      };
    }
  }

  return { valid: true, reason: 'ok', poc, ageSeconds };
}

/**
 * Convenience wrapper that throws if verification fails. Useful for chaining
 * with payment calls in async/await flows where you do not want to inspect
 * the verdict object.
 *
 * @throws Error with the verdict reason as the message.
 */
export async function requireValidPoc(
  attestedPayload: Record<string, unknown> & { _poc?: PocBlock },
  opts: VerifyPocOptions = {}
): Promise<PocBlock> {
  const verdict = await verifyPocCommitment(attestedPayload, opts);
  if (!verdict.valid) {
    throw new Error(`PoC verification failed: ${verdict.reason}`);
  }
  return verdict.poc!;
}
