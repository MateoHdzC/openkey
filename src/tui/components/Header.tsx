import React from 'react';
import { Box, Text } from 'ink';

export interface HeaderProps {
  version?: string;
  webUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({ version = '1.0.0' }) => {
  return (
    <Box
      flexDirection="row"
      justifyContent="space-between"
      paddingX={1}
      paddingY={0}
      marginBottom={1}
    >
      <Text bold color="white">
        OPENKEY
      </Text>
      <Text color="gray">v{version}</Text>
    </Box>
  );
};
