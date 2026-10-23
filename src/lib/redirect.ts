/**
 * Safe redirect + flash-cookie helpers for route handlers.
 *
 * User supplied paths (form fields, query strings) must never be echoed into a
 * `Refresh`/`Location` header as-is: that allows open redirects
 * (`//evil.com`, `https://evil.com`, `/\evil.com`) and, with control chars,
 * header manipulation.
 */

const DUMMY_ORIGIN = 'http://local.invalid';

/** Returns a same-site relative path, or `fallback` for anything else. */
export const safeRedirectPath = (
  input?: string | null,
  fallback = '/',
): string => {
  if (typeof input !== 'string') return fallback;

  const value = input.trim();
  if (!value.startsWith('/')) return fallback; // no absolute or scheme urls
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return fallback; // CR/LF/tab/etc

  try {
    const parsed = new URL(value, DUMMY_ORIGIN);
    if (parsed.origin !== DUMMY_ORIGIN) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
};

/** Value for a `Refresh` response header that can only target our own site. */
export const refreshHeader = (
  path?: string | null,
  delaySeconds = 0,
  fallback = '/',
): string => {
  const delay = Number.isFinite(+delaySeconds)
    ? Math.max(0, Math.floor(+delaySeconds))
    : 0;
  return `${delay}; url=${safeRedirectPath(path, fallback)}`;
};

const isSecure = () =>
  process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE !== 'false'
    : process.env.NODE_ENV === 'production';

/**
 * Builds a `Set-Cookie` string for short lived flash messages. The value is
 * percent-encoded so user/backend text can not smuggle extra cookie attributes
 * (`;`) or control characters, and the cookie is HttpOnly/SameSite.
 */
export const flashCookie = (
  name: string,
  value: unknown,
  expires: Date | string,
): string => {
  const text = String(value ?? '').slice(0, 500);
  const expiresStr =
    typeof expires === 'string' ? expires : expires.toUTCString();

  return [
    `${name}=${encodeURIComponent(text)}`,
    'Path=/',
    `Expires=${expiresStr}`,
    'HttpOnly',
    'SameSite=Lax',
    isSecure() ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
};
