import React from 'react';
import { Box, Text } from 'ink';

export interface ModelBarProps {
  providerName: string;
  modelId: string;
  isStreaming?: boolean;
}

export const ModelBar: React.FC<ModelBarProps> = ({ providerName, modelId, isStreaming }) => {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      marginTop={1}
    >
      <Box flexDirection="row" gap={1}>
        <Text color="white" bold>
          {modelId}
        </Text>
        <Text color="gray">·</Text>
        <Text color="gray">{providerName}</Text>
        {isStreaming && (
          <>
            <Text color="gray">·</Text>
            <Text color="cyan">Streaming...</Text>
          </>
        )}
      </Box>
      <Box flexDirection="row" gap={2}>
        <Text color="gray">/connect</Text>
        <Text color="gray">/model</Text>
        <Text color="gray">/usage</Text>
        <Text color="gray">/doctor</Text>
      </Box>
    </Box>
  );
};
