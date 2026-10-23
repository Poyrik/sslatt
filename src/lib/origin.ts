/**
 * Origin helpers shared by the middleware (Edge) and route handlers.
 * Matching is done on the parsed hostname with exact equality, never with
 * substring checks, so lookalike hosts such as `evil-example.com` or
 * `example.com.evil.com` can not pass for `example.com`.
 */

const hostnameOf = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).host;
  } catch {
    return undefined;
  }
};

/** Hosts this app may be served from: ALLOWED_HOSTS env + the request Host. */
export const getAllowedHosts = (requestHost?: string | null): Set<string> => {
  const hosts = new Set<string>();

  (process.env.ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => hostnameOf(h.trim()))
    .forEach((h) => h && hosts.add(h));

  const own = hostnameOf(requestHost);
  if (own) hosts.add(own);

  return hosts;
};

/** True when `origin` (an Origin/Referer header value) is one of our hosts. */
export const isAllowedOrigin = (
  origin: string | null | undefined,
  requestHost?: string | null,
): boolean => {
  const host = hostnameOf(origin);
  if (!host) return false;
  return getAllowedHosts(requestHost).has(host);
};
