interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface SendChatOptions {
    model: string;
    systemPrompt: string;
    messages: ChatMessage[];
}

interface StreamChatOptions extends SendChatOptions {
    onChunk: (chunk: string) => void;
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Send a chat message and get a complete response
 */
export async function sendChatMessage(options: SendChatOptions): Promise<string> {
    const { model, systemPrompt, messages } = options;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const requestMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'Chatbot Platform'
        },
        body: JSON.stringify({
            model,
            messages: requestMessages,
            max_tokens: 4096,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('OpenRouter API error:', error);
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json() as {
        choices: Array<{
            message: {
                content: string;
            };
        }>;
    };

    return data.choices[0]?.message?.content || 'No response generated';
}

/**
 * Stream a chat message response
 */
export async function streamChatMessage(options: StreamChatOptions): Promise<void> {
    const { model, systemPrompt, messages, onChunk } = options;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }

    const requestMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages
    ];

    const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
            'X-Title': 'Chatbot Platform'
        },
        body: JSON.stringify({
            model,
            messages: requestMessages,
            max_tokens: 4096,
            temperature: 0.7,
            stream: true
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('OpenRouter API error:', error);
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();

                if (data === '[DONE]') {
                    return;
                }

                try {
                    const parsed = JSON.parse(data) as {
                        choices: Array<{
                            delta: {
                                content?: string;
                            };
                        }>;
                    };

                    const content = parsed.choices[0]?.delta?.content;
                    if (content) {
                        onChunk(content);
                    }
                } catch {
                    // Skip invalid JSON
                }
            }
        }
    }
}

/**
 * Get available models from OpenRouter
 */
export async function getAvailableModels(): Promise<Array<{ id: string; name: string }>> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return [
            { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'openai/gpt-4', name: 'GPT-4' },
            { id: 'anthropic/claude-2', name: 'Claude 2' },
            { id: 'google/gemini-pro', name: 'Gemini Pro' }
        ];
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch models');
        }

        const data = await response.json() as {
            data: Array<{ id: string; name: string }>;
        };

        return data.data.slice(0, 20).map(m => ({
            id: m.id,
            name: m.name
        }));
    } catch {
        return [
            { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'openai/gpt-4', name: 'GPT-4' },
            { id: 'anthropic/claude-2', name: 'Claude 2' }
        ];
    }
}
