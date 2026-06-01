import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

interface Settings {
  aiProvider: string;
  hasApiKey: boolean;
  selectedModel: string | null;
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'google', label: 'Google Gemini' },
  { value: 'openai', label: 'OpenAI' },
];

const GOOGLE_MODELS = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.0-flash-exp'];
const OPENAI_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('anthropic');
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    api.get<Settings>('/api/settings').then(s => {
      setSettings(s);
      setSelectedProvider(s.aiProvider);
      setSelectedModel(s.selectedModel || '');
    }).catch(console.error);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.put<Settings>('/api/settings', {
        aiProvider: selectedProvider,
        apiKey: apiKey || undefined,
        selectedModel: selectedModel || undefined,
      });
      setSettings(updated);
      setApiKey('');
      setTestResult(null);
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await api.post('/api/settings/test-connection', {});
      setTestResult({ ok: true, message: 'Connection successful' });
    } catch (err) {
      setTestResult({ ok: false, message: (err as Error).message });
    } finally {
      setTesting(false);
    }
  };

  const revealKey = async () => {
    if (revealedKey) {
      setRevealedKey('');
      return;
    }
    try {
      const { apiKey: key } = await api.get<{ apiKey: string }>('/api/settings/reveal-key');
      setRevealedKey(key);
    } catch (err) {
      console.error(err);
    }
  };

  const needsModel = selectedProvider !== 'anthropic';
  const modelOptions = selectedProvider === 'google' ? GOOGLE_MODELS : OPENAI_MODELS;

  return (
    <div className="p-8 max-w-xl">
      <h2 className="text-2xl font-serif text-gray-900 mb-1">Settings</h2>
      <p className="text-gray-500 text-sm mb-8">AI provider configuration</p>

      <form onSubmit={save} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">AI Provider</label>
          <select
            value={selectedProvider}
            onChange={e => { setSelectedProvider(e.target.value); setSelectedModel(''); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          {selectedProvider === 'anthropic' && (
            <p className="text-xs text-gray-400 mt-1.5">Models are assigned automatically per task type.</p>
          )}
        </div>

        {needsModel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select model...</option>
              {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            API Key
            {settings?.hasApiKey && <span className="ml-2 text-xs text-green-600 font-normal">Key saved</span>}
          </label>

          {settings?.hasApiKey && (
            <div className="flex gap-2 mb-2">
              <div className="flex-1 font-mono text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 truncate">
                {revealedKey || '••••••••••••••••••••••••••••••••'}
              </div>
              <button type="button" onClick={revealKey} className="text-xs text-shepherd-navy border border-gray-200 rounded-lg px-3 hover:bg-gray-50">
                {revealedKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
          )}

          <input
            type="password"
            placeholder={settings?.hasApiKey ? 'Enter new key to replace...' : 'Paste API key...'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono"
            autoComplete="off"
          />
        </div>

        {testResult && (
          <div className={`text-sm rounded-lg px-3 py-2 ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {testResult.message}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {settings?.hasApiKey && (
            <button
              type="button"
              onClick={testConnection}
              disabled={testing}
              className="border border-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="bg-shepherd-navy text-white rounded-lg px-4 py-2 text-sm hover:bg-shepherd-navy-light disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
