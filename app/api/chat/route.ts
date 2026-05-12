import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Read mock user data
    const filePath = path.join(process.cwd(), 'data', 'mock-user.json');
    const userData = await fs.readFile(filePath, 'utf8');
    
    const systemPrompt = `You are a helpful banking assistant for Friend's Legger.
Here is the user's financial data:
${userData}

Answer the user's questions based on this data. Be concise and professional.
Mention specific accounts or transactions if relevant.

SPECIAL INSTRUCTION - EXPENSE SPLITTING:
1. "SPLIT THIS" FLOW:
If the user mentions wanting to split a specific transaction (e.g. "split my dinner at Artisan Cafe with 4 people"), you must:
- Identify the matching transaction.
- Respond confirming you found it and will set it up.
- Append: <split_action>{"match": "DESCRIPTION", "peopleCount": N}</split_action>

2. "ORGANIZE PAYMENTS" FLOW (New Requirement):
If the user asks to "organize who has paid me" or similar:
- Analyze transactions for FPS or PayMe credits (isCredit: true, category: "Transfer"). These are reimbursements.
- List the people who have paid, the amount, and which original transaction (isCredit: false) they likely correspond to (by matching keywords in description or proximity in date).
- Ask: "Do you allow me to fill in the splits for you?"
- ONLY if the user then confirms (e.g. "yes", "go ahead"), you must append a hidden action tag with the derived splits:
  <organize_splits_action>[{"transactionId": "t123", "totalAmount": 400.0, "people": [{"id": "p1", "name": "Name", "amountOwed": 200.0, "hasPaid": true}]}]</organize_splits_action>
  (Ensure you include the person who paid in the people array with hasPaid: true).

If you don't know the answer based on the data provided, say so politely.`;

    const response = await fetch('http://localhost:4000/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer asdf',
      },
      body: JSON.stringify({
        model: 'flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('LiteLLM Error:', errorData);
      return NextResponse.json({ error: 'Failed to fetch from LiteLLM' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
