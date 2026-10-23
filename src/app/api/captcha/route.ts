import { awaitTo } from '@stoqey/client-graphql';
import { addHours, addSeconds } from 'date-fns';
import isEmpty from 'lodash/isEmpty';
import { cookies } from '@/lib/secureCookies';
import type { NextRequest } from 'next/server';

import { getConfig } from '@/lib/config';
import {
  decryptCaptchaCode,
  encryptCaptchaCode,
} from '@/lib/hooksServer/captcha';
import { isAllowedOrigin } from '@/lib/origin';
import { consumeRedisKey } from '@/lib/redis';
import { flashCookie, refreshHeader } from '@/lib/redirect';

const baseUrl = '/';

const isProd = process.env.NODE_ENV === 'production';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const query = req.nextUrl.searchParams;
  const hasJs = query.get('js') === 'true';
  const endgamex = query.get('endgamex');
  const endgamei = query.get('endgamei');

  if (!getConfig().ENABLE_ENDGAME && !isEmpty(endgamei) && !isEmpty(endgamex)) {
    const in1hr = addHours(new Date(), 1); // TODO endgame interval
    cookieStore.set('js', `${hasJs}`, { expires: in1hr });
    cookieStore.set('endgamex', endgamex, { expires: in1hr });
    cookieStore.set('endgamei', endgamei, { expires: in1hr });
    const resUrl = !hasJs ? '/html' : '/';
    return new Response(null, {
      headers: {
        Refresh: refreshHeader(resUrl, 0),
        // 'Refresh': `0; url=/`,
      },
    });
  }

  const res = new Response(null, {
    headers: {
      Refresh: refreshHeader(baseUrl, 10),
    },
  });

  return res;
}

const corsHeaders = (req: Request): Headers => {
  const headers = new Headers();
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');

  if (isProd) {
    // exact host match only, never a substring test
    if (origin && isAllowedOrigin(origin, host)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Vary', 'Origin');
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Accept-Version, X-Requested-With',
  );
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
};

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 200, headers: corsHeaders(request) });
}

export async function POST(req: NextRequest) {
  let iv = '';
  let encrypted = '';
  let confirmCode = '';
  let hasJs = false;
  const sendError = (_message = '') => {
    console.log('captcha api Forbidden');
    return Response.json('Forbidden', {
      status: 403,
      headers: corsHeaders(req),
    });
  };
  // TODO generic messages
  const cookieStore = cookies();
  const in3Secs = addSeconds(new Date(), 5);
  const in1hr = addHours(new Date(), 1); // TODO endgame interval
  const in3SecsStr = in3Secs.toUTCString();

  // console.log("captcha api", req);
  try {
    const formData = await req.formData();
    const hasJavascript = formData.get('js') as string;
    hasJs = hasJavascript === 'true';

    iv = formData.get('encryptedi') as string;
    if (isEmpty(iv)) return sendError();

    encrypted = formData.get('encryptedx') as string;
    if (isEmpty(encrypted)) return sendError();

    confirmCode = formData.get('confirmCode') as string;
    if (isEmpty(confirmCode)) return sendError();

    const [errorDecoding, decoded] = await awaitTo(
      decryptCaptchaCode(encrypted, iv),
    );
    if (errorDecoding) return sendError();

    // Each captcha can be answered once: the stored image id is consumed on
    // the first attempt (right or wrong), so a solved captcha can not be
    // replayed to mint more sessions.
    if (!/^[0-9a-f]{24}$/.test(iv)) return sendError();
    const firstUse = await consumeRedisKey(`captcha:${iv}`);
    if (!firstUse) throw new Error('Captcha expired, please try again');

    if (decoded.toLowerCase() !== confirmCode.toLowerCase())
      throw new Error('Invalid confirm code');

    // TODO in1hr
    const timestamp = Math.round(in1hr.getTime() / 1000);
    const endgameCode = `${timestamp}`;
    const captchaCode = await encryptCaptchaCode(endgameCode);
    if (!captchaCode) {
      throw new Error('Invalid captcha code');
    }
    const { data: endgameCypher, iv: endgameCypherIv } = captchaCode;

    cookieStore.set('refresh', 'true', { expires: in3Secs });
    // cookieStore.set("message", "Successfully verified code", { expires: in3Secs });
    // cookieStore.set("success", "true", { expires: in3Secs });
    cookieStore.set('js', `${hasJs}`, { expires: in1hr });
    cookieStore.set('endgamex', endgameCypher, { expires: in1hr });
    cookieStore.set('endgamei', endgameCypherIv, { expires: in1hr });

    const resUrl = !hasJs ? '/html' : '/';
    return new Response(null, {
      headers: {
        Refresh: refreshHeader(resUrl, 0),
        // 'Refresh': `0; url=/`,
      },
    });
  } catch (error: any) {
    console.log('error api/captcha', error);

    // record attempts
    const message = (error && error?.message) || `captcha failed`;
    const res = new Response(null, {
      headers: {
        Refresh: refreshHeader(baseUrl, 0),
        'Set-Cookie': flashCookie('message', message, in3SecsStr),
      },
    });

    res.headers.append(
      'Set-Cookie',
      flashCookie('success', 'false', in3SecsStr),
    );
    return res;
  }
}
