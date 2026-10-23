import { refreshHeader } from '@/lib/redirect';

const baseUrl = '/';

async function GET() {
  const res = new Response(null, {
    headers: {
      Refresh: refreshHeader(baseUrl, 0),
    },
  });

  return res;
}

export { GET, GET as POST };
