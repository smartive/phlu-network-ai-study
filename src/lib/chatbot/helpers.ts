import { createAzure } from '@ai-sdk/azure';
import { wrapLanguageModel } from 'ai';
import 'server-only';
import { loggingMiddleware } from './logging-middleware';
import { retryMiddleware } from './retryMiddleware';

const azureOpenAI = createAzure({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

export const getModel = (model: string, userId: string) => {
  let languageModel = azureOpenAI(model, {
    user: userId,
  });

  languageModel = wrapLanguageModel({
    model: languageModel,
    middleware: retryMiddleware,
  });

  if (process.env.ENABLE_LOGGING === 'true') {
    languageModel = wrapLanguageModel({
      model: languageModel,
      middleware: loggingMiddleware,
    });
  }

  return languageModel;
};
