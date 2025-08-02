"use client";

import React, { useState } from "react";
import { useBudgetStore } from "@/app/lib/store";

interface Analysis {
  summary: string;
  warnings: string[];
  advice: string[];
  categoryAnalysis: {
    [category: string]: {
      status: "over" | "under" | "balanced";
      comment: string;
    };
  };
}

export default function BudgetAnalysisPage() {
  const budgets = useBudgetStore((s) => s.budgets);
  const debts = useBudgetStore((s) => s.debts);
  const income = useBudgetStore((s) => s.income);

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/analysis-service", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ budgets, debts, income }),
      });

      if (!res.ok) throw new Error("Failed to fetch analysis");

      const data = await res.json();
      console.log(data);
      // Parse JSON string from AI response safely
      const parsed: Analysis = JSON.parse(data.analysis);

      setAnalysis(parsed);
    } catch (e: any) {
      setError("Error generating analysis");
      console.log(e.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-10">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Budget Analysis</h1>
      <p className="mb-6 text-center text-gray-700">
        Click the button below to analyze your current budget and debts using AI. Get personalized
        insights and recommendations.
      </p>
      <div className="flex justify-center mb-8">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze My Budget"}
        </button>
      </div>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {analysis && (
        <div className="prose max-w-none bg-gray-50 p-6 rounded shadow space-y-6">
          <section>
            <h2 className="text-xl font-semibold">Summary</h2>
            <p>{analysis.summary}</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">Warnings</h2>
            {analysis.warnings.length > 0 ? (
              <ul className="list-disc list-inside text-red-600">
                {analysis.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            ) : (
              <p>No warnings</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold">Advice</h2>
            {analysis.advice.length > 0 ? (
              <ul className="list-disc list-inside text-green-700">
                {analysis.advice.map((advice, i) => (
                  <li key={i}>{advice}</li>
                ))}
              </ul>
            ) : (
              <p>No advice</p>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold">Category Analysis</h2>
            <div className="space-y-3">
              {Object.entries(analysis.categoryAnalysis).map(([cat, val]) => (
                <div key={cat} className="p-3 border rounded">
                  <strong>{cat}</strong> — Status:{" "}
                  <span
                    className={
                      val.status === "over"
                        ? "text-red-600"
                        : val.status === "under"
                        ? "text-yellow-600"
                        : "text-green-600"
                    }
                  >
                    {val.status}
                  </span>
                  <p className="mt-1">{val.comment}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
