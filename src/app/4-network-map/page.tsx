import { PageHeader } from '@/components/page-header';
import { P } from '@/components/typography';
import { findOneByUserId } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBNetworkMap } from '@/types/db';
import { Person } from '@/types/network-map';
import { NetworkEditor } from './network-editor';
import { NextStepButton } from '@/components/next-step-button';

export default async function NetworkMapPage() {
  const session = await getSession();

  const networkMap = await findOneByUserId<DBNetworkMap>(
    'network_maps',
    session.user.userId
  );

  const initialPeople = networkMap
    ? (networkMap.map_data as { people: Person[] }).people
    : [];

  return (
    <>
      <PageHeader
        title="Persönliche Netzwerkkarte"
        timeEstimateInMinutes={10}
        action={<NextStepButton href="/5-interview" />}
      />
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-8">
        <main className="flex flex-col items-center gap-6">
          <P>
            Erstellen Sie bitte Ihre persönliche Netzwerkkarte zu Ihren
            Lerngelegenheiten zu <strong>lernzentrierter Kooperation</strong>.
            Diese können in positiv oder auch negativ erlebten Situationen
            stattgefunden haben. Es interessieren{' '}
            <strong>
              alle Personen oder Personengruppen (mit und ohne
              Ausbildungsauftrag)
            </strong>
            , von denen Sie <strong>in den letzten 12 Monaten</strong> etwas zu
            lernzentrierter Kooperation gelernt haben (max. 8 Personen). Diese
            können an der PH oder an Praktikumsschulen tätig sein sowie in Ihrem
            privaten Umfeld und weiteren Lebensbereichen. Falls Sie an einer
            Schule angestellt waren oder sind, können Sie diese auch
            miteinbeziehen.
          </P>
          <P>
            Klicken Sie auf den Button «Person hinzufügen» und beantworten Sie
            bitte die Fragen.
          </P>
          <P>
            Zur Erinnerung: Lernzentrierte Kooperation ist eine interaktive
            Tätigkeit zwischen Erwachsenen, bei der die Lernprozesse der
            Schüler:innen im Zentrum stehen.
          </P>
          <NetworkEditor initialPeople={initialPeople} />
        </main>
      </div>
    </>
  );
}
