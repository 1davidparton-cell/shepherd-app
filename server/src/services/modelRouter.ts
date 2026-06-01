import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { decrypt } from '../lib/encryption';
import { prisma } from '../index';

export type ModelTask =
  | 'personal_chat'
  | 'homework_builder'
  | 'homework_synthesis'
  | 'scripture_query';

const HAIKU = 'claude-haiku-4-5';

const ANTHROPIC_MODEL_MAP: Record<ModelTask, string> = {
  personal_chat:      HAIKU,
  homework_builder:   HAIKU,
  homework_synthesis: HAIKU,
  scripture_query:    HAIKU,
};

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface RouteResult {
  content: string;
}

async function getAdminKey(): Promise<{ provider: string; apiKey: string; selectedModel?: string | null }> {
  const settings = await prisma.adminSettings.findFirst();
  if (!settings || !settings.encryptedApiKey) {
    throw new Error('No AI provider API key configured. Please set one in Admin Settings.');
  }
  const apiKey = decrypt(settings.encryptedApiKey);
  return { provider: settings.aiProvider, apiKey, selectedModel: settings.selectedModel };
}

async function routeToAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });
  return (response.content[0] as { type: 'text'; text: string }).text;
}

async function routeToGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const gemini = genAI.getGenerativeModel({
    model: model || 'gemini-1.5-pro',
    systemInstruction: systemPrompt,
  });
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
  const chat = gemini.startChat({ history });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage?.content || '');
  return result.response.text();
}

async function routeToOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Message[],
): Promise<string> {
  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: model || 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
  });
  return response.choices[0]?.message?.content || '';
}

export async function route(
  task: ModelTask,
  systemPrompt: string,
  messages: Message[],
): Promise<RouteResult> {
  const { provider, apiKey, selectedModel } = await getAdminKey();

  let content: string;

  if (provider === 'anthropic') {
    const model = ANTHROPIC_MODEL_MAP[task];
    content = await routeToAnthropic(apiKey, model, systemPrompt, messages);
  } else if (provider === 'google') {
    content = await routeToGoogle(apiKey, selectedModel || 'gemini-1.5-pro', systemPrompt, messages);
  } else if (provider === 'openai') {
    content = await routeToOpenAI(apiKey, selectedModel || 'gpt-4o', systemPrompt, messages);
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }

  return { content };
}
