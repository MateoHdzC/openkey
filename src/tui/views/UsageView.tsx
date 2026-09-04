import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { StorageDatabase } from '../../storage/db.js';

interface UsageViewProps {
  onBack: () => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ onBack }) => {
  const [db] = useState(() => new StorageDatabase());
  const summary = db.getUsageSummary();

  useInput((input, key) => {
    if (key.escape || key.return) {
      onBack();
    }
  });

  const formatTokens = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const divider = '─'.repeat(50);

  return (
    <Box flexDirection="column" paddingX={1} marginY={1}>
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold color="white">
          Usage
        </Text>
        <Text color="gray">[Esc] Return</Text>
      </Box>

      <Box marginY={1} flexDirection="column">
        <Text color="white" bold>
          {formatTokens(summary.totalTokens)} tokens
        </Text>
        <Text color="gray">
          {summary.totalRequests.toLocaleString()} requests · {formatTokens(summary.totalInputTokens)} in · {formatTokens(summary.totalOutputTokens)} out
        </Text>
      </Box>

      <Text color="gray">{divider}</Text>
      <Box marginY={1} />

      {summary.byProvider.length === 0 ? (
        <Text color="gray">No requests recorded.</Text>
      ) : (
        <Box flexDirection="column" gap={0}>
          {summary.byProvider.map((p) => (
            <Box key={p.providerId} flexDirection="row" justifyContent="space-between">
              <Text color="white">{p.providerId.toUpperCase().padEnd(16)}</Text>
              <Text color="gray">
                {p.requests} reqs   {formatTokens(p.totalTokens)}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
