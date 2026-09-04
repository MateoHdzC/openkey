import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import { ProviderRegistry } from '../../providers/registry.js';
import { ConfigManager } from '../../core/config.js';
import { StorageDatabase } from '../../storage/db.js';
import type { ModelInfo } from '../../providers/adapter.interface.js';

interface ModelPickerProps {
  onBack: () => void;
  onSelect: (providerId: string, modelId: string) => void;
}

export const ModelPickerView: React.FC<ModelPickerProps> = ({ onBack, onSelect }) => {
  const [db] = useState(() => new StorageDatabase());
  const [configManager] = useState(() => new ConfigManager(db));
  const [registry] = useState(() => new ProviderRegistry(configManager, db));
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');

  const active = configManager.getActiveModelSelection();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const discovered = await registry.discoverModels(active.providerId);
        if (isMounted) {
          setModels(discovered);
          setLoading(false);
        }
      } catch {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [active.providerId]);

  useInput((input, key) => {
    if (key.escape) {
      if (isCustomMode) {
        setIsCustomMode(false);
      } else {
        onBack();
      }
    }
  });

  const modelItems = [
    ...models.map((m) => ({
      label: `${m.id === active.modelId ? '● ' : '○ '} ${m.name} ${
        m.capabilities.reasoning ? '[Reasoning]' : m.capabilities.vision ? '[Vision]' : ''
      }`,
      value: m.id,
    })),
    { label: '+ Enter Custom / New Model ID', value: '__custom__' },
    { label: '← Back to Chat', value: '__back__' },
  ];

  const handleSelect = (item: { value: string }) => {
    if (item.value === '__back__') {
      onBack();
      return;
    }
    if (item.value === '__custom__') {
      setIsCustomMode(true);
      return;
    }
    configManager.setActiveModel(active.providerId, item.value);
    onSelect(active.providerId, item.value);
  };

  const handleCustomSubmit = () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) return;
    configManager.setActiveModel(active.providerId, trimmed);
    onSelect(active.providerId, trimmed);
  };

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Text bold color="green">
        🧠 Select Model for {active.providerId.toUpperCase()}
      </Text>
      <Text color="gray">Manual selection only • Press [Esc] to cancel</Text>
      <Box marginY={1} />

      {isCustomMode ? (
        <Box flexDirection="column" gap={1}>
          <Text color="cyan">Enter exact model ID for {active.providerId.toUpperCase()}:</Text>
          <Box borderStyle="single" borderColor="gray" paddingX={1}>
            <TextInput
              value={customModelInput}
              onChange={setCustomModelInput}
              onSubmit={handleCustomSubmit}
              placeholder="e.g. deepseek-v3, claude-3-opus, gpt-4.5-preview..."
            />
          </Box>
          <Text color="gray">Press [Enter] to activate model • [Esc] to return to list</Text>
        </Box>
      ) : loading ? (
        <Text color="yellow">Discovering models from provider API...</Text>
      ) : (
        <SelectInput items={modelItems} onSelect={handleSelect} />
      )}
    </Box>
  );
};
