/**
 * Shared-secret helper for server-internal calls (e.g. the Edge middleware
 * calling the rate-limit counter route). Works in both Edge and Node runtimes.
 * The secret is derived from ACCESS_TOKEN_SECRET so no extra env is required.
 */
export const INTERNAL_HEADER = 'x-internal-token';

export const getInternalToken = async (): Promise<string> => {
  const secret = process.env.ACCESS_TOKEN_SECRET || '';
  if (!secret) throw new Error('ACCESS_TOKEN_SECRET is not set');

  const data = new TextEncoder().encode(`internal-rl:v1:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

/** Constant-time string comparison (no Node-only APIs, Edge safe). */
export const safeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
};
