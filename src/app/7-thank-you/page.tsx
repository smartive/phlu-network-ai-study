import { H1, P } from '@/components/typography';
import { DownloadNetworkMapButton } from '@/components/download-network-map-button';

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-8">
      <main className="flex flex-col items-center gap-6 max-w-2xl">
        <H1>Vielen Dank für Ihre Teilnahme!</H1>
        <P>
          Vielen Dank für Ihre Teilnahme an der Studie. Sie können nun das
          Fenster schliessen. Ihre Daten wurden erfolgreich gespeichert.
        </P>
        <DownloadNetworkMapButton />
      </main>
    </div>
  );
}
