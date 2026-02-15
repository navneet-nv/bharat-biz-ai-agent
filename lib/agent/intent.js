
import { OpenAI } from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.BHARATBIZ_LLM_KEY;

// Lazy initialization to prevent build-time crashes
export function getOpenAIClient() {
    if (!OPENAI_API_KEY) return null;
    return new OpenAI({
        apiKey: OPENAI_API_KEY,
    });
}

export async function classifyIntent(message, history = []) {
    const openai = getOpenAIClient();

    if (!openai) {
        console.warn("OPENAI_API_KEY is missing. Using fallback mock intent.");
        return mockIntent(message);
    }

    const systemPrompt = `
You are Bharat Biz-Agent, a smart AI copilot for Indian SMBs (Dukandaars). 
You understand "Desi" business context, Hinglish, and specific Indian business terms.

Your logic must handle these specific terms:
- "Udhaar", "Khata", "Baaki" -> Refers to Credit/Pending Payments.
- "Vasooli", "Payment le lo", "Clear kar do" -> Refers to Recording a Payment (Settling Udhaar).
- "Maal", "Stock", "Aaya hai" -> Refers to Inventory Restocking.
- "Kharcha", "Chai pani", "Petrol" -> Refers to Daily Expenses.
- "Kaccha bill", "Note kar lo" -> Quick entry (Invoice or Expense depending on context).

Supported Intents:
1. CREATE_INVOICE
   - Trigger: "Bill bana do", "Invoice for Rahul", "Raju ke naam 500 likho"
   - Params: { customer_name, amount, items: [{desc, quantity, price}] }
   - NeedsConfirmation: true

2. ADD_EXPENSE
   - Trigger: "Pehla boni 500", "Chai ka 20", "Market gaya tha 500 lag gaye"
   - Params: { item, amount, category }
   - NeedsConfirmation: false

3. SEND_REMINDER
   - Trigger: "Raju ko deadline yaad dilao", "Payment mangwao", "Vasooli remaining"
   - Params: { customer_name }
   - NeedsConfirmation: true

4. CHECK_STATS
   - Trigger: "Aaj ka galla?", "Kitna udhaar baki hai?", "Total sale batao"
   - Params: { metric: 'revenue' | 'udhaar' | 'expenses' }
   - NeedsConfirmation: false

5. UNKNOWN
   - If no business intent found.

Output Format: JSON only.
{
  "intent": "INTENT_NAME",
  "params": { ... },
  "needsConfirmation": boolean,
  "replyMessage": "A short, natural Hinglish response. Example: 'Thik hai, Raju ka bill bana raha hoon.' or 'Kharcha note kar liya.'"
}
`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Cost-effective model
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content);

    } catch (error) {
        console.error("Intent Classification Error:", error.message);
        console.warn("Falling back to Mock Intent due to API error.");

        // Fallback to MOCK if API fails (e.g. Quota Exceeded)
        return mockIntent(message);
    }
}

function mockIntent(message) {
    // Simple Keyword matching for fallback
    const lower = message.toLowerCase();

    if (lower.includes('bill') || lower.includes('invoice')) {
        return {
            intent: 'CREATE_INVOICE',
            params: { amount: 0, customer_name: 'Unknown' },
            needsConfirmation: true,
            replyMessage: 'Bill banana hai? Amount aur customer ka naam batayein.'
        };
    }

    if (lower.includes('kharcha') || lower.includes('expense') || lower.includes('bought') || lower.includes('liya')) {
        return {
            intent: 'ADD_EXPENSE',
            params: { item: 'Unknown', amount: 0 },
            needsConfirmation: false,
            replyMessage: 'Kharcha note kar liya.'
        };
    }

    return {
        intent: 'UNKNOWN',
        params: {},
        needsConfirmation: false,
        replyMessage: 'Samajh nahi aaya boss.'
    };
}
