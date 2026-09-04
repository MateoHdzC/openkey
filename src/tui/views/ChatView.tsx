import React, { useState, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import type { ChatMessage } from '../../providers/adapter.interface.js';
import { OpenKeyAgent } from '../../core/agent.js';

interface MessageDisplay {
  role: 'user' | 'assistant' | 'tool';
  text: string;
  toolName?: string;
}

interface ChatViewProps {
  onCommand: (command: string) => void;
  onRefreshStatus?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onCommand, onRefreshStatus }) => {
  const [messages, setMessages] = useState<MessageDisplay[]>([]);
  const [input, setInput] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [streamedAssistantText, setStreamedAssistantText] = useState('');
  const [streamedReasoning, setStreamedReasoning] = useState('');
  const [activeToolInfo, setActiveToolInfo] = useState<string | null>(null);
  const [confirmPrompt, setConfirmPrompt] = useState<{
    prompt: string;
    resolve: (allowed: boolean) => void;
  } | null>(null);

  const agentRef = useRef<OpenKeyAgent | null>(null);
  if (!agentRef.current) {
    agentRef.current = new OpenKeyAgent();
  }

  const handleConfirmResponse = (allowed: boolean) => {
    if (confirmPrompt) {
      confirmPrompt.resolve(allowed);
      setConfirmPrompt(null);
    }
  };

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isBusy) return;

    setInput('');

    if (trimmed.startsWith('/')) {
      const [cmd] = trimmed.split(' ');
      if (cmd === '/clear') {
        setMessages([]);
        return;
      }
      onCommand(cmd);
      return;
    }

    if (confirmPrompt) {
      if (trimmed.toLowerCase() === 'y' || trimmed.toLowerCase() === 'yes') {
        handleConfirmResponse(true);
      } else {
        handleConfirmResponse(false);
      }
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setIsBusy(true);
    setStreamedAssistantText('');
    setStreamedReasoning('');
    setActiveToolInfo(null);

    const history: ChatMessage[] = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.text,
      }));

    try {
      const agent = agentRef.current!;
      let fullResponse = '';

      for await (const event of agent.run(trimmed, history, {
        onConfirmRequest: async (prompt) => {
          return new Promise<boolean>((resolve) => {
            setConfirmPrompt({ prompt, resolve });
          });
        },
      })) {
        if (event.type === 'token' && event.content) {
          fullResponse += event.content;
          setStreamedAssistantText(fullResponse);
        } else if (event.type === 'reasoning' && event.content) {
          setStreamedReasoning((r) => r + event.content);
        } else if (event.type === 'tool_start') {
          const detail = event.toolArgs?.path || event.toolArgs?.command || event.toolArgs?.query || '';
          setActiveToolInfo(`${event.toolName} ${detail ? `› ${detail}` : ''}`);
        } else if (event.type === 'tool_end') {
          setActiveToolInfo(null);
        } else if (event.type === 'error') {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `Error: ${event.error || 'Provider request failed'}` },
          ]);
        }
      }

      if (fullResponse) {
        setMessages((prev) => [...prev, { role: 'assistant', text: fullResponse }]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${msg}` }]);
    } finally {
      setIsBusy(false);
      setStreamedAssistantText('');
      setStreamedReasoning('');
      setActiveToolInfo(null);
      if (onRefreshStatus) onRefreshStatus();
    }
  };

  const divider = '─'.repeat(70);

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Text color="gray">{divider}</Text>
      <Box marginY={1} />

      {}
      <Box flexDirection="column" gap={1}>
        {messages.length === 0 && !isBusy && (
          <Box marginY={1}>
            <Text color="gray">Ready. Type a prompt to begin or /connect to manage keys.</Text>
          </Box>
        )}

        {messages.slice(-8).map((msg, idx) => (
          <Box key={idx} flexDirection="column" marginBottom={1}>
            {msg.role === 'user' && (
              <Box flexDirection="column">
                <Text color="gray" bold>
                  You
                </Text>
                <Text color="white">{msg.text}</Text>
              </Box>
            )}

            {msg.role === 'assistant' && (
              <Box flexDirection="column">
                <Text color="white" bold>
                  AI
                </Text>
                <Text color="white">{msg.text}</Text>
              </Box>
            )}
          </Box>
        ))}

        {}
        {isBusy && (
          <Box flexDirection="column" gap={1}>
            {streamedReasoning && (
              <Box flexDirection="row" gap={1}>
                <Text color="gray">Thinking ›</Text>
                <Text color="gray" italic>
                  {streamedReasoning.slice(-120)}
                </Text>
              </Box>
            )}

            {activeToolInfo && (
              <Box flexDirection="row" gap={1}>
                <Text color="gray">Running ›</Text>
                <Text color="yellow">{activeToolInfo}</Text>
              </Box>
            )}

            {streamedAssistantText && (
              <Box flexDirection="column">
                <Text color="white" bold>
                  AI
                </Text>
                <Text color="white">{streamedAssistantText}</Text>
              </Box>
            )}

            {!streamedAssistantText && !activeToolInfo && !streamedReasoning && (
              <Text color="gray">Connecting...</Text>
            )}
          </Box>
        )}

        {}
        {confirmPrompt && (
          <Box flexDirection="column" marginY={1}>
            <Text color="red" bold>
              Security confirmation
            </Text>
            <Text color="white">{confirmPrompt.prompt}</Text>
            <Text color="gray">[Y] Allow  [N] Deny</Text>
          </Box>
        )}
      </Box>

      <Box marginY={1} />
      <Text color="gray">{divider}</Text>

      {}
      <Box flexDirection="row" marginTop={1}>
        <Text color="white" bold>
          {'> '}
        </Text>
        <TextInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder={confirmPrompt ? 'Type Y or N...' : isBusy ? 'Generating...' : 'Type a message...'}
        />
      </Box>
    </Box>
  );
};
