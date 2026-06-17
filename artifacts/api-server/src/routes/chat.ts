import { Router } from "express";
const router = Router();

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  system?: string;
  model?: string;
}

function isValidChatRequest(body: unknown): body is ChatRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || b.messages.length === 0) return false;
  for (const m of b.messages as unknown[]) {
    if (!m || typeof m !== "object") return false;
    const msg = m as Record<string, unknown>;
    if (!["user", "assistant", "system"].includes(msg.role as string)) return false;
    if (typeof msg.content !== "string") return false;
  }
  return true;
}

router.post("/", async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "OpenRouter API key not configured. Add OPENROUTER_API_KEY in Secrets." });
    return;
  }

  if (!isValidChatRequest(req.body)) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { messages, system, model = "meta-llama/llama-3.3-70b-instruct:free" } = req.body;

  const chatMessages: { role: string; content: string }[] = [];
  if (system) {
    chatMessages.push({ role: "system", content: system });
  }
  chatMessages.push(...messages);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://medibridge.global",
        "X-Title": "MediBridge Global",
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        stream: true,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      res.write(`data: ${JSON.stringify({ error: `OpenRouter error: ${response.status}` })}\n\n`);
      req.log.warn({ status: response.status, body: err }, "OpenRouter request failed");
      res.end();
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: "No response stream" })}\n\n`);
      res.end();
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6)) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    req.log.error({ err }, "Chat stream error");
    res.write(`data: ${JSON.stringify({ error: "Connection error. Please try again." })}\n\n`);
  } finally {
    res.end();
  }
});

export default router;
