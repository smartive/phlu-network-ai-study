import { getSession } from '@/lib/session';
import { QuestionnaireForm } from './form';
export default async function QuestionnaireTwoPage() {
  const session = await getSession();

  return <QuestionnaireForm isHumanGroup={session.user.group === 'human'} />;
}
