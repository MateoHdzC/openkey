import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { SystemDoctor, type DoctorCheckResult } from '../../core/doctor.js';

interface DoctorViewProps {
  onBack: () => void;
}

export const DoctorView: React.FC<DoctorViewProps> = ({ onBack }) => {
  const [results, setResults] = useState<DoctorCheckResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const doctor = new SystemDoctor();
      const res = await doctor.runAllChecks();
      if (isMounted) {
        setResults(res);
        setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useInput((input, key) => {
    if (key.escape || key.return) {
      onBack();
    }
  });

  const getMarker = (status: 'ok' | 'warn' | 'error') => {
    if (status === 'ok') return <Text color="green">✓ </Text>;
    if (status === 'warn') return <Text color="yellow">! </Text>;
    return <Text color="red">✗ </Text>;
  };

  return (
    <Box flexDirection="column" paddingX={1} marginY={1}>
      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
        <Text bold color="white">
          System Doctor
        </Text>
        <Text color="gray">[Esc] Return</Text>
      </Box>

      {loading ? (
        <Text color="gray">Diagnosing environment...</Text>
      ) : (
        <Box flexDirection="column" gap={0}>
          {results.map((r, i) => (
            <Box key={i} flexDirection="row" gap={1}>
              {getMarker(r.status)}
              <Text color="white">{r.name.padEnd(30)}</Text>
              <Text color={r.status === 'error' ? 'red' : r.status === 'warn' ? 'yellow' : 'gray'}>
                {r.message}
              </Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};
