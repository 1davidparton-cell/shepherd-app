import { prisma } from '../index';
import { decrypt } from '../lib/encryption';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface AIService {
  complete(prompt: string): Promise<string>;
}

export async function getAIService(userId: string): Promise<AIService> {
  const settings = await prisma.adminSettings.findUnique({ where: { userId } });

  if (!settings?.encryptedApiKey) {
    throw new Error('No AI provider API key configured. Please set one in Settings.');
  }

  const apiKey = decrypt(settings.encryptedApiKey);
  const provider = settings.aiProvider;
  const model = settings.selectedModel;

  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey });
    return {
      async complete(prompt: string): Promise<string> {
        const response = await client.messages.create({
          model: model || 'claude-sonnet-4-5',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });
        return (response.content[0] as { type: 'text'; text: string }).text;
      },
    };
  }

  if (provider === 'google') {
    const genAI = new GoogleGenerativeAI(apiKey);
    const gemini = genAI.getGenerativeModel({ model: model || 'gemini-1.5-pro' });
    return {
      async complete(prompt: string): Promise<string> {
        const result = await gemini.generateContent(prompt);
        return result.response.text();
      },
    };
  }

  if (provider === 'openai') {
    const client = new OpenAI({ apiKey });
    return {
      async complete(prompt: string): Promise<string> {
        const response = await client.chat.completions.create({
          model: model || 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
        });
        return response.choices[0]?.message?.content || '';
      },
    };
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}
