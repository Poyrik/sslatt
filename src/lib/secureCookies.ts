import { cookies as nextCookies } from 'next/headers';

/**
 * Drop-in replacement for `cookies()` from next/headers for route handlers.
 * Every cookie set through it is HttpOnly (script can not read it, which
 * limits what an XSS can steal), SameSite=Lax (not sent on cross-site POSTs,
 * a CSRF mitigation) and Secure in production.
 *
 * Onion services are often served over plain http. If you do that, set
 * COOKIE_SECURE=false, otherwise browsers will refuse to send Secure cookies.
 */
const isSecure = () =>
  process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE !== 'false'
    : process.env.NODE_ENV === 'production';

const defaults = () => ({
  httpOnly: true,
  secure: isSecure(),
  sameSite: 'lax' as const,
  path: '/',
});

export const cookies = (): ReturnType<typeof nextCookies> => {
  const store = nextCookies();

  return new Proxy(store, {
    get(target, prop) {
      if (prop === 'set') {
        return (...args: any[]) => {
          if (typeof args[0] === 'object' && args[0] !== null) {
            return target.set({ ...defaults(), ...args[0] });
          }
          const [name, value, options] = args;
          return target.set(name, value, { ...defaults(), ...(options || {}) });
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
};

export default cookies;
