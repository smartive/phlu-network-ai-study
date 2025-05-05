'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ReactNode } from 'react';

interface DataPrivacyModalProps {
  trigger: ReactNode;
}

export function DataPrivacyModal({ trigger }: DataPrivacyModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Information zur Verwendung Ihrer Daten</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-semibold">
              Wie verwenden wir Ihrer (personenbezogenen) Daten?
            </div>
            <p>
              Die an der Befragung und Datenanalyse beteiligten Forschenden
              unterstehen der Verpflichtung zur Verschwiegenheit. Wir halten uns
              an ethische Grundsätze wissenschaftlicher Forschung.
            </p>
            <p className="mt-2">
              Die Rohdaten der Antworten werde von Mitarbeitenden des
              Forschungsprojektes «network» anonymisiert. Die anonymisierten
              Daten werden ausgewertet. Sofern bei Ergebnissen ein Risiko
              bestünde, dass einzelne Personen identifizierbar würden,
              respektieren wir auf allen Ebenen der Berichterstattung den
              Persönlichkeitsschutz, dies selbstverständlich auch innerhalb der
              PH gegenüber Dozierenden und Führungspersonen.
            </p>
          </div>

          <div>
            <div className="font-semibold">
              Was für personenbezogene Daten werden erfasst und verarbeitet?
            </div>
            <p>
              In der Befragung werden personenbezogene Daten erhoben (Alter,
              Geschlecht, Erfahrungen etc.).
            </p>
          </div>

          <div>
            <div className="font-semibold">
              Gesetzliche Grundlage für die Verarbeitung der Daten:
            </div>
            <p>Einwilligung der Studierenden</p>
          </div>

          <div>
            <div className="font-semibold">
              Empfänger und Kategorien von Empfängern von personenbezogenen
              Daten:
            </div>
            <p>
              Dr. Marco Galle (Projektleiter) und Nuria Steiner (studentische
              Hilfskraft)
            </p>
          </div>

          <div>
            <div className="font-semibold">
              Gesetzliche oder vertragliche Auflage:
            </div>
            <p>
              Es besteht keine vertragliche Verpflichtung an der Befragung
              teilzunehmen.
            </p>
          </div>

          <div>
            <div className="font-semibold">Automatisiertes Verfahren:</div>
            <p>
              Es finden keine automatischen Entscheidungsfindungen auf der
              Grundlage Ihrer personenbezogenen Daten statt.
            </p>
          </div>

          <div>
            <div className="font-semibold">
              Information zu den Rechten der Datensubjekte:
            </div>
            <p>
              Als Teilnehmer:in dieser Befragung stehen Ihnen besondere Rechte
              im Hinblick auf die Verarbeitung Ihrer personenbezogenen Daten zu.
              Hierzu zählen:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Recht auf Auskunft über Ihre personenbezogenen Daten;</li>
              <li>
                Recht auf Berichterstattung Ihrer personenbezogenen Daten;
              </li>
              <li>Recht auf Löschung der personenbezogenen Daten;</li>
              <li>
                Recht auf eingeschränkte Nutzung Ihrer personenbezogenen Daten;
              </li>
              <li>Recht, der Datenverarbeitung zu widersprechen;</li>
              <li>
                Recht, personenbezogene Daten über Sie in lesbarer Form zu
                erhalten und diese zu transferieren.
              </li>
            </ul>
          </div>

          <div>
            <div className="font-semibold">
              Information über das Recht, die Zustimmung zu widerrufen:
            </div>
            <p>
              Als Teilnehmer:in dieser Befragung haben Sie das Recht, Ihre
              Einwilligung in die Verarbeitung Ihrer personenbezogenen Daten
              jederzeit mit Wirkung für die Zukunft zu widerrufen. Kontaktieren
              Sie gegebenenfalls Marco Galle per E-Mail (marco.galle@phlu.ch).
            </p>
          </div>

          <div>
            <div className="font-semibold">
              Wie lange werden die Daten verarbeitet:
            </div>
            <p>
              Personenbezogene Daten werden bis zum Ende der Datenauswertung
              aufbewahrt und anschliessend gelöscht. Die anonymisierten Daten
              werden – aufgrund der Vorgaben des SNF – auf der FORS-Datenbank
              für weitere Forschende zugänglich gemacht.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
