import { H2, P } from '@/components/typography';

export default function NoAccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <H2>Zugang verweigert</H2>
          <P className="mt-2">
            Sie benötigen einen gültigen Zugangscode, um an diesem
            Forschungsprojekt teilzunehmen. Bitte überprüfen Sie Ihre E-Mail auf
            den Einladungslink oder kontaktieren Sie das Forschungsteam.
          </P>
        </div>
      </div>
    </div>
  );
}
