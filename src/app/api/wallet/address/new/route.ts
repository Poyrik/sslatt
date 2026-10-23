import { GENERATE_WALLET_ADDRESS_MUTATION } from '@roadmanjs/wallet-client';
import { addSeconds } from 'date-fns';
import _get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { cookies } from '@/lib/secureCookies';
import type { NextRequest } from 'next/server';

import type { ResType } from '@/components/types.generated';
import { getClient } from '@/lib/apollo-wrapper.server';
import { flashCookie, refreshHeader } from '@/lib/redirect';

const baseUrl = '/html/wallet';

export async function GET() {
  const res = new Response(null, {
    headers: {
      Refresh: refreshHeader(baseUrl, 10),
    },
  });

  return res;
}

export async function POST(req: NextRequest) {
  const in3Secs = addSeconds(new Date(), 5);
  const in3SecsStr = in3Secs.toUTCString();

  let pathname = baseUrl;

  try {
    const cookieStore = cookies();

    const formData = await req.formData();
    pathname = isEmpty(formData.get('pathname'))
      ? baseUrl
      : (formData.get('pathname') as string);

    const currency = formData.get('currency');
    if (isEmpty(currency)) throw new Error('Invalid currency');

    const api = await getClient().mutate<{ data: ResType }>({
      mutation: GENERATE_WALLET_ADDRESS_MUTATION,
      variables: {
        currency,
        forceGenerate: false,
      },
    });

    if (isEmpty(api.data?.data)) throw api.errors;

    const success = _get(api, 'data.data.success', false);
    const message = _get(api, 'data.data.message', '');

    if (!success) throw new Error(message);

    cookieStore.set('refresh', 'true', { expires: in3Secs });
    cookieStore.set('message', 'Successfully generated new address', {
      expires: in3Secs,
    });
    cookieStore.set('success', `${success}`, { expires: in3Secs });

    return new Response(null, {
      headers: {
        Refresh: refreshHeader(pathname, 0),
      },
    });
  } catch (error: any) {
    console.log('error generating address', error);
    const message =
      (error && error?.message) || `Failed to generating new address`;
    const res = new Response(null, {
      headers: {
        Refresh: refreshHeader(pathname, 0),
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
