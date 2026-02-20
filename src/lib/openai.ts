/**
 * Lightweight OpenAI Chat Completions client using fetch (no SDK required).
 */

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export type OpenAIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenAIChatOptions = {
  model?: string;
  messages: OpenAIMessage[];
  max_tokens?: number;
  temperature?: number;
};

type OpenAIChatResponse = {
  choices: Array<{
    message: { role: string; content: string | null };
    finish_reason: string;
  }>;
};

/**
 * Calls the OpenAI Chat Completions API and returns the assistant's text.
 * Throws on HTTP errors or empty responses.
 */
export async function chatCompletion(
  apiKey: string,
  options: OpenAIChatOptions
): Promise<string> {
  const res = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model ?? "gpt-5-mini",
      messages: options.messages,
      max_completion_tokens: options.max_tokens,
      temperature: options.temperature,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as OpenAIChatResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";

  if (!text) {
    throw new Error("No text response from OpenAI");
  }

  return text;
}
