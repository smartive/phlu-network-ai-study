import { DBChatLog } from '@/types/db';
import { Message } from 'ai';
import { findMany, findOneByUserId, insertMany } from '../db';

export const saveChat = async ({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}) => {
  const lastSavedMessage = await findOneByUserId<DBChatLog>(
    'chat_logs',
    id,
    {},
    'timestamp DESC'
  );

  const indexOfLastSavedMessage = messages.findIndex(
    (message) => message.content === lastSavedMessage?.message
  );

  await insertMany<DBChatLog>(
    'chat_logs',
    messages
      .slice(indexOfLastSavedMessage + 1)
      .filter(
        ({ id, content }) => id !== 'initial-trigger-message' && !!content
      )
      .map((message) => ({
        user_id: id,
        timestamp: message.createdAt,
        role: message.role,
        message: message.content,
      }))
  );
};

export const readChat = async ({ id }: { id: string }): Promise<Message[]> => {
  const chat = await findMany<DBChatLog>(
    'chat_logs',
    { user_id: id },
    'timestamp ASC'
  );

  return chat.map((message) => ({
    id: message.id.toString(),
    content: message.message,
    role: message.role,
    createdAt: message.timestamp,
  }));
};
