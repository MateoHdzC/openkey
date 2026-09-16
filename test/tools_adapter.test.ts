import { describe, it, expect } from 'vitest';
import { UnifiedToolsAdapter } from '../src/gateway/tools_adapter.js';

describe('Unified Tools & Function Calling Adapter', () => {
  const sampleOpenAiTool = {
    type: 'function',
    function: {
      name: 'get_current_weather',
      description: 'Get current temperature and conditions',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  };

  const sampleAnthropicTool = {
    name: 'fetch_stock_price',
    description: 'Fetch real-time stock quote',
    input_schema: {
      type: 'object',
      properties: {
        ticker: { type: 'string' },
      },
      required: ['ticker'],
    },
  };

  it('should normalize OpenAI tools into unified ToolDefinition', () => {
    const unified = UnifiedToolsAdapter.toUnifiedTools([sampleOpenAiTool]);
    expect(unified).toHaveLength(1);
    expect(unified[0].name).toBe('get_current_weather');
    expect(unified[0].description).toBe('Get current temperature and conditions');
    expect(unified[0].parameters.properties).toHaveProperty('location');
    expect(unified[0].parameters.required).toEqual(['location']);
  });

  it('should normalize Anthropic tools into unified ToolDefinition', () => {
    const unified = UnifiedToolsAdapter.toUnifiedTools([sampleAnthropicTool]);
    expect(unified).toHaveLength(1);
    expect(unified[0].name).toBe('fetch_stock_price');
    expect(unified[0].parameters.properties).toHaveProperty('ticker');
    expect(unified[0].parameters.required).toEqual(['ticker']);
  });

  it('should export unified tools to OpenAI format', () => {
    const unified = UnifiedToolsAdapter.toUnifiedTools([sampleAnthropicTool]);
    const openAi = UnifiedToolsAdapter.toOpenAiFormat(unified);

    expect(openAi[0].type).toBe('function');
    expect(openAi[0].function.name).toBe('fetch_stock_price');
    expect(openAi[0].function.parameters?.properties).toHaveProperty('ticker');
  });

  it('should export unified tools to Anthropic format', () => {
    const unified = UnifiedToolsAdapter.toUnifiedTools([sampleOpenAiTool]);
    const anthropic = UnifiedToolsAdapter.toAnthropicFormat(unified);

    expect(anthropic[0].name).toBe('get_current_weather');
    expect(anthropic[0].input_schema.properties).toHaveProperty('location');
    expect(anthropic[0].input_schema.required).toEqual(['location']);
  });

  it('should export unified tools to Gemini format', () => {
    const unified = UnifiedToolsAdapter.toUnifiedTools([sampleOpenAiTool]);
    const gemini = UnifiedToolsAdapter.toGeminiFormat(unified);

    expect(gemini.function_declarations).toHaveLength(1);
    expect(gemini.function_declarations[0].name).toBe('get_current_weather');
    expect(gemini.function_declarations[0].parameters?.type).toBe('OBJECT');
  });

  it('should normalize tool calls from OpenAI responses', () => {
    const rawResponse = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_abc123',
                type: 'function',
                function: {
                  name: 'get_current_weather',
                  arguments: '{"location":"Montevideo"}',
                },
              },
            ],
          },
        },
      ],
    };

    const normalized = UnifiedToolsAdapter.normalizeToolCalls('openai', rawResponse);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].id).toBe('call_abc123');
    expect(normalized[0].name).toBe('get_current_weather');
    expect(normalized[0].arguments).toEqual({ location: 'Montevideo' });
  });

  it('should normalize tool calls from Anthropic responses', () => {
    const rawAnthropic = {
      content: [
        { type: 'text', text: 'Checking the weather...' },
        {
          type: 'tool_use',
          id: 'toolu_01A',
          name: 'get_current_weather',
          input: { location: 'Buenos Aires' },
        },
      ],
    };

    const normalized = UnifiedToolsAdapter.normalizeToolCalls('anthropic', rawAnthropic);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].id).toBe('toolu_01A');
    expect(normalized[0].name).toBe('get_current_weather');
    expect(normalized[0].arguments).toEqual({ location: 'Buenos Aires' });
  });

  it('should normalize tool calls from Gemini responses', () => {
    const rawGemini = {
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: 'get_current_weather',
                  args: { location: 'Tokyo' },
                },
              },
            ],
          },
        },
      ],
    };

    const normalized = UnifiedToolsAdapter.normalizeToolCalls('gemini', rawGemini);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].name).toBe('get_current_weather');
    expect(normalized[0].arguments).toEqual({ location: 'Tokyo' });
  });

  it('should format tool result message accurately', () => {
    const message = UnifiedToolsAdapter.formatToolResult('call_123', 'get_current_weather', {
      temp: 22,
      condition: 'Sunny',
    });
    expect(message.role).toBe('tool');
    expect(message.toolCallId).toBe('call_123');
    expect(message.name).toBe('get_current_weather');
    expect(JSON.parse(message.content as string)).toEqual({ temp: 22, condition: 'Sunny' });
  });
});
