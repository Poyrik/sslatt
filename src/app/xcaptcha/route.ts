import isEmpty from 'lodash/isEmpty';
import { type NextRequest, NextResponse } from 'next/server';

import { getRedisKey } from '@/lib/redis';

export const dynamic = 'force-dynamic'; // defaults to auto

// captcha ids are 12 random bytes, hex encoded (see encryptCaptchaCode)
const CAPTCHA_ID_RE = /^[0-9a-f]{24}$/;

export async function GET(req: NextRequest) {
  const key = req.nextUrl?.searchParams?.get('key') || '';

  // Only ever serve captcha images; never an arbitrary Redis key.
  if (!CAPTCHA_ID_RE.test(key)) {
    return new NextResponse(null, { status: 400 });
  }

  const captchaString = await getRedisKey(`captcha:${key}`, false);

  if (!captchaString || isEmpty(captchaString)) {
    return new NextResponse(null, { status: 404 });
  }

  const filebinary = Buffer.from(captchaString, 'base64');
  const blob = new Blob([filebinary], { type: 'image/png' });

  const headers = new Headers();
  headers.set('Content-Type', 'image/png');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', 'no-store');

  return new NextResponse(blob, { status: 200, statusText: 'OK', headers });
}
