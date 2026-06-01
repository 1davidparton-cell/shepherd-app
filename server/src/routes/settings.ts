import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { encrypt, decrypt } from '../lib/encryption';
import { prisma } from '../index';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const settings = await prisma.adminSettings.findUnique({ where: { userId: user.id } });
  res.json({
    aiProvider: settings?.aiProvider || 'anthropic',
    hasApiKey: !!settings?.encryptedApiKey,
    selectedModel: settings?.selectedModel || null,
  });
});

router.put('/', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const { aiProvider, apiKey, selectedModel } = req.body;

  const data: Record<string, string> = { aiProvider };
  if (selectedModel) data.selectedModel = selectedModel;
  if (apiKey) data.encryptedApiKey = encrypt(apiKey);

  const settings = await prisma.adminSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  res.json({
    aiProvider: settings.aiProvider,
    hasApiKey: !!settings.encryptedApiKey,
    selectedModel: settings.selectedModel,
  });
});

router.get('/reveal-key', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const settings = await prisma.adminSettings.findUnique({ where: { userId: user.id } });
  if (!settings?.encryptedApiKey) {
    res.status(404).json({ error: 'No API key stored' });
    return;
  }
  const key = decrypt(settings.encryptedApiKey);
  res.json({ apiKey: key });
});

router.post('/test-connection', requireAuth, async (req, res) => {
  const user = req.user as { id: string };
  const settings = await prisma.adminSettings.findUnique({ where: { userId: user.id } });
  if (!settings?.encryptedApiKey) {
    res.status(400).json({ error: 'No API key configured' });
    return;
  }

  try {
    const apiKey = decrypt(settings.encryptedApiKey);
    const provider = settings.aiProvider;

    if (provider === 'anthropic') {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic({ apiKey });
      await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
    } else if (provider === 'google') {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      await model.generateContent('ping');
    } else if (provider === 'openai') {
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey });
      await client.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      });
    }

    res.json({ success: true, provider });
  } catch (err) {
    res.status(400).json({ error: `Connection failed: ${(err as Error).message}` });
  }
});

export default router;
