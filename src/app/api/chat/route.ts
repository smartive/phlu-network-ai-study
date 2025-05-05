import { getModel } from '@/lib/chatbot/helpers';
import {
  CONVERSATION_SUMMARY_FOR_INTERVIEWER,
  NETWORK_MAP_FOR_INTERVIEWER,
  SYSTEM_PROMPT_INTERVIEWER,
  VALIDATION_RESULT_FOR_INTERVIEWER,
} from '@/lib/chatbot/interviewer';
import { SYSTEM_PROMPT_MODERATOR } from '@/lib/chatbot/moderator';
import { saveChat } from '@/lib/chatbot/persistence';
import { SYSTEM_PROMPT_SUMMARIZER } from '@/lib/chatbot/summarizer';
import { findOneByUserId, update } from '@/lib/db';
import { getSession } from '@/lib/session';
import { DBNetworkMap } from '@/types/db';
import { Person } from '@/types/network-map';
import {
  appendResponseMessages,
  generateText,
  Message,
  streamText,
  tool,
} from 'ai';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';

export const maxDuration = 30;

type Body = {
  messages: Message[];
  id: string;
};

const KEEP_LAST_N_MESSAGES = 7;
const TARGET_INTERVIEW_DURATION = 12 * 60 * 1000; // 12 minutes

export async function POST(req: Request) {
  const session = await getSession();
  const { messages, id } = (await req.json()) as Body;

  // Set chatStartTime in user session if it's the first message
  if (!session.user.chatStartTime && messages.length === 1) {
    session.user.chatStartTime = Date.now();
    await session.save();
  }

  const networkMapFromUser = unstable_cache(
    async (userId: string): Promise<Person[]> => {
      const map = await findOneByUserId<DBNetworkMap>('network_maps', userId);
      return map ? (map.map_data.people as Person[]) : [];
    },
    ['network-map'],
    {
      tags: [`network-map-${session.user.userId}`],
    }
  );

  const networkMap = await networkMapFromUser(session.user.userId);

  // Determine if the 12-minute interview duration has elapsed
  const isTimeUp = session.user.chatStartTime
    ? Date.now() - session.user.chatStartTime >= TARGET_INTERVIEW_DURATION
    : false;

  const shouldSummarize = messages.length >= KEEP_LAST_N_MESSAGES;
  const questionAnswerToValidate =
    messages.length >= 3 ? messages.slice(-2) : null;

  const [summary, validation] = await Promise.all([
    shouldSummarize
      ? summarizeConversation(
          messages.slice(0, messages.length - KEEP_LAST_N_MESSAGES),
          session.user.userId
        )
      : null,
    questionAnswerToValidate
      ? validateUserMessage(questionAnswerToValidate, session.user.userId)
      : null,
  ]);

  const result = streamText({
    model: getModel('gpt-4o', session.user.userId),
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT_INTERVIEWER,
      },
      networkMap.length > 0
        ? {
            role: 'system',
            content: NETWORK_MAP_FOR_INTERVIEWER(networkMap),
          }
        : null,
      summary
        ? {
            role: 'system',
            content: CONVERSATION_SUMMARY_FOR_INTERVIEWER(summary),
          }
        : null,
      validation
        ? {
            role: 'system',
            content: VALIDATION_RESULT_FOR_INTERVIEWER(validation),
          }
        : null,
      isTimeUp
        ? {
            role: 'system',
            content:
              'The twelve-minute interview time has elapsed. Use the `finishInterview` tool to politely conclude the interview and thank the student for their participation.',
          }
        : null,
      ...(shouldSummarize
        ? messages.slice(messages.length - KEEP_LAST_N_MESSAGES)
        : messages),
    ].filter((m): m is Message => !!m),
    maxSteps: 2, // this is needed to generate the goodbye message when the interview is finished through the tool call
    tools: {
      finishInterview: tool({
        description:
          'Finish the interview because the student has answered all questions, the interview has reached the maximum duration or the student has indicated that they want to end the interview.',
        parameters: z.object({
          reason: z.string(),
        }),
        execute: async ({ reason }) => {
          await update('users', session.user.userId, {
            finished_interview: true,
          });
          return `Finish the interview because ${reason}. Thank the student for their participation and interesting insights. Do not offer to ask any more questions. Instead instruct the student to click on the button that appeared on the screen to move to the next step.`;
        },
      }),
    },
    async onFinish({ response }) {
      if (session.user.group === 'chatbot') {
        await saveChat({
          id,
          messages: appendResponseMessages({
            messages,
            responseMessages: response.messages,
          }),
        });
      }
    },
  });

  return result.toDataStreamResponse();
}

async function summarizeConversation(messages: Message[], userId: string) {
  const result = await generateText({
    model: getModel('gpt-4o-mini', userId),
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT_SUMMARIZER,
      },
      {
        role: 'user',
        content: `
            Conversation so far:
            ${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}
            `,
      },
    ],
  });

  return result.text;
}

async function validateUserMessage(messages: Message[], userId: string) {
  try {
    const result = await generateText({
      model: getModel('gpt-4o-mini', userId),
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT_MODERATOR,
        },
        {
          role: 'user',
          content: `
            Question: ${messages[0]?.content}
            Answer from User: ${messages[1]?.content}
            `,
        },
      ],
    });

    // Check if the response was blocked by the content filter of the api
    if (result.finishReason === 'content-filter') {
      return `{"status": "INVALID", "reason": "POLICY_VIOLATION"}`;
    }

    return result.text;
  } catch (error: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((error as any)?.response?.status === 400) {
      return `{"status": "INVALID", "reason": "POLICY_VIOLATION"}`;
    }
    return `{"status": "INVALID", "reason": "GENERIC_ERROR"}`;
  }
}
