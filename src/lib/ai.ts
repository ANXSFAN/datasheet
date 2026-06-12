import "server-only";

import { adminErr } from "@/lib/admin-err";

// OpenRouter（OpenAI 兼容）聊天补全。模型走环境变量，便于按账号可用 slug 调整。
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** OpenRouter 多模态内容块：文本 + 文件（data URL，如 base64 PDF）。 */
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "file"; file: { filename: string; file_data: string } };

export type RichChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

/** 调 OpenRouter 并要求返回 JSON 对象；解析失败做一次大括号截取容错。 */
export async function openRouterJSON(messages: ChatMessage[]): Promise<unknown> {
  return openRouterJSONRich(messages);
}

/**
 * openRouterJSON 的多模态版：消息内容可带文件块（PDF 抽取用），
 * temperature 可调（抽取类任务用低值压创造性）。
 */
export async function openRouterJSONRich(
  messages: RichChatMessage[],
  opts?: { temperature?: number },
): Promise<unknown> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw await adminErr("aiNoKey");
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4.5";

  // 消息里带 PDF 时按 OPENROUTER_PDF_ENGINE 指定解析引擎：
  // 模型不原生支持文件输入（如 Qwen-VL）必须配；扫描/图片排版的 PDF 用
  // mistral-ocr（按页计费），纯文本 PDF 可用免费的 pdf-text。不配则保持原生。
  const hasFile = messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "file"),
  );
  const pdfEngine = process.env.OPENROUTER_PDF_ENGINE;

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Datasheet Showcase",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts?.temperature ?? 0.7,
      response_format: { type: "json_object" },
      ...(hasFile && pdfEngine
        ? { plugins: [{ id: "file-parser", pdf: { engine: pdfEngine } }] }
        : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw await adminErr("aiEmpty");
  return safeParseJSON(content);
}

async function safeParseJSON(text: string): Promise<unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s >= 0 && e > s) {
      try {
        return JSON.parse(text.slice(s, e + 1));
      } catch {
        /* fallthrough */
      }
    }
    throw await adminErr("aiBadJson");
  }
}
