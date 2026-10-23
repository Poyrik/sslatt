import * as jose from 'jose';

import { cookies } from '@/lib/secureCookies';

/**
 * Returns the authenticated user id from the verified access token cookie, or
 * undefined. Identity must always come from here (or the backend), never from
 * form fields or query params, which the client controls.
 */
export const getSessionUserId = async (): Promise<string | undefined> => {
  const token = cookies().get('accessToken')?.value;
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!token || !secret) return undefined;

  try {
    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const userId = (payload as any)?.userId;
    return typeof userId === 'string' && userId ? userId : undefined;
  } catch {
    return undefined;
  }
};

export default getSessionUserId;
