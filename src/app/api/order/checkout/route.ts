import { addSeconds } from 'date-fns';
import _get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { cookies } from '@/lib/secureCookies';
import type { NextRequest } from 'next/server';

import type { ResType } from '@/components/types.generated';
import { getClient } from '@/lib/apollo-wrapper.server';
import { CHECKOUT_ORDER } from '@/lib/gql';
import { flashCookie, refreshHeader } from '@/lib/redirect';

const baseUrl = '/html/order';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const query = req.nextUrl.searchParams;
  const pathname = query.get('pathname');
  const type = query.get('type');
  const typeId = query.get('typeId');
  const qty = query.get('qty');

  if (isEmpty(type) || isEmpty(typeId) || isEmpty(qty)) {
    const in3Secs = addSeconds(new Date(), 5);
    cookieStore.set('message', 'Invalid order details', { expires: in3Secs });
    cookieStore.set('success', 'false', { expires: in3Secs });

    const redirectUrl = isEmpty(pathname) ? baseUrl : pathname;
    return new Response(null, {
      headers: {
        Refresh: refreshHeader(redirectUrl, 0),
      },
    });
  }

  const checkoutLink = `/html/order/checkout/new?type=${type}&typeId=${typeId}&qty=${qty}`;

  const res = new Response(null, {
    headers: {
      Refresh: refreshHeader(checkoutLink, 0),
    },
  });

  return res;
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const in3Secs = addSeconds(new Date(), 5);
  const in3SecsStr = in3Secs.toUTCString();

  let pathname = baseUrl;

  try {
    // TODO pin verification

    const formData = await req.formData();
    const walletId = formData.get('walletId');
    pathname = isEmpty(formData.get('pathname'))
      ? baseUrl
      : (formData.get('pathname') as string);
    const details = formData.get('details');
    const orderType = formData.get('orderType');
    const orderTypeId = formData.get('orderTypeId');
    const qty = formData.get('qty');

    const variables = {
      walletId,
      order: {
        details,
        typeId: orderTypeId,
        type: orderType,
        quantity: +(qty || 1),
      },
    };

    pathname = `/html/order/checkout/new?type=${orderType}&typeId=${orderTypeId}&qty=${qty}`;

    const api = await getClient().mutate<{ data: ResType }>({
      mutation: CHECKOUT_ORDER,
      variables,
    });

    if (isEmpty(api.data?.data)) throw api.errors as any;

    const success = _get(api, 'data.data.success', false);
    const message = _get(api, 'data.data.message', '');

    if (!success) throw new Error(message);

    cookieStore.set('refresh', 'true', { expires: in3Secs });
    cookieStore.set('message', message, { expires: in3Secs });
    cookieStore.set('success', `${success}`, { expires: in3Secs });

    return new Response(null, {
      headers: {
        Refresh: refreshHeader(baseUrl, 0),
      },
    });
  } catch (error: any) {
    console.log('error creating checking out', error);
    const message = (error && error?.message) || `Failed to checkout`;
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
