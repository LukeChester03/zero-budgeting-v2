import { NextResponse } from "next/server";

interface Allocation {
  category: string;
  amount: number;
}

interface Budget {
  month: string;
  income: number;
  allocations: Allocation[];
}

interface Debt {
  id?: string;
  name: string;
  totalAmount: number;
  months: number;
  monthlyRepayment: number;
}

interface RequestBody {
  budgets: Budget[];
  debts: Debt[];
  income: number;
}

async function callGeminiApi(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY environment variable");

  const modelName = "models/gemini-2-turbo";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta2/${modelName}:generateText?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: {
          text: prompt,
        },
        temperature: 0.7,
        maxTokens: 500,
        candidateCount: 1,
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error: ${errorText}`);
  }

  const data = await res.json();

  // Return the AI-generated output string (expected JSON text)
  return data.candidates?.[0]?.output ?? "No analysis generated";
}

export async function POST(request: Request) {
  try {
    const { budgets, debts, income } = (await request.json()) as RequestBody;

    const prompt = `
You are a financial advisor AI. Analyze the user's budget data and debts.

Income: £${income.toFixed(2)} per month.

Budget allocations:
${budgets
  .map(
    (b) =>
      `Month: ${b.month}, Allocations:\n` +
      b.allocations.map((a) => ` - ${a.category}: £${a.amount.toFixed(2)}`).join("\n")
  )
  .join("\n\n")}

Debts:
${debts
  .map(
    (d) =>
      ` - ${d.name}: Total £${d.totalAmount.toFixed(2)} over ${
        d.months
      } months, monthly repayment £${d.monthlyRepayment.toFixed(2)}`
  )
  .join("\n")}

Please respond ONLY with a JSON object with the following structure:

{
  "summary": string,
  "warnings": string[],
  "advice": string[],
  "categoryAnalysis": {
    "<categoryName>": {
      "status": "over" | "under" | "balanced",
      "comment": string
    }
  }
}

Make sure the JSON is valid and nothing else is included in the response.
`;

    const analysis = await callGeminiApi(prompt);

    // Validate or parse JSON here if you want (optional)
    // We return the raw string to frontend to parse.

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze budget" },
      { status: 500 }
    );
  }
}
