import type { NextRequest } from 'next/server';

import { isAllowedOrigin } from '@/lib/origin';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for state changing requests (POST/PUT/PATCH/DELETE).
 * Browsers always send `Origin` on cross-origin POSTs and `Sec-Fetch-Site` on
 * modern engines, so a forged cross-site form or fetch is rejected here.
 * Requests with neither header can not come from a cross-site browser context.
 */
export const isCrossSiteRequest = (request: NextRequest): boolean => {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return false;

  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host');

  const origin = request.headers.get('origin');
  if (origin) {
    // `Origin: null` (sandboxed / privacy contexts) is treated as cross-site.
    return !isAllowedOrigin(origin, host);
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) {
    return fetchSite !== 'same-origin' && fetchSite !== 'none';
  }

  const referer = request.headers.get('referer');
  if (referer) return !isAllowedOrigin(referer, host);

  return false;
};

export default isCrossSiteRequest;
