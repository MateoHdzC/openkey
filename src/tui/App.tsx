import React, { useState, useEffect } from 'react';
import { Box, useApp } from 'ink';
import { Header } from './components/Header.js';
import { ModelBar } from './components/ModelBar.js';
import { ChatView } from './views/ChatView.js';
import { ConnectView } from './views/ConnectView.js';
import { ModelPickerView } from './views/ModelPickerView.js';
import { UsageView } from './views/UsageView.js';
import { DoctorView } from './views/DoctorView.js';
import { ConfigManager } from '../core/config.js';
import { StorageDatabase } from '../storage/db.js';
import path from 'node:path';

export type TuiViewMode = 'chat' | 'connect' | 'model' | 'usage' | 'doctor';

export const App: React.FC<{ initialMode?: TuiViewMode; webUrl?: string }> = ({
  initialMode = 'chat',
  webUrl = 'http://127.0.0.1:3000',
}) => {
  const { exit } = useApp();
  const [mode, setMode] = useState<TuiViewMode>(initialMode);
  const [db] = useState(() => new StorageDatabase());
  const [configManager] = useState(() => new ConfigManager(db));
  const [statusState, setStatusState] = useState(() => configManager.getActiveModelSelection());

  const refreshStatus = () => {
    setStatusState(configManager.getActiveModelSelection());
  };

  const secrets = db.getSecretsByProvider(statusState.providerId);
  const maskedKey = secrets[0]?.maskedKey;

  const handleCommand = (cmd: string) => {
    switch (cmd.toLowerCase()) {
      case '/connect':
        setMode('connect');
        break;
      case '/model':
      case '/models':
        setMode('model');
        break;
      case '/usage':
      case '/stats':
        setMode('usage');
        break;
      case '/doctor':
        setMode('doctor');
        break;
      case '/exit':
      case '/quit':
        exit();
        break;
      default:
        break;
    }
  };

  return (
    <Box flexDirection="column" width="100%" minHeight={15}>
      <Header version="1.0.0" />

      <Box flexGrow={1} marginY={0}>
        {mode === 'chat' && <ChatView onCommand={handleCommand} onRefreshStatus={refreshStatus} />}
        {mode === 'connect' && (
          <ConnectView
            onBack={() => {
              refreshStatus();
              setMode('chat');
            }}
            onSuccess={(p, m) => {
              refreshStatus();
              setMode('chat');
            }}
          />
        )}
        {mode === 'model' && (
          <ModelPickerView
            onBack={() => {
              refreshStatus();
              setMode('chat');
            }}
            onSelect={(p, m) => {
              refreshStatus();
              setMode('chat');
            }}
          />
        )}
        {mode === 'usage' && (
          <UsageView
            onBack={() => {
              refreshStatus();
              setMode('chat');
            }}
          />
        )}
        {mode === 'doctor' && (
          <DoctorView
            onBack={() => {
              refreshStatus();
              setMode('chat');
            }}
          />
        )}
      </Box>

      <ModelBar
        providerName={statusState.providerId.toUpperCase()}
        modelId={statusState.modelId}
      />
    </Box>
  );
};
