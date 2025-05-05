import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getSessionFromRequest, STEP_FLOW } from './lib/session';
import { AppStep } from './lib/utils';

// List of paths that don't require authentication
const PUBLIC_PATHS = ['/', '/1-onboarding', '/no-access'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is public
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Attempt to load any existing session
  const session = await getSessionFromRequest(request);

  // If user is not logged in, redirect to no-access
  if (!session.user?.group) {
    return NextResponse.redirect(new URL('/no-access', request.url));
  }

  // Get the current step from the pathname
  const currentPathStep = Object.values(AppStep).find((step) =>
    pathname.startsWith(`/${step}`)
  );

  if (!currentPathStep) {
    return NextResponse.next(); // Not a step path, allow access (e.g. API routes)
  }

  const userCurrentStep = session.user.currentStep || AppStep.ONBOARDING;
  const allowedNextSteps = STEP_FLOW[userCurrentStep];

  // Allow access to current step or next allowed step
  if (
    currentPathStep === userCurrentStep ||
    allowedNextSteps.includes(currentPathStep as AppStep)
  ) {
    return NextResponse.next();
  }

  // If trying to access a step that's not allowed, redirect to current step
  return NextResponse.redirect(new URL(`/${userCurrentStep}`, request.url));
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|videos|public/).*)',
  ],
};
