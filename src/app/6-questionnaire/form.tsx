'use client';

import { PageHeader } from '@/components/page-header';
import { P } from '@/components/typography';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { updateStep } from '../actions';
import { saveQuestionnaire } from './actions';

const likertScale = ['1', '2', '3', '4', '5', '6', '7'] as const;
type LikertValue = (typeof likertScale)[number];

const likertLabels: Record<LikertValue, string> = {
  '1': 'trifft überhaupt nicht zu',
  '2': 'trifft grösstenteils nicht zu',
  '3': 'trifft eher nicht zu',
  '4': 'trifft eher zu',
  '5': 'trifft grösstenteils zu',
  '6': 'trifft voll und ganz zu',
  '7': 'keine Antwort möglich',
};

const adaptionQuestions = [
  {
    id: 'Wirk_01',
    textHuman: 'Das Gespräch hat mir viel Spass gemacht.',
    textChatbot: 'Der Chat hat mir viel Spass gemacht.',
  },
  {
    id: 'Wirk_02',
    textHuman:
      'Im Gespräch habe ich etwas Neues über meinen Lerngelegenheiten erfahren.',
    textChatbot:
      'Im Chat habe ich etwas Neues über meinen Lerngelegenheiten erfahren.',
  },
  {
    id: 'Wirk_03',
    textHuman:
      'Im Gespräch habe ich etwas zu lernzentrierter Kooperation dazugelernt.',
    textChatbot:
      'Im Chat habe ich etwas zu lernzentrierter Kooperation dazugelernt.',
  },
  {
    id: 'Wirk_04',
    textHuman:
      'Im Gespräch konnte ich intensiv über meine Lerngelegenheiten nachdenken.',
    textChatbot:
      'Im Chat konnte ich intensiv über meine Lerngelegenheiten nachdenken.',
  },
  {
    id: 'Wirk_05',
    textHuman:
      'Das Gespräch hat mich darin unterstützt, meine Lerngelegenheiten zu reflektieren.',
    textChatbot:
      'Der Chat hat mich darin unterstützt, meine Lerngelegenheiten zu reflektieren.',
  },
  {
    id: 'Wirk_06',
    textHuman: 'Ich bin mit dem Gespräch sehr zufrieden.',
    textChatbot: 'Ich bin mit dem Chat sehr zufrieden.',
  },
] as const;

const questionnaireSchema = z.object({
  Wirk_01: z.enum(likertScale),
  Wirk_02: z.enum(likertScale),
  Wirk_03: z.enum(likertScale),
  Wirk_04: z.enum(likertScale),
  Wirk_05: z.enum(likertScale),
  Wirk_06: z.enum(likertScale),
  liked: z.string().min(1, 'Bitte füllen Sie dieses Feld aus'),
  disliked: z.string().min(1, 'Bitte füllen Sie dieses Feld aus'),
});

type QuestionnaireData = z.infer<typeof questionnaireSchema>;

export function QuestionnaireForm({ isHumanGroup }: { isHumanGroup: boolean }) {
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

  const onSubmit = async (data: QuestionnaireData) => {
    startTransition(async () => {
      try {
        await saveQuestionnaire(data);
        await updateStep(AppStep.THANK_YOU);
        router.push(AppStep.THANK_YOU);
      } catch (error) {
        console.error('Failed to save questionnaire:', error);
      }
    });
  };

  return (
    <>
      <PageHeader
        title="Abschlussfragebogen"
        timeEstimateInMinutes={5}
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
            Zum Abschluss möchten wir Sie bitten, einige Fragen zu Ihren
            Erfahrungen mit der Webapplikation zu beantworten.
          </P>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Adaption Questions Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Erfahrungen zum {isHumanGroup ? 'Gespräch' : 'Chatbot'}
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <P>Inwiefern stimmen Sie nachfolgenden Aussagen zu?</P>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-current!">
                            <TableHead className="w-1/3">Aussage</TableHead>
                            {likertScale.map((value) => (
                              <TableHead
                                key={value}
                                className="text-center px-1"
                              >
                                <div className="text-xs font-normal">
                                  {likertLabels[value]}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adaptionQuestions.map((question, index) => (
                            <TableRow
                              key={question.id}
                              className={`${
                                index % 2 === 0 ? 'bg-gray-50' : ''
                              } hover:bg-current!`}
                            >
                              <TableCell className="font-medium">
                                {isHumanGroup
                                  ? question.textHuman
                                  : question.textChatbot}
                              </TableCell>
                              {likertScale.map((value) => (
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
                                  >
                                    <div className="flex items-center">
                                      <RadioGroupItem
                                        value={value}
                                        id={`${question.id}-${value}`}
                                        className="h-4 w-4"
                                      />
                                    </div>
                                  </RadioGroup>
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="liked">
                        {isHumanGroup
                          ? 'Was hat Ihnen bei der Interaktion mit dem Gespräch mit Ihrer Mitstudentin/Ihrem Mitstudenten gefallen?'
                          : 'Was hat Ihnen bei der Interaktion mit dem Chat gefallen?'}
                      </Label>
                      <Textarea
                        id="liked"
                        {...register('liked')}
                        className="h-32"
                        disabled={isPending}
                      />
                      {errors.liked && (
                        <p className="text-sm text-red-500">
                          {errors.liked.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disliked">
                        {isHumanGroup
                          ? 'Was hat Ihnen bei der Interaktion mit dem Gespräch mit Ihrer Mitstudentin/Ihrem Mitstudenten nicht gefallen?'
                          : 'Was hat Ihnen bei der Interaktion mit dem Chat nicht gefallen?'}
                      </Label>
                      <Textarea
                        id="disliked"
                        {...register('disliked')}
                        className="h-32"
                        disabled={isPending}
                      />
                      {errors.disliked && (
                        <p className="text-sm text-red-500">
                          {errors.disliked.message}
                        </p>
                      )}
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
