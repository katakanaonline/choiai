/**
 * Ollama API クライアント（ローカルLLM）
 * DeepSeek R1:8b を使用してコスト削減
 */

interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Ollamaが利用可能かチェック
 */
export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Ollamaでテキスト生成
 */
export async function generateWithOllama(
  prompt: string,
  maxTokens: number = 500
): Promise<string> {
  const body: OllamaRequest = {
    model: "deepseek-r1:8b",
    prompt,
    stream: false,
    options: {
      temperature: 0.3,
      num_predict: maxTokens,
    },
  };

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data: OllamaResponse = await response.json();
  return data.response.trim();
}
