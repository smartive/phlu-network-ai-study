import { NextStepButton } from '@/components/next-step-button';
import { PageHeader } from '@/components/page-header';

export default async function ExplanationPage() {
  return (
    <>
      <PageHeader
        title="2. Video: Anleitung zur Erstellung der Netzwerkkarte"
        timeEstimateInMinutes={3}
        action={<NextStepButton href="/4-network-map" />}
      />
      <main className="flex flex-col items-center justify-center text-center gap-6 mt-8">
        <video
          controls
          preload="metadata"
          poster="/videos/network.LernzentrKoop.jpg"
          className="border-4 border-green-500 rounded-lg"
        >
          <source src="/videos/network.LernzentrKoop.mp4" type="video/mp4" />
        </video>
      </main>
    </>
  );
}
