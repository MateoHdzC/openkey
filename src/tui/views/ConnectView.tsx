import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ProviderRegistry } from '../../providers/registry.js';
import { SecretVault } from '../../security/vault.js';
import { StorageDatabase } from '../../storage/db.js';
import { ConfigManager } from '../../core/config.js';
import { maskKey } from '../../core/sanitizer.js';

interface ConnectViewProps {
  onBack: () => void;
  onSuccess: (providerId: string, modelId?: string) => void;
}

export const ConnectView: React.FC<ConnectViewProps> = ({ onBack, onSuccess }) => {
  const [db] = useState(() => new StorageDatabase());
  const [configManager] = useState(() => new ConfigManager(db));
  const [vault] = useState(() => new SecretVault());
  const [registry] = useState(() => new ProviderRegistry(configManager, db, vault));

  const [step, setStep] = useState<'select_provider' | 'input_key' | 'input_custom_name' | 'input_custom_url' | 'input_custom_key' | 'verifying' | 'done'>('select_provider');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('openai');
  const [keyInput, setKeyInput] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customUrl, setCustomUrl] = useState<string>('https://api.openai.com/v1');
  const [customKey, setCustomKey] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);

  const providers = registry.listProviders();
  const providerItems = [
    ...providers.map((p) => {
      const secrets = db.getSecretsByProvider(p.id);
      const count = secrets.length;
      return {
        label: `${p.name.padEnd(20)} ${count > 0 ? `(${secrets[0].maskedKey})` : ''}`,
        value: p.id,
      };
    }),
    { label: '+ Another / Custom Endpoint', value: 'another' },
    { label: '← Back', value: 'back' },
  ];

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const handleProviderSelect = (item: { value: string }) => {
    if (item.value === 'back') {
      onBack();
      return;
    }

    if (item.value === 'another') {
      setStep('input_custom_name');
      return;
    }

    setSelectedProviderId(item.value);
    if (item.value === 'ollama') {
      configManager.setActiveModel('ollama', 'llama3.2');
      setStatusMessage('Connected (Ollama local)');
      setTimeout(() => onSuccess('ollama', 'llama3.2'), 800);
      return;
    }

    setStep('input_key');
  };

  const handleKeySubmit = async () => {
    if (!keyInput.trim()) {
      setIsError(true);
      setStatusMessage('API Key is required.');
      return;
    }

    setStep('verifying');
    setStatusMessage('Validating credentials...');
    setIsError(false);

    try {
      const encrypted = vault.encryptSecret(selectedProviderId, `${selectedProviderId}-default`, keyInput.trim());
      db.saveSecret(encrypted);

      const adapter = registry.getAdapter(selectedProviderId);
      const testResult = await adapter.validateCredentials({
        apiKey: keyInput.trim(),
        baseUrl: adapter.meta.defaultBaseUrl,
      });

      if (!testResult.valid) {
        setIsError(true);
        setStatusMessage(`Warning: ${testResult.error || 'Check credentials'}. Key saved.`);
      } else {
        setStatusMessage(`Connected · ${maskKey(keyInput)}`);
      }

      const models = await adapter.listModels({ apiKey: keyInput.trim() });
      const defaultModel = models[0]?.id || adapter.meta.defaultModels[0]?.id || 'default';
      configManager.setActiveModel(selectedProviderId, defaultModel, encrypted.id);

      setTimeout(() => {
        onSuccess(selectedProviderId, defaultModel);
      }, 1000);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Error: ${msg}`);
      setStep('input_key');
    }
  };

  const handleCustomSubmit = async () => {
    if (!customName.trim() || !customUrl.trim()) {
      setIsError(true);
      setStatusMessage('Name and Base URL are required.');
      return;
    }

    setStep('verifying');
    setStatusMessage('Saving custom provider...');
    setIsError(false);

    try {
      const customId = `custom_${customName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      configManager.addCustomProvider({
        id: customId,
        name: customName,
        baseUrl: customUrl,
        authType: 'bearer',
        models: ['default-model'],
      });

      if (customKey.trim()) {
        const encrypted = vault.encryptSecret(customId, `${customId}-key`, customKey.trim());
        db.saveSecret(encrypted);
        configManager.setActiveModel(customId, 'default-model', encrypted.id);
      } else {
        configManager.setActiveModel(customId, 'default-model');
      }

      setStatusMessage(`Connected · ${customName}`);
      setTimeout(() => {
        onSuccess(customId, 'default-model');
      }, 800);
    } catch (err: unknown) {
      setIsError(true);
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage(`Error: ${msg}`);
    }
  };

  return (
    <Box flexDirection="column" paddingX={1} marginY={1}>
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold color="white">
          Connect Provider
        </Text>
        <Text color="gray">[Esc] Cancel</Text>
      </Box>

      {step === 'select_provider' && (
        <Box flexDirection="column">
          <SelectInput items={providerItems} onSelect={handleProviderSelect} />
        </Box>
      )}

      {step === 'input_key' && (
        <Box flexDirection="column" gap={1}>
          <Text color="gray">API Key for {selectedProviderId.toUpperCase()}:</Text>
          <Box flexDirection="row">
            <Text color="white">{'> '}</Text>
            <TextInput
              value={keyInput}
              onChange={setKeyInput}
              onSubmit={handleKeySubmit}
              mask="•"
              placeholder="sk-..."
            />
          </Box>
        </Box>
      )}

      {step === 'input_custom_name' && (
        <Box flexDirection="column" gap={1}>
          <Text color="gray">Provider name:</Text>
          <Box flexDirection="row">
            <Text color="white">{'> '}</Text>
            <TextInput
              value={customName}
              onChange={setCustomName}
              onSubmit={() => setStep('input_custom_url')}
              placeholder="My AI Proxy"
            />
          </Box>
        </Box>
      )}

      {step === 'input_custom_url' && (
        <Box flexDirection="column" gap={1}>
          <Text color="gray">Base URL (/v1 endpoint):</Text>
          <Box flexDirection="row">
            <Text color="white">{'> '}</Text>
            <TextInput
              value={customUrl}
              onChange={setCustomUrl}
              onSubmit={() => setStep('input_custom_key')}
              placeholder="https://api.example.com/v1"
            />
          </Box>
        </Box>
      )}

      {step === 'input_custom_key' && (
        <Box flexDirection="column" gap={1}>
          <Text color="gray">API Key / Token (optional):</Text>
          <Box flexDirection="row">
            <Text color="white">{'> '}</Text>
            <TextInput
              value={customKey}
              onChange={setCustomKey}
              onSubmit={handleCustomSubmit}
              mask="•"
              placeholder="sk-... or Enter to skip"
            />
          </Box>
        </Box>
      )}

      {statusMessage && (
        <Box marginTop={1}>
          <Text color={isError ? 'red' : 'green'}>{statusMessage}</Text>
        </Box>
      )}
    </Box>
  );
};
