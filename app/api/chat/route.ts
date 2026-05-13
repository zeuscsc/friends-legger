import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAssistantContentFromChatResponse } from '@/types';

type ChatMessage = {
  role: string;
  content: string;
};

type ChatRequestBody = {
  messages: ChatMessage[];
  isAuthenticated?: boolean;
  wasAuthDeclined?: boolean;
};

type UpstreamErrorPayload = {
  error?: string | { message?: string };
  message?: string;
};

const LITELLM_BASE_URL = process.env.LITELLM_BASE_URL ?? 'http://localhost:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY ?? 'asdf';
const parsedTimeoutMs = Number(process.env.LITELLM_TIMEOUT_MS ?? '30000');
const LITELLM_TIMEOUT_MS = Number.isFinite(parsedTimeoutMs) && parsedTimeoutMs > 0 ? parsedTimeoutMs : 30000;

function isValidChatRequestBody(data: unknown): data is ChatRequestBody {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Partial<ChatRequestBody>;
  if (!Array.isArray(candidate.messages)) {
    return false;
  }

  return candidate.messages.every(
    (message) =>
      !!message &&
      typeof message === 'object' &&
      typeof message.role === 'string' &&
      typeof message.content === 'string'
  );
}

export async function POST(req: Request) {
  try {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    if (!isValidChatRequestBody(payload)) {
      return NextResponse.json({ error: 'Invalid chat request payload' }, { status: 400 });
    }

    const { messages } = payload;
    const isAuthenticated = payload.isAuthenticated === true;
    const wasAuthDeclined = payload.wasAuthDeclined === true;
    
    let userData = '';
    let aiInsights = '';
    if (isAuthenticated) {
      try {
        const userPath = path.join(process.cwd(), 'data', 'mock-user.json');
        const insightsPath = path.join(process.cwd(), 'data', 'mock-ai-insights.json');

        const [userDataRaw, insightsDataRaw] = await Promise.all([
          fs.readFile(userPath, 'utf8'),
          fs.readFile(insightsPath, 'utf8'),
        ]);

        userData = userDataRaw;
        aiInsights = insightsDataRaw;
      } catch (fileError) {
        console.error('Chat API Error: failed to read authenticated data files', fileError);
        return NextResponse.json(
          { error: 'Failed to load user data for authenticated chat' },
          { status: 503 }
        );
      }
    }
    
    const systemPrompt = `You are a helpful banking assistant called Preplexity.

${isAuthenticated ? `Here is the user's financial data:
${userData}

Here are some AI-generated insights for the user:
${aiInsights}

Answer the user's questions based on this data. Be concise and professional.
Mention specific accounts, transactions, or saving opportunities if relevant.` : `You currently do NOT have access to the user's personal banking data.
${wasAuthDeclined ? `The user has explicitly declined to connect their HSBC account at this time. 
DO NOT respond with <require_auth />.
Instead, provide the best general banking advice possible based on the user's query, and mention that you could provide much more personalized insights if they choose to connect their account in the future.` : `If the user asks a general question NOT related to their personal finances, answer it to the best of your ability.
If the user asks for financial advice (e.g., "how to save money", "how can I save more", "budgeting tips") OR asks a question that requires personal banking information (e.g., "what is my balance", "list my transactions", "where did I spend my money"):
- You must FIRST politely ask the user if they would like to connect their HSBC account to get personalized insights based on their actual spending and AI-generated opportunities. Do NOT output <require_auth /> yet.
- If the user explicitly agrees to connect (e.g., "yes", "sure", "go ahead", "connect"), you MUST respond with exactly: <require_auth />
- If the user declines or says no, provide the best general advice you can.
Do NOT provide general saving or budgeting advice initially without offering the account connection first.`}`}

SPECIAL INSTRUCTION - EXPENSE SPLITTING (Only if authenticated):
${isAuthenticated ? `1. "SPLIT THIS" FLOW:
If the user mentions wanting to split a specific transaction (e.g. "split my dinner at Artisan Cafe with 4 people"), you must:
- Identify the matching transaction.
- Respond confirming you found it and will set it up.
- Append: <split_action>{"match": "DESCRIPTION", "peopleCount": N}</split_action>

2. "ORGANIZE PAYMENTS" FLOW:
If the user asks to "organize who has paid me" or similar:
- Analyze transactions for FPS or PayMe credits (isCredit: true, category: "Transfer"). These are reimbursements.
- List the people who have paid, the amount, and which original transaction (isCredit: false) they likely correspond to (by matching keywords in description or proximity in date).
- Ask: "Do you allow me to fill in the splits for you?"
- ONLY if the user then confirms (e.g. "yes", "go ahead"), you must append a hidden action tag with the derived splits:
  <organize_splits_action>[{"transactionId": "t123", "totalAmount": 400.0, "people": [{"id": "p1", "name": "Name", "amountOwed": 200.0, "hasPaid": true}]}]</organize_splits_action>
  (Ensure you include the person who paid in the people array with hasPaid: true).` : 'No personal data actions available.'}

If you don't know the answer or need more data, say so politely.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LITELLM_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${LITELLM_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LITELLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'flash',
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ error: 'AI service request timed out' }, { status: 504 });
      }

      console.error('LiteLLM network error:', error);
      return NextResponse.json({ error: 'Unable to reach AI service' }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorData = await response.text().catch(() => '');
      let upstreamMessage = '';
      if (errorData) {
        try {
          const parsed = JSON.parse(errorData) as UpstreamErrorPayload;
          if (typeof parsed.error === 'string') {
            upstreamMessage = parsed.error;
          } else if (parsed.error && typeof parsed.error.message === 'string') {
            upstreamMessage = parsed.error.message;
          } else if (typeof parsed.message === 'string') {
            upstreamMessage = parsed.message;
          }
        } catch {
          upstreamMessage = errorData;
        }
      }

      const baseError = `AI service returned ${response.status} ${response.statusText}`.trim();
      const compactUpstreamMessage = upstreamMessage.trim().replace(/\s+/g, ' ').slice(0, 240);
      const clientError = compactUpstreamMessage
        ? `${baseError}: ${compactUpstreamMessage}`
        : baseError;

      console.error('LiteLLM Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData,
      });
      return NextResponse.json(
        { error: clientError },
        { status: 502 }
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      console.error('LiteLLM Error: invalid JSON response', error);
      return NextResponse.json({ error: 'AI service returned invalid JSON' }, { status: 502 });
    }

    if (getAssistantContentFromChatResponse(data) === null) {
      console.error('LiteLLM Error: invalid response shape', data);
      return NextResponse.json({ error: 'Invalid response from LiteLLM' }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
