/**
 * Embedder - テキスト埋め込みベクトル生成
 * ベクトル検索・類似度計算用
 */

import OpenAI from "openai";

export interface EmbedResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  model?: string;
  dimensions?: number;
}

export interface BatchEmbedResult {
  success: boolean;
  embeddings?: number[][];
  error?: string;
  model?: string;
}

export type EmbedProvider = "openai" | "gemini";

/**
 * テキスト埋め込みベクトル生成器
 */
export class Embedder {
  private openai: OpenAI | null = null;
  private defaultProvider: EmbedProvider;

  constructor(defaultProvider: EmbedProvider = "openai") {
    this.defaultProvider = defaultProvider;
    this.initClients();
  }

  private initClients(): void {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  /**
   * 単一テキストの埋め込みベクトルを生成
   */
  async embed(text: string): Promise<EmbedResult> {
    return this.embedWith(this.defaultProvider, text);
  }

  /**
   * 複数テキストの埋め込みベクトルを一括生成
   */
  async embedBatch(texts: string[]): Promise<BatchEmbedResult> {
    return this.embedBatchWith(this.defaultProvider, texts);
  }

  /**
   * 指定プロバイダーで埋め込み生成
   */
  async embedWith(provider: EmbedProvider, text: string): Promise<EmbedResult> {
    switch (provider) {
      case "openai":
        return this.embedWithOpenAI(text);
      case "gemini":
        return this.embedWithGemini(text);
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  }

  /**
   * 指定プロバイダーでバッチ埋め込み生成
   */
  async embedBatchWith(
    provider: EmbedProvider,
    texts: string[]
  ): Promise<BatchEmbedResult> {
    switch (provider) {
      case "openai":
        return this.embedBatchWithOpenAI(texts);
      case "gemini":
        return this.embedBatchWithGemini(texts);
      default:
        return { success: false, error: `Unknown provider: ${provider}` };
    }
  }

  /**
   * OpenAI で埋め込み生成
   */
  private async embedWithOpenAI(text: string): Promise<EmbedResult> {
    if (!this.openai) {
      return { success: false, error: "OpenAI client not initialized" };
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return {
        success: true,
        embedding: response.data[0].embedding,
        model: "text-embedding-3-small",
        dimensions: response.data[0].embedding.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * OpenAI でバッチ埋め込み生成
   */
  private async embedBatchWithOpenAI(texts: string[]): Promise<BatchEmbedResult> {
    if (!this.openai) {
      return { success: false, error: "OpenAI client not initialized" };
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      return {
        success: true,
        embeddings: response.data.map((d) => d.embedding),
        model: "text-embedding-3-small",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gemini で埋め込み生成
   */
  private async embedWithGemini(text: string): Promise<EmbedResult> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Gemini API key not found" };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: { parts: [{ text }] },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const embedding = data.embedding?.values || [];

      return {
        success: true,
        embedding,
        model: "text-embedding-004",
        dimensions: embedding.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gemini でバッチ埋め込み生成
   */
  private async embedBatchWithGemini(texts: string[]): Promise<BatchEmbedResult> {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "Gemini API key not found" };
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            content: { parts: [{ text }] },
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      const embeddings = data.embeddings?.map((e: { values: number[] }) => e.values) || [];

      return {
        success: true,
        embeddings,
        model: "text-embedding-004",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * コサイン類似度を計算
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error("Vectors must have the same length");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 類似アイテムを検索（インメモリ）
   */
  static findSimilar(
    queryEmbedding: number[],
    items: Array<{ id: string; embedding: number[]; [key: string]: unknown }>,
    topK: number = 5
  ): Array<{ id: string; score: number; [key: string]: unknown }> {
    const scored = items.map((item) => ({
      ...item,
      score: Embedder.cosineSimilarity(queryEmbedding, item.embedding),
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, topK);
  }
}

export default Embedder;
