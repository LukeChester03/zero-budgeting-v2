'use client';

import React, { useState } from 'react';
import { useGemini } from '@/hooks/use-gemini';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Brain, MessageSquare, Trash2, AlertCircle } from 'lucide-react';

interface GeminiAIProps {
  className?: string;
}

export const GeminiAI: React.FC<GeminiAIProps> = ({ className = '' }) => {
  const {
    isLoading,
    lastResponse,
    error,
    conversationHistory,
    generateText,
    clearChat,
    clearError,
    hasConversation,
    userMessageCount,
    assistantMessageCount
  } = useGemini();

  const [prompt, setPrompt] = useState('');
  const [analysisType, setAnalysisType] = useState<'chat' | 'budget' | 'debt' | 'goal'>('chat');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    try {
      await generateText(prompt.trim());
      setPrompt('');
    } catch (error) {
      console.error('Error submitting prompt:', error);
    }
  };

  const handleQuickAnalysis = async (type: 'budget' | 'debt' | 'goal') => {
    setAnalysisType(type);
    const sampleData = getSampleData(type);
    try {
      // For now, just use the generic generateText function
      // In the future, this could be enhanced with specific AI analysis
      const prompt = `Analyze this ${type} data: ${JSON.stringify(sampleData, null, 2)}`;
      await generateText(prompt);
    } catch (error) {
      console.error('Error with quick analysis:', error);
    }
  };

  const getSampleData = (type: string) => {
    switch (type) {
      case 'budget':
        return {
          income: 5000,
          expenses: {
            housing: 1500,
            food: 500,
            transportation: 300,
            utilities: 200,
            entertainment: 200
          },
          savings: 1000
        };
      case 'debt':
        return {
          creditCard: { balance: 5000, interest: 18.99 },
          studentLoan: { balance: 25000, interest: 5.5 },
          carLoan: { balance: 15000, interest: 4.99 }
        };
      case 'goal':
        return {
          target: 10000,
          current: 2500,
          timeline: '12 months',
          monthlyContribution: 625
        };
      default:
        return {};
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Financial Assistant
          </CardTitle>
          <CardDescription>
            Get personalized insights and analysis for your financial data using Gemini AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Quick Analysis Buttons */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAnalysis('budget')}
              disabled={isLoading}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Analyze Budget
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAnalysis('debt')}
              disabled={isLoading}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Analyze Debt
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickAnalysis('goal')}
              disabled={isLoading}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Plan Goal
            </Button>
          </div>

          {/* Analysis Type Selector */}
          <div className="flex gap-2 mb-4">
            {(['chat', 'budget', 'debt', 'goal'] as const).map((type) => (
              <Button
                key={type}
                variant={analysisType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnalysisType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                {analysisType === 'chat' ? 'Ask me anything:' : `Describe your ${analysisType}:`}
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  analysisType === 'chat' 
                    ? "Ask me about personal finance, budgeting tips, or anything else..."
                    : `Describe your ${analysisType} situation...`
                }
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={!prompt.trim() || isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                {isLoading ? 'Analyzing...' : 'Send'}
              </Button>
              
              {hasConversation && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearChat}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2 text-red-600 hover:text-red-700"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Response Display */}
      {lastResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              AI Response
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {userMessageCount} messages
              </Badge>
              <Badge variant="outline">
                {assistantMessageCount} responses
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {lastResponse}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Conversation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {message.role === 'user' ? 'You' : 'AI Assistant'}
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
