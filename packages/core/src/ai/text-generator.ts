/**
 * TextGenerator - Claude/GPT/Gemini 共通インターフェース
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface GenerateResult {
  success: boolean;
  text?: string;
  error?: string;
  model?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export type AIProvider = "claude" | "openai" | "gemini";

/**
 * AIプロバイダー共通のテキスト生成インターフェース
 */
export class TextGenerator {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private defaultProvider: AIProvider;

  constructor(defaultProvider: AIProvider = "claude") {
    this.defaultProvider = defaultProvider;
    this.initClients();
  }

  private initClients(): void {
    // Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    // OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * テキスト生成（デフォルトプロバイダー使用）
   */
  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    return this.generateWith(this.defaultProvider, prompt, options);
  }

  /**
   * 指定プロバイダーでテキスト生成
   */
  async generateWith(
    provider: AIProvider,
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    switch (provider) {
      case "claude":
        return this.generateWithClaude(prompt, options);
      case "openai":
        return this.generateWithOpenAI(prompt, options);
      case "gemini":
        return this.generateWithGemini(prompt, options);
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  }

  /**
   * Claude で生成
   */
  private async generateWithClaude(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult> {
    if (!this.anthropic) {
      return { success: false, error: "Anthropic client not initialized" };
    }

    try {
      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: options.maxTokens || 4096,
        system: options.systemPrompt,
        messages: [{ role: "user", content: prompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      const text = textBlock && textBlock.type === "text" ? textBlock.text : "";

      return {
        success: true,
        text,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * OpenAI で生成
   */
  private async generateWithOpenAI(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult> {
    if (!this.openai) {
      return { success: false, error: "OpenAI client not initialized" };
    }

    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      if (options.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        messages,
      });

      return {
        success: true,
        text: response.choices[0]?.message?.content || "",
        model: response.model,
        usage: {
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gemini で生成（REST API経由）
   */
  private async generateWithGemini(
    prompt: string,
    options: GenerateOptions
  ): Promise<GenerateResult> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Gemini API key not found" };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const body = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        },
        systemInstruction: options.systemPrompt
          ? { parts: [{ text: options.systemPrompt }] }
          : undefined,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      return {
        success: true,
        text,
        model: "gemini-2.0-flash",
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount || 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * 複数プロバイダーで並列生成（比較用）
   */
  async generateMultiple(
    prompt: string,
    providers: AIProvider[] = ["claude", "openai"],
    options: GenerateOptions = {}
  ): Promise<Record<AIProvider, GenerateResult>> {
    const results = await Promise.all(
      providers.map(async (provider) => ({
        provider,
        result: await this.generateWith(provider, prompt, options),
      }))
    );

    return results.reduce(
      (acc, { provider, result }) => {
        acc[provider] = result;
        return acc;
      },
      {} as Record<AIProvider, GenerateResult>
    );
  }
}

export default TextGenerator;
