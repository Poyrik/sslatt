import * as jose from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';

import { ApolloWrapper } from '@/lib/apollo-wrapper.client';

import AdminLayoutWrapper from './admin.layout';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate: no valid session token, no admin shell.
 * The admin role itself is enforced in AdminLayoutWrapper (client, `admin`
 * prop) and, authoritatively, by the backend `isAdmin` middleware on every
 * admin GraphQL resolver.
 */
const hasValidSession = async (): Promise<boolean> => {
  const token = cookies().get('accessToken')?.value;
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!token || !secret) return false;

  try {
    await jose.jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
};

const AdminLayout = async ({ children }: any) => {
  if (!(await hasValidSession())) {
    redirect('/');
  }

  return (
    <ApolloWrapper>
      <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
    </ApolloWrapper>
  );
};

export default AdminLayout;
