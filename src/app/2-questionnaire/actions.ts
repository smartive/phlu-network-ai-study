'use server';

import { update } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBUser } from '@/types/db';

type cooperativeActivitiesFields = {
  KoopTaet01: string;
  KoopTaet02: string;
  KoopTaet03: string;
  KoopTaet04: string;
  KoopTaet05: string;
  KoopTaet06: string;
  KoopTaet07: string;
  KoopTaet08: string;
  KoopTaet09: string;
  KoopTaet10: string;
  KoopTaet11: string;
  KoopTaet12: string;
  KoopTaet13: string;
  KoopTaet14: string;
  KoopTaet15: string;
  KoopTaet16: string;
  KoopTaet17: string;
  KoopTaet18: string;
  KoopTaet19: string;
  KoopTaet20: string;
  KoopTaet21: string;
  KoopTaet22: string;
};

type presenceFields = {
  PräseP_1: string;
  PräseP_2: string;
  PräseP_3: string;
  PräseP_4: string;
  PräseH_1: string;
  PräseH_2: string;
  PräseH_3: string;
  PräseH_4: string;
};

export async function saveQuestionnaire(
  data: {
    email: string;
    gender: string;
    age: string;
    studyLevel: string;
    studyProgram: string;
    teachingExperience: boolean;
    teachingExperienceDetails?: string;
    teachingFunction?: string;
    coopExperience: boolean;
    coopExperienceDetails?: string;
  } & cooperativeActivitiesFields &
    presenceFields
) {
  const session = await getSession();

  if (!session.user?.userId) {
    throw new Error('User not found');
  }

  try {
    if (session.user.group !== 'test') {
      await update<DBUser>('users', session.user.userId, {
        questionnaire_1: {
          personal_info: {
            email: data.email,
            gender: data.gender,
            age: parseInt(data.age, 10),
            study_level: data.studyLevel,
            study_program: data.studyProgram,
            teaching_experience: data.teachingExperience,
            teaching_experience_details: data.teachingExperienceDetails || null,
            coop_experience: data.coopExperience,
            coop_experience_details: data.coopExperienceDetails || null,
          },
          cooperative_activities: {
            KoopTaet01: parseInt(data.KoopTaet01),
            KoopTaet02: parseInt(data.KoopTaet02),
            KoopTaet03: parseInt(data.KoopTaet03),
            KoopTaet04: parseInt(data.KoopTaet04),
            KoopTaet05: parseInt(data.KoopTaet05),
            KoopTaet06: parseInt(data.KoopTaet06),
            KoopTaet07: parseInt(data.KoopTaet07),
            KoopTaet08: parseInt(data.KoopTaet08),
            KoopTaet09: parseInt(data.KoopTaet09),
            KoopTaet10: parseInt(data.KoopTaet10),
            KoopTaet11: parseInt(data.KoopTaet11),
            KoopTaet12: parseInt(data.KoopTaet12),
            KoopTaet13: parseInt(data.KoopTaet13),
            KoopTaet14: parseInt(data.KoopTaet14),
            KoopTaet15: parseInt(data.KoopTaet15),
            KoopTaet16: parseInt(data.KoopTaet16),
            KoopTaet17: parseInt(data.KoopTaet17),
            KoopTaet18: parseInt(data.KoopTaet18),
            KoopTaet19: parseInt(data.KoopTaet19),
            KoopTaet20: parseInt(data.KoopTaet20),
            KoopTaet21: parseInt(data.KoopTaet21),
            KoopTaet22: parseInt(data.KoopTaet22),
          },
          presence_network: {
            PräseP_1: parseInt(data.PräseP_1),
            PräseP_2: parseInt(data.PräseP_2),
            PräseP_3: parseInt(data.PräseP_3),
            PräseP_4: parseInt(data.PräseP_4),
            PräseH_1: parseInt(data.PräseH_1),
            PräseH_2: parseInt(data.PräseH_2),
            PräseH_3: parseInt(data.PräseH_3),
            PräseH_4: parseInt(data.PräseH_4),
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
