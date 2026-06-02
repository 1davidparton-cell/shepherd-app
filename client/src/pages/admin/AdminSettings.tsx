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
  const [revealedKey, setRevealedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
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
    setSaved(false);
    try {
      const updated = await api.put<Settings>('/api/settings', {
        aiProvider: selectedProvider,
        apiKey: apiKey || undefined,
        selectedModel: selectedModel || undefined,
      });
      setSettings(updated);
      setApiKey('');
      setTestResult(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
    <>
      <div className="ad-head">
        <h1 className="ht">Settings</h1>
        <p className="hs">AI provider configuration</p>
      </div>

      <div className="ad-body">
        <form onSubmit={save} className="ad-form">

          <div className="fsec">
            <div className="fst">AI Provider</div>
            <div className="fsd">Choose the language model powering Shepherd's flock assistance.</div>

            <div className="seg">
              {PROVIDERS.map(p => (
                <div
                  key={p.value}
                  className={'opt' + (selectedProvider === p.value ? ' on' : '')}
                  onClick={() => { setSelectedProvider(p.value); setSelectedModel(''); }}
                >
                  {p.label}
                </div>
              ))}
            </div>

            {selectedProvider === 'anthropic' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--stone)', marginTop: 8 }}>
                Using <strong>Claude Haiku</strong> — Anthropic's fastest, most affordable model. Optimized for conversation.
              </p>
            )}
          </div>

          {needsModel && (
            <div className="fsec">
              <div className="fst">Model</div>
              <div className="fsd">Select the specific model variant to use.</div>
              <div className="field">
                <label>Model</label>
                <select
                  className="inp"
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                >
                  <option value="">Select model...</option>
                  {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="fsec">
            <div className="fst">API Key</div>
            <div className="fsd">
              Your API key is stored encrypted on the server.
              {settings?.hasApiKey && <span style={{ color: 'var(--col-success)', marginLeft: 8 }}>Key saved.</span>}
            </div>

            {settings?.hasApiKey && (
              <div className="field">
                <label>Current key</label>
                <div className="keyrow">
                  <input
                    className="inp"
                    style={{ fontFamily: 'monospace' }}
                    readOnly
                    value={revealedKey || '••••••••••••••••••••••••••••••••'}
                    type={revealedKey ? 'text' : 'password'}
                  />
                  <button type="button" className="reveal" onClick={revealKey}>
                    {revealedKey ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>
            )}

            <div className="field">
              <label>{settings?.hasApiKey ? 'Replace key' : 'API key'}</label>
              <input
                type="password"
                className="inp"
                style={{ fontFamily: 'monospace' }}
                placeholder={settings?.hasApiKey ? 'Enter new key to replace...' : 'Paste API key...'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          {testResult && (
            <div className="fsec">
              <div style={{
                fontSize: '0.875rem',
                padding: '10px 14px',
                borderRadius: 8,
                background: testResult.ok ? 'var(--col-success-bg, #f0fdf4)' : 'var(--col-error-bg, #fef2f2)',
                color: testResult.ok ? '#166534' : '#991b1b',
              }}>
                {testResult.message}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {settings?.hasApiKey && (
              <button
                type="button"
                className="btn-ghost"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {saved && (
              <div className="saved">
                <div className="gd" />
                Saved
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
