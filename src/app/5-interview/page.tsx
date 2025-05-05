import { PageHeader } from '@/components/page-header';
import { readChat } from '@/lib/chatbot/persistence';
import { findMany } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBUser } from '@/types/db';
import { ChatbotInterview } from './chatbot';
import { HumanInterview } from './human';
import { DownloadNetworkMapButton } from '@/components/download-network-map-button';
import { NextStepButton } from '@/components/next-step-button';

export default async function InterviewPage() {
  const session = await getSession();
  const userGroup = session.user.group;

  const existingChat =
    userGroup === 'chatbot' ? await readChat({ id: session.user.userId }) : [];

  const chatAlreadyFinished =
    existingChat.length > 0
      ? (
          await findMany<DBUser>('users', {
            id: session.user.userId,
            finished_interview: true,
          })
        ).length > 0
      : false;

  return (
    <>
      <PageHeader
        title="Interview über dein Netzwerk"
        timeEstimateInMinutes={12}
        action={
          userGroup === 'human' ? (
            <DownloadNetworkMapButton />
          ) : (
            <div className="flex items-center gap-2">
              <DownloadNetworkMapButton />
              <NextStepButton
                href="/6-questionnaire"
                label="Weiter"
                forceUserConfirmation
              />
            </div>
          )
        }
      />
      <main className="flex flex-col items-center gap-6">
        <div className="w-full flex items-center justify-center">
          {userGroup === 'human' ? (
            <HumanInterview />
          ) : (
            <ChatbotInterview
              id={session.user.userId}
              initialMessages={existingChat}
              chatAlreadyFinished={chatAlreadyFinished}
            />
          )}
        </div>
      </main>
    </>
  );
}
