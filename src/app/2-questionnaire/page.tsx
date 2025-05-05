'use client';

import { PageHeader } from '@/components/page-header';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { AppStep } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateStep } from '../actions';
import { saveQuestionnaire } from './actions';

const cooperativeLikertScale = ['1', '2', '3', '4', '5'] as const;
type CooperativeLikertValue =
  | (typeof cooperativeLikertScale)[number]
  | undefined;

const cooperativeLikertLabels: Record<
  Exclude<CooperativeLikertValue, undefined>,
  string
> = {
  '1': 'nicht nützlich',
  '2': 'wenig nützlich',
  '3': 'nützlich',
  '4': 'sehr nützlich',
  '5': 'nicht erlebt',
};

const presenceLikertScale = ['1', '2', '3', '4', '5'] as const;
type PresenceLikertValue = (typeof presenceLikertScale)[number] | undefined;

const presenceLikertLabels: Record<
  Exclude<PresenceLikertValue, undefined>,
  string
> = {
  '1': 'trifft überhaupt nicht zu',
  '2': 'trifft nicht zu',
  '3': 'trifft zu',
  '4': 'trifft voll und ganz zu',
  '5': 'keine Antwort möglich',
};

const cooperativeActivitiesQuestions = [
  { id: 'KoopTaet01', text: 'Terminabsprachen' },
  {
    id: 'KoopTaet02',
    text: 'Austausch von erfreulichen Unterrichtserfahrungen',
  },
  {
    id: 'KoopTaet03',
    text: 'Austausch von unerfreulichen Unterrichtserfahrungen',
  },
  { id: 'KoopTaet04', text: 'Austausch von Unterrichtsmaterialien' },
  { id: 'KoopTaet05', text: 'Weitergabe neuer pädagogischer Ideen' },
  {
    id: 'KoopTaet06',
    text: 'Gemeinsames Erproben neuer Unterrichtsideen und Methoden',
  },
  {
    id: 'KoopTaet07',
    text: 'Gemeinsame Entwicklung von Unterrichtsmaterialien',
  },
  {
    id: 'KoopTaet08',
    text: 'Gemeinsame Beurteilung von Lernleistungen der Schüler:innen',
  },
  { id: 'KoopTaet09', text: 'Klärung von Lernzielen der Schüler:innen' },
  { id: 'KoopTaet10', text: 'Gemeinsames Erstellen von Förderplanungen' },
  {
    id: 'KoopTaet11',
    text: 'Gemeinsame Durchführung von Standortgesprächen',
  },
  { id: 'KoopTaet12', text: 'Austausch zu Diagnosen von Lernständen' },
  {
    id: 'KoopTaet13',
    text: 'Gemeinsames Erstellen von individuellen Lernprogrammen oder Lernkonzepte',
  },
  { id: 'KoopTaet14', text: 'Besprechen von Problemen mit der Klasse' },
  {
    id: 'KoopTaet15',
    text: 'Feedback geben zu Unterrichtsbeobachtungen (Hospitation)',
  },
  {
    id: 'KoopTaet16',
    text: 'Besprechen von persönlicher Unzufriedenheit und Probleme mit der Arbeit',
  },
  {
    id: 'KoopTaet17',
    text: 'Gemeinsame Grobplanung von Unterricht über einen längeren Zeitraum',
  },
  { id: 'KoopTaet18', text: 'Gemeinsame Feinplanung von Unterricht' },
  {
    id: 'KoopTaet19',
    text: 'Gemeinsame Durchführung von Unterricht (Teamteaching)',
  },
  {
    id: 'KoopTaet20',
    text: 'Gemeinsame Reflexion und Nachbereitung von Unterricht',
  },
  {
    id: 'KoopTaet21',
    text: 'Abstimmen der Menge und Aufgabenstellung der Hausaufgaben',
  },
  {
    id: 'KoopTaet22',
    text: 'Gemeinsame Weiterentwicklung von Unterricht',
  },
] as const;

const presencePraktikumQuestions = [
  {
    id: 'PräseP_1',
    text: 'Ich nehme häufig Kontakt mit Fachpersonen an der Schule auf, um von ihrer Expertise zu lernen.',
  },
  {
    id: 'PräseP_2',
    text: 'Ich halte mich häufig ausserhalb der obligatorischen Anwesenheitspflicht in der Schule auf, um mit anderen Personen in Kontakt zu treten.',
  },
  {
    id: 'PräseP_3',
    text: 'Ich halte mich in der Schule nur so lange auf, wie es von mir erwartet wurde.',
  },
  {
    id: 'PräseP_4',
    text: 'In den Praktika versuche ich von möglichst vielen Personen zu lernen.',
  },
] as const;

const presenceHochschuleQuestions = [
  {
    id: 'PräseH_1',
    text: 'Ich nehme häufig Kontakt mit Fachpersonen an der PH auf, um von ihrer Expertise zu lernen.',
  },
  {
    id: 'PräseH_2',
    text: 'Ich halte mich häufig ausserhalb der obligatorischen Anwesenheitspflicht in der PH auf, um mit anderen Personen in Kontakt zu treten.',
  },
  {
    id: 'PräseH_3',
    text: 'Ich halte mich in der PH nur so lange auf, wie es von mir erwartet wurde.',
  },
  {
    id: 'PräseH_4',
    text: 'Im Studium versuche ich von möglichst vielen Personen zu lernen.',
  },
] as const;

const cooperativeActivitiesSchema = z.object({
  KoopTaet01: z.enum(cooperativeLikertScale),
  KoopTaet02: z.enum(cooperativeLikertScale),
  KoopTaet03: z.enum(cooperativeLikertScale),
  KoopTaet04: z.enum(cooperativeLikertScale),
  KoopTaet05: z.enum(cooperativeLikertScale),
  KoopTaet06: z.enum(cooperativeLikertScale),
  KoopTaet07: z.enum(cooperativeLikertScale),
  KoopTaet08: z.enum(cooperativeLikertScale),
  KoopTaet09: z.enum(cooperativeLikertScale),
  KoopTaet10: z.enum(cooperativeLikertScale),
  KoopTaet11: z.enum(cooperativeLikertScale),
  KoopTaet12: z.enum(cooperativeLikertScale),
  KoopTaet13: z.enum(cooperativeLikertScale),
  KoopTaet14: z.enum(cooperativeLikertScale),
  KoopTaet15: z.enum(cooperativeLikertScale),
  KoopTaet16: z.enum(cooperativeLikertScale),
  KoopTaet17: z.enum(cooperativeLikertScale),
  KoopTaet18: z.enum(cooperativeLikertScale),
  KoopTaet19: z.enum(cooperativeLikertScale),
  KoopTaet20: z.enum(cooperativeLikertScale),
  KoopTaet21: z.enum(cooperativeLikertScale),
  KoopTaet22: z.enum(cooperativeLikertScale),
});

const presenceSchema = z.object({
  PräseP_1: z.enum(presenceLikertScale),
  PräseP_2: z.enum(presenceLikertScale),
  PräseP_3: z.enum(presenceLikertScale),
  PräseP_4: z.enum(presenceLikertScale),
  PräseH_1: z.enum(presenceLikertScale),
  PräseH_2: z.enum(presenceLikertScale),
  PräseH_3: z.enum(presenceLikertScale),
  PräseH_4: z.enum(presenceLikertScale),
});

const questionnaireSchema = z.object({
  email: z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein'),
  gender: z.enum(['weiblich', 'männlich', 'divers'], {
    required_error: 'Bitte wählen Sie ein Geschlecht aus',
  }),
  age: z.string().min(1, 'Bitte geben Sie Ihr Alter ein'),
  studyLevel: z.enum(['Primarstufe', 'Sekundarstufe 1'], {
    required_error: 'Bitte wählen Sie eine Stufe aus',
  }),
  studyProgram: z.string().min(1, 'Bitte wählen Sie einen Studiengang aus'),
  teachingExperience: z.boolean(),
  teachingExperienceDetails: z.string().optional(),
  coopExperience: z.boolean(),
  coopExperienceDetails: z.string().optional(),
  ...cooperativeActivitiesSchema.shape,
  ...presenceSchema.shape,
});

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

export default function QuestionnaireOnePage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<QuestionnaireData>({
    resolver: zodResolver(questionnaireSchema),
    mode: 'onChange',
  });

  const studyLevel = watch('studyLevel');
  const isPrimarSelected = studyLevel === 'Primarstufe';
  const hasTeachingExperience = watch('teachingExperience');
  const hasCoopExperience = watch('coopExperience');

  // Reset study program when study level changes
  useEffect(() => {
    if (studyLevel) {
      setValue('studyProgram', '', { shouldValidate: true });
    }
  }, [studyLevel, setValue]);

  const onSubmit = async (data: QuestionnaireData) => {
    startTransition(async () => {
      try {
        await saveQuestionnaire(data);
        await updateStep(AppStep.EXPLANATION);
        router.push(AppStep.EXPLANATION);
      } catch (error) {
        console.error('Failed to save questionnaire:', error);
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Erster Fragebogen"
        timeEstimateInMinutes={10}
        action={
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Wird gespeichert...' : 'Weiter'}
          </Button>
        }
      />
      <div className="flex flex-col items-center min-h-screen py-8">
        <main className="w-full max-w-6xl">
          <P className="mb-8">
            Bitte beantworten Sie die folgenden Fragen zu Ihrer Person. Ihre
            Antworten werden vertraulich behandelt.
          </P>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Persönliche Informationen
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Mailadresse der Studierenden
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        aria-invalid={!!errors.email}
                        disabled={isPending}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Gender Field */}
                    <div className="space-y-2">
                      <Label>Geschlecht</Label>
                      <RadioGroup
                        onValueChange={(value) => {
                          setValue(
                            'gender',
                            value as QuestionnaireData['gender'],
                            {
                              shouldValidate: true,
                            }
                          );
                        }}
                        value={watch('gender')}
                        disabled={isPending}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="weiblich" id="weiblich" />
                          <Label htmlFor="weiblich">weiblich</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="männlich" id="männlich" />
                          <Label htmlFor="männlich">männlich</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="divers" id="divers" />
                          <Label htmlFor="divers">divers</Label>
                        </div>
                      </RadioGroup>
                      {errors.gender && (
                        <p className="text-sm text-red-500">
                          {errors.gender.message}
                        </p>
                      )}
                    </div>

                    {/* Age Field */}
                    <div className="space-y-2">
                      <Label htmlFor="age">Alter</Label>
                      <Input
                        id="age"
                        type="number"
                        min="0"
                        {...register('age')}
                        aria-invalid={!!errors.age}
                        disabled={isPending}
                      />
                      {errors.age && (
                        <p className="text-sm text-red-500">
                          {errors.age.message}
                        </p>
                      )}
                    </div>

                    {/* Study Level Field */}
                    <div className="space-y-2">
                      <Label>Studiengang</Label>
                      <RadioGroup
                        onValueChange={(value) => {
                          setValue(
                            'studyLevel',
                            value as QuestionnaireData['studyLevel'],
                            {
                              shouldValidate: true,
                            }
                          );
                        }}
                        value={watch('studyLevel')}
                        disabled={isPending}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Primarstufe"
                            id="Primarstufe"
                          />
                          <Label htmlFor="Primarstufe">Primarstufe</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="Sekundarstufe 1"
                            id="Sekundarstufe"
                          />
                          <Label htmlFor="Sekundarstufe">Sekundarstufe 1</Label>
                        </div>
                      </RadioGroup>
                      {errors.studyLevel && (
                        <p className="text-sm text-red-500">
                          {errors.studyLevel.message}
                        </p>
                      )}
                    </div>

                    {/* Study Program Field - Conditional based on Study Level */}
                    {studyLevel && (
                      <div className="space-y-2">
                        <Label>Studienprogramm</Label>
                        <RadioGroup
                          onValueChange={(value) => {
                            setValue('studyProgram', value, {
                              shouldValidate: true,
                            });
                          }}
                          value={watch('studyProgram')}
                          disabled={isPending}
                        >
                          {isPrimarSelected ? (
                            <>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="Regelstudium Primarstufe"
                                  id="regelstudium"
                                />
                                <Label htmlFor="regelstudium">
                                  Regelstudium Primarstufe
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="Facherweiterungsstudium für Primarlehrpersonen"
                                  id="facherweiterung"
                                />
                                <Label htmlFor="facherweiterung">
                                  Facherweiterungsstudium für Primarlehrpersonen
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="Studienprogramm mit Anrechnungen"
                                  id="anrechnungen"
                                />
                                <Label htmlFor="anrechnungen">
                                  Studienprogramm mit Anrechnungen
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="Quereinstieg Primarstufe"
                                  id="quereinstieg"
                                />
                                <Label htmlFor="quereinstieg">
                                  Quereinstieg Primarstufe - Aufnahme «sur
                                  dossier»
                                </Label>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="SR ohne HP (Regelstudium Sekundarstufe I ohne Profil Heilpädagogik)"
                                  id="sekundarstufe1"
                                />
                                <Label htmlFor="sekundarstufe1">
                                  SR ohne HP (Regelstudium Sekundarstufe I ohne
                                  Profil Heilpädagogik)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="SR mit HP (Regelstudium Sekundarstufe I mit Profil Heilpädagogik)"
                                  id="regelstudium"
                                />
                                <Label htmlFor="regelstudium">
                                  SR mit HP (Regelstudium Sekundarstufe I mit
                                  Profil Heilpädagogik)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="SK oder SV (Studienprogramme für Personen mit Hochschulabschluss oder Berufserfahrung)"
                                  id="studienprogramme"
                                />
                                <Label htmlFor="studienprogramme">
                                  SK oder SV (Studienprogramme für Personen mit
                                  Hochschulabschluss oder Berufserfahrung)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="SL (Sekundarstufe-I-Studium für Personen mit Primarlehrdiplom)"
                                  id="primarlehrdiplom"
                                />
                                <Label htmlFor="primarlehrdiplom">
                                  SL (Sekundarstufe-I-Studium für Personen mit
                                  Primarlehrdiplom)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="SF (Facherweiterungsstudium für Personen mit Lehrdiplom Sekundarstufe)"
                                  id="facherweiterung"
                                />
                                <Label htmlFor="facherweiterung">
                                  SF (Facherweiterungsstudium für Personen mit
                                  Lehrdiplom Sekundarstufe)
                                </Label>
                              </div>
                            </>
                          )}
                        </RadioGroup>
                        {errors.studyProgram && (
                          <p className="text-sm text-red-500">
                            {errors.studyProgram.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Erfahrungen im Berufsfeld
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Teaching Experience */}
                    <div className="space-y-2">
                      <Label>
                        Waren Sie in den letzten 12 Monaten oder sind Sie
                        aktuell an einer Schule angestellt? Falls ja, in welcher
                        Funktion waren oder sind Sie tätig (z. B.
                        Klassenlehrperson, Speziallehrperson, Klassenassistenz,
                        Mittagstisch)?
                      </Label>
                      <RadioGroup
                        onValueChange={(value) => {
                          setValue('teachingExperience', value === 'true', {
                            shouldValidate: true,
                          });
                          if (value === 'false') {
                            setValue('teachingExperienceDetails', '');
                          }
                        }}
                        value={watch('teachingExperience')?.toString()}
                        disabled={isPending}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="no-teaching" />
                          <Label htmlFor="no-teaching">nein</Label>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="yes-teaching" />
                            <Label htmlFor="yes-teaching">ja</Label>
                          </div>
                          {hasTeachingExperience && (
                            <div className="ml-6">
                              <Textarea
                                {...register('teachingExperienceDetails')}
                                className="h-20"
                              />
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Other Cooperation Experience */}
                    <div className="space-y-2">
                      <Label>
                        Waren Sie in den letzten 12 Monaten oder sind Sie
                        aktuell in einem Verein und/oder Verband für eine Gruppe
                        von Kindern oder Jugendlichen verantwortlich? Falls ja,
                        in welchem Verein/Verband leiten oder trainieren Sie
                        eine Gruppe von Kindern/Jugendlichen (z. B. Sportverein,
                        Pfadi, Jungwacht Blauring etc.)?
                      </Label>
                      <RadioGroup
                        onValueChange={(value) => {
                          setValue('coopExperience', value === 'true', {
                            shouldValidate: true,
                          });
                          if (value === 'false') {
                            setValue('coopExperienceDetails', '');
                          }
                        }}
                        value={watch('coopExperience')?.toString()}
                        disabled={isPending}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="false" id="no-coop" />
                          <Label htmlFor="no-coop">nein</Label>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="yes-coop" />
                            <Label htmlFor="yes-coop">ja</Label>
                          </div>
                          {hasCoopExperience && (
                            <div className="ml-6">
                              <Textarea
                                {...register('coopExperienceDetails')}
                                className="h-20"
                              />
                            </div>
                          )}
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Cooperative Activities Usefulness Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Nützlichkeit bisher erlebter kooperativer Tätigkeiten
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <P>
                      Nachfolgend sind kooperative Tätigkeiten aufgeführt. Falls
                      Sie diese in Lehrveranstaltungen, Praktika oder in
                      Anstellungen an Schulen erlebt haben, schätzen Sie bitte
                      Folgendes ein: Wie nützlich waren diese kooperativen
                      Tätigkeiten für Sie, um das Lernen Ihrer Schüler:innen
                      bestmöglich zu unterstützen? Beziehen Sie sich bitte bei
                      der Beantwortung auf Ihre Erfahrungen der letzten 12
                      Monate.
                    </P>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-current!">
                            <TableHead className="w-1/3">Tätigkeit</TableHead>
                            {cooperativeLikertScale.map((value) => (
                              <TableHead
                                key={value}
                                className="text-center whitespace-nowrap px-1"
                              >
                                <div className="text-xs font-normal">
                                  {cooperativeLikertLabels[value]}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cooperativeActivitiesQuestions.map(
                            (question, index) => {
                              const middleIndex = Math.floor(
                                cooperativeActivitiesQuestions.length / 2
                              );
                              return (
                                <>
                                  {index === middleIndex && (
                                    <TableRow className="hover:bg-current!">
                                      <TableCell className="w-1/3 font-medium text-neutral-500">
                                        Tätigkeit
                                      </TableCell>
                                      {cooperativeLikertScale.map((value) => (
                                        <TableCell
                                          key={`${question.id}-header-${value}`}
                                          className="text-center whitespace-nowrap px-1 text-neutral-500"
                                        >
                                          <div className="text-xs font-normal">
                                            {cooperativeLikertLabels[value]}
                                          </div>
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  )}
                                  <TableRow
                                    key={question.id}
                                    className={`${
                                      index % 2 === 0 ? 'bg-gray-50' : ''
                                    } hover:bg-current!`}
                                  >
                                    <TableCell
                                      className="font-medium align-top"
                                      dangerouslySetInnerHTML={{
                                        __html: question.text,
                                      }}
                                    />
                                    {cooperativeLikertScale.map((value) => (
                                      <TableCell
                                        key={value}
                                        className="text-center p-2 align-center last:border-l"
                                      >
                                        <RadioGroup
                                          onValueChange={(v) => {
                                            setValue(
                                              question.id,
                                              v as QuestionnaireData[typeof question.id],
                                              {
                                                shouldValidate: true,
                                              }
                                            );
                                          }}
                                          value={watch(question.id)}
                                          disabled={isPending}
                                          className="flex justify-center"
                                          aria-label={`${question.text} - ${cooperativeLikertLabels[value]}`}
                                        >
                                          <div className="flex items-center">
                                            <RadioGroupItem
                                              value={value}
                                              id={`${question.id}-${value}`}
                                              className="h-4 w-4"
                                            />
                                          </div>
                                        </RadioGroup>
                                        {errors[question.id] &&
                                          value === '1' && (
                                            <p className="text-xs text-red-500 mt-1 text-center absolute bottom-0 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                              Bitte Auswahl treffen
                                            </p>
                                          )}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </>
                              );
                            }
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Add Presence in Network Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Präsenz im Netzwerk Hochschule
              </h2>
              <Card>
                <CardContent className="pt-6 space-y-8">
                  {/* Part 1: Praktikumschule */}
                  <div className="space-y-6">
                    <P>
                      Nachfolgende Aussagen beziehen sich auf Ihre Person.
                      Beantworten Sie die Aussagen mit Bezug auf Ihre
                      Tätigkeiten an Ihrer/Ihren Praktikumschule(n) in den
                      letzten 12 Monaten. Inwiefern treffen folgende Aussagen
                      auf Sie zu?
                    </P>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-current!">
                            <TableHead className="w-1/3">Aussage</TableHead>
                            {presenceLikertScale.map((value) => (
                              <TableHead
                                key={value}
                                className="text-center whitespace-nowrap px-1"
                              >
                                <div className="text-xs font-normal">
                                  {presenceLikertLabels[value]}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {presencePraktikumQuestions.map((question, index) => (
                            <TableRow
                              key={question.id}
                              className={`${
                                index % 2 === 0 ? 'bg-gray-50' : ''
                              } hover:bg-current!`}
                            >
                              <TableCell className="font-medium align-top">
                                {question.text}
                              </TableCell>
                              {presenceLikertScale.map((value) => (
                                <TableCell
                                  key={value}
                                  className="text-center p-2 align-center relative last:border-l"
                                >
                                  <RadioGroup
                                    onValueChange={(v) => {
                                      setValue(
                                        question.id,
                                        v as QuestionnaireData[typeof question.id],
                                        {
                                          shouldValidate: true,
                                        }
                                      );
                                    }}
                                    value={watch(question.id)}
                                    disabled={isPending}
                                    className="flex justify-center"
                                    aria-label={`${question.text} - ${presenceLikertLabels[value]}`}
                                  >
                                    <div className="flex items-center">
                                      <RadioGroupItem
                                        value={value}
                                        id={`${question.id}-${value}`}
                                        className="h-4 w-4"
                                      />
                                    </div>
                                  </RadioGroup>
                                  {errors[question.id] && value === '1' && (
                                    <p className="text-xs text-red-500 mt-1 text-center absolute bottom-0 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                      Bitte Auswahl treffen
                                    </p>
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Part 2: Hochschule (PH) */}
                  <div className="space-y-6">
                    <P>
                      Nun folgen dieselben Aussagen, die Sie nun auf ihr Studium
                      an der PH beziehen. Auch hier nehmen Sie bitte Bezug auf
                      die letzten 12 Monate. Inwiefern treffen folgende Aussagen
                      auf Sie zu?
                    </P>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-current!">
                            <TableHead className="w-1/3">Aussage</TableHead>
                            {presenceLikertScale.map((value) => (
                              <TableHead
                                key={value}
                                className="text-center whitespace-nowrap px-1"
                              >
                                <div className="text-xs font-normal">
                                  {presenceLikertLabels[value]}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {presenceHochschuleQuestions.map(
                            (question, index) => (
                              <TableRow
                                key={question.id}
                                className={`${
                                  index % 2 === 0 ? 'bg-gray-50' : ''
                                } hover:bg-current!`}
                              >
                                <TableCell className="font-medium align-top">
                                  {question.text}
                                </TableCell>
                                {presenceLikertScale.map((value) => (
                                  <TableCell
                                    key={value}
                                    className="text-center p-2 align-center relative last:border-l"
                                  >
                                    <RadioGroup
                                      onValueChange={(v) => {
                                        setValue(
                                          question.id,
                                          v as QuestionnaireData[typeof question.id],
                                          {
                                            shouldValidate: true,
                                          }
                                        );
                                      }}
                                      value={watch(question.id)}
                                      disabled={isPending}
                                      className="flex justify-center"
                                      aria-label={`${question.text} - ${presenceLikertLabels[value]}`}
                                    >
                                      <div className="flex items-center">
                                        <RadioGroupItem
                                          value={value}
                                          id={`${question.id}-${value}`}
                                          className="h-4 w-4"
                                        />
                                      </div>
                                    </RadioGroup>
                                    {errors[question.id] && value === '1' && (
                                      <p className="text-xs text-red-500 mt-1 text-center absolute bottom-0 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                        Bitte Auswahl treffen
                                      </p>
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={!isValid || isPending}>
                {isPending ? 'Wird gespeichert...' : 'Speichern und weiter'}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
