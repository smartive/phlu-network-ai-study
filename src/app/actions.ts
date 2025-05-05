'use server';

import { insert } from '@/lib/db';
import {
  getSession,
  isAuthenticated,
  STEP_FLOW,
  UserGroup,
} from '@/lib/session';
import { AppStep } from '@/lib/utils';
import { DBUser } from '@/types/db';
import { redirect } from 'next/navigation';

const VALID_ACCESS_KEYS = {
  chatbot: process.env.ACCESS_KEY_GROUP_CHATBOT,
  human: process.env.ACCESS_KEY_GROUP_HUMAN_INTERVIEW,
  test: process.env.ACCESS_KEY_GROUP_TESTER,
} as const;

export async function initSession(formData: FormData) {
  const accessKey = formData.get('key')?.toString();
  if (!accessKey) {
    redirect('/no-access');
  }

  let validGroup: UserGroup | null = null;
  Object.entries(VALID_ACCESS_KEYS).forEach(([group, validKey]) => {
    if (validKey && accessKey === validKey) {
      validGroup = group as UserGroup;
    }
  });

  if (!validGroup) {
    redirect('/no-access');
  }

  // Create a unique userId
  const userId = `user_${validGroup}_${Math.random()
    .toString(36)
    .substring(2, 15)}_${Date.now()}`;

  // Create user in database
  try {
    await insert<DBUser>('users', {
      id: userId,
      assigned_group: validGroup,
      // Initialize with empty/null values - will be filled out in questionnaire
      questionnaire_1: null,
      questionnaire_2: null,
    });
  } catch (error) {
    console.error('Failed to create user in database:', error);
    throw error;
  }

  // Set up the session
  const session = await getSession();
  session.user = {
    userId,
    group: validGroup,
    currentStep: AppStep.QUESTIONNAIRE_1,
  };

  await session.save();
  redirect('/2-questionnaire');
}

export async function updateStep(nextStep: AppStep) {
  const session = await getSession();

  if (!isAuthenticated()) {
    throw new Error('User not logged in');
  }

  const currentStep = session.user.currentStep || AppStep.ONBOARDING;
  const allowedNextSteps = STEP_FLOW[currentStep];

  if (!allowedNextSteps?.includes(nextStep)) {
    throw new Error(`Invalid step transition: ${currentStep} -> ${nextStep}`);
  }

  session.user.currentStep = nextStep;
  await session.save();
}
