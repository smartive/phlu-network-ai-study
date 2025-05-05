'use client';

import { MemoizedMarkdown } from '@/components/markdown';
import { NextStepButton } from '@/components/next-step-button';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Message, useChat } from 'ai/react';
import { SendHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

const INITIAL_MESSAGE_ID = 'initial-trigger-message';

export const ChatbotInterview = ({
  id,
  initialMessages,
  chatAlreadyFinished,
}: {
  id: string;
  initialMessages: Message[];
  chatAlreadyFinished: boolean;
}) => {
  const [interviewFinished, setInterviewFinished] =
    useState(chatAlreadyFinished);
  const {
    messages,
    append,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  } = useChat({
    id,
    initialMessages,
    api: '/api/chat',
    sendExtraMessageFields: true,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    // Append a hidden user message to trigger the bot's response
    if (messages.length === 0) {
      append({
        id: INITIAL_MESSAGE_ID,
        role: 'user',
        content:
          'Hallo, bitte stelle dich vor und starte das Interview mit mir.',
      });
    }
  }, [append]);

  // Get the last message that isn't the initial trigger
  const lastMessage = messages
    .filter((message) => message.id !== INITIAL_MESSAGE_ID)
    .slice(-1)[0];

  useEffect(() => {
    if (
      lastMessage?.toolInvocations?.some(
        (invocation) => invocation.toolName === 'finishInterview'
      )
    ) {
      setInterviewFinished(true);
    }
  }, [lastMessage]);

  return (
    <div className="flex flex-col w-full min-h-[600px] h-dvh max-h-[calc(100vh-120px)] max-w-2xl">
      <div className="flex-1 w-full h-full overflow-y-auto p-4 space-y-4">
        {messages
          .filter(
            (message) => message.id !== INITIAL_MESSAGE_ID && !!message.content
          )
          .map((message) => (
            <div
              key={message.id}
              className={cn(
                'w-fit max-w-[80%] rounded-xl px-4 py-2 text-left break-words shadow',
                message.role === 'user'
                  ? 'ml-auto bg-blue-100 rounded-br-none'
                  : 'mr-auto bg-gray-100 rounded-bl-none'
              )}
            >
              <MemoizedMarkdown content={message.content} id={message.id} />
            </div>
          ))}
        {isLoading &&
          (lastMessage?.role === 'user' ||
            (lastMessage?.toolInvocations?.length ?? 0) > 0) && (
            <div className="w-fit max-w-[80%] rounded-xl px-4 py-2 text-left mr-auto bg-gray-100 rounded-bl-none">
              <LoadingDots />
            </div>
          )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        {interviewFinished ? (
          <NextStepButton
            href="/6-questionnaire"
            label="Zum nächsten Schritt"
          />
        ) : (
          <form className="flex items-center gap-2" onSubmit={handleSubmit}>
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                // If the user presses enter, submit the form
                // If the user presses shift+enter, add a new line
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                  }
                }
              }}
              placeholder="Schreibe eine Nachricht..."
              className="flex-1"
              required
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              <SendHorizontal className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

const LoadingDots = () => (
  <div className="flex space-x-1.5 items-center">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.2}s` }}
      />
    ))}
  </div>
);
