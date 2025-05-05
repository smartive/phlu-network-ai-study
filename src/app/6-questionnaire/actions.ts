'use server';

import { update } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBUser } from '@/types/db';

type AdaptionFields = {
  Wirk_01: string;
  Wirk_02: string;
  Wirk_03: string;
  Wirk_04: string;
  Wirk_05: string;
  Wirk_06: string;
};

export async function saveQuestionnaire(
  data: {
    liked: string;
    disliked: string;
  } & AdaptionFields
) {
  const session = await getSession();

  if (!session.user?.userId) {
    throw new Error('User not found');
  }

  try {
    if (session.user.group !== 'test') {
      await update<DBUser>('users', session.user.userId, {
        questionnaire_2: {
          adaption_assessment: {
            Wirk_01: parseInt(data.Wirk_01),
            Wirk_02: parseInt(data.Wirk_02),
            Wirk_03: parseInt(data.Wirk_03),
            Wirk_04: parseInt(data.Wirk_04),
            Wirk_05: parseInt(data.Wirk_05),
            Wirk_06: parseInt(data.Wirk_06),
          },
          feedback: {
            liked: data.liked,
            disliked: data.disliked,
          },
        },
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to save questionnaire:', error);
    throw new Error('Failed to save questionnaire');
  }
}
