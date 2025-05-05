import type { IronSession, IronSessionData } from 'iron-session';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { AppStep } from './utils';

export type UserGroup = 'chatbot' | 'human' | 'test';

export type SessionUser = {
  userId: string;
  group: UserGroup;
  chatStartTime?: number;
  currentStep: AppStep;
};

declare module 'iron-session' {
  interface IronSessionData {
    user: SessionUser;
  }
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    'complex_password_at_least_32_characters_long',
  cookieName: 'phlu_network_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
};

// Helper to get session on server side
export async function getSession(): Promise<IronSession<IronSessionData>> {
  // Using type assertion since iron-session types are not fully compatible with Next.js cookies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession((await cookies()) as any, sessionOptions);
}

// Helper to get session in middleware or server actions
export async function getSessionFromRequest(
  req: NextRequest
): Promise<IronSession<IronSessionData>> {
  // Using type assertion since iron-session types are not fully compatible with Next.js cookies
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession(req.cookies as any, sessionOptions);
}

// Helper to create a session
export async function createSession(
  userId: string,
  group: UserGroup
): Promise<NextResponse> {
  const session = await getSession();

  session.user = {
    userId,
    group,
    currentStep: AppStep.ONBOARDING,
  };

  await session.save();
  return NextResponse.json({ ok: true });
}

// Helper to destroy session
export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

// Helper to check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session.user.group;
}

// Helper to get user data
export async function getUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user || null;
}

// Map of steps to their allowed next steps
export const STEP_FLOW: Record<AppStep, readonly AppStep[]> = {
  [AppStep.ONBOARDING]: [AppStep.QUESTIONNAIRE_1],
  [AppStep.QUESTIONNAIRE_1]: [AppStep.EXPLANATION],
  [AppStep.EXPLANATION]: [AppStep.NETWORK_MAP],
  [AppStep.NETWORK_MAP]: [AppStep.INTERVIEW],
  [AppStep.INTERVIEW]: [AppStep.QUESTIONNAIRE_2],
  [AppStep.QUESTIONNAIRE_2]: [AppStep.THANK_YOU],
  [AppStep.THANK_YOU]: [],
} as const;
