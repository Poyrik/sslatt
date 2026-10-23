import isEmpty from 'lodash/isEmpty';
import { cookies } from '@/lib/secureCookies';
import type { NextRequest } from 'next/server';
import { refreshHeader } from '@/lib/redirect';

export async function GET() {
  const res = new Response(null, {
    headers: {
      Refresh: '0; url=/html',
    },
  });

  return res;
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const theme = cookieStore.get('theme');

  const formData = await req.formData();
  const pathname = formData.get('pathname');

  let newTheme = null;
  if (theme && theme.value === 'dark') {
    newTheme = 'light';
  } else {
    newTheme = 'dark';
  }

  cookieStore.set('theme', newTheme);

  return new Response(null as any, {
    headers: {
      'Set-Cookie': `theme=${newTheme}; path=/;`,
      Refresh: refreshHeader(pathname, 0, '/'),
    },
  });
}
