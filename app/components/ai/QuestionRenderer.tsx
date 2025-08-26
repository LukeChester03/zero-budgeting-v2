import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AIQuestion, AIPreferences } from '@/lib/types/ai';
import { DebtConfirmationQuestion } from './DebtConfirmationQuestion';
import { GoalsConfirmationQuestion } from './GoalsConfirmationQuestion';

interface QuestionRendererProps {
  question: AIQuestion;
  preferences: AIPreferences;
  updatePreference: (key: keyof AIPreferences, value: string | number | string[]) => void;
  onGenerateAnalysis?: () => void;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  preferences,
  updatePreference
}) => {
  const IconComponent = question.icon;

  switch (question.type) {
    case 'welcome':
      return (
        <div className="text-center space-y-6 py-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <IconComponent className="w-10 h-10 text-white" />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {question.title}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              {question.description}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-lg mx-auto mb-2" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Smart Allocation</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">AI-powered budget distribution</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="w-8 h-8 bg-green-600 rounded-lg mx-auto mb-2" />
              <h3 className="font-semibold text-green-900 dark:text-green-100">Goal Optimization</h3>
              <p className="text-sm text-green-700 dark:text-green-300">Prioritize what matters most</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="w-8 h-8 bg-purple-600 rounded-lg mx-auto mb-2" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Personalized Strategy</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">Tailored to your situation</p>
            </div>
          </div>
        </div>
      );

    case 'radio':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <RadioGroup
            value={preferences[question.id as keyof AIPreferences] as string}
            onValueChange={(value) => updatePreference(question.id as keyof AIPreferences, value)}
            className="space-y-4"
          >
            {question.options?.map((option) => {
              const OptionIcon = option.icon;
              return (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className="flex flex-col p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <OptionIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-gray-900 dark:text-white text-lg">
                          {option.label}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {option.description}
                        </div>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            {question.options?.map((option) => {
              const OptionIcon = option.icon;
              const currentValues = (preferences[question.id as keyof AIPreferences] as string[]) || [];
              const isChecked = currentValues.includes(option.value);
              
              return (
                <div key={option.value} className="relative">
                  <div className="flex items-start gap-4 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <OptionIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900 dark:text-white text-lg">
                        {option.label}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        {option.description}
                      </div>
                    </div>
                    <Checkbox
                      id={option.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Add to array
                          const newValues = [...currentValues, option.value];
                          updatePreference(question.id as keyof AIPreferences, newValues);
                        } else {
                          // Remove from array
                          const newValues = currentValues.filter(v => v !== option.value);
                          updatePreference(question.id as keyof AIPreferences, newValues);
                        }
                      }}
                      className="flex-shrink-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'slider':
      return (
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {preferences[question.id as keyof AIPreferences]}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {question.labels?.[Math.floor((preferences[question.id as keyof AIPreferences] as number - 1) / 3)] || 'Moderate'}
              </div>
            </div>
            
            <Slider
              value={[preferences[question.id as keyof AIPreferences] as number]}
              onValueChange={(value) => updatePreference(question.id as keyof AIPreferences, value[0])}
              min={question.min}
              max={question.max}
              step={question.step}
              className="w-full"
            />
            
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{question.labels?.[0]}</span>
              <span>{question.labels?.[1]}</span>
              <span>{question.labels?.[2]}</span>
            </div>
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <Input
              type="text"
              placeholder={question.placeholder}
              value={preferences[question.id as keyof AIPreferences] as string}
              onChange={(e) => updatePreference(question.id as keyof AIPreferences, e.target.value)}
              className="text-lg text-center py-6 border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {question.validation}
              </Badge>
            </div>
          </div>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <div className="space-y-4">
            <Input
              type="number"
              placeholder={question.placeholder}
              value={preferences[question.id as keyof AIPreferences] as number}
              onChange={(e) => updatePreference(question.id as keyof AIPreferences, parseInt(e.target.value) || 0)}
              min={question.min}
              max={question.max}
              step={question.step}
              className="text-lg text-center py-6 border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            />
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                {question.validation || `Range: ${question.min} - ${question.max}`}
              </Badge>
            </div>
          </div>
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <Textarea
            placeholder={question.placeholder}
            value={preferences[question.id as keyof AIPreferences] as string}
            onChange={(e) => updatePreference(question.id as keyof AIPreferences, e.target.value)}
            rows={question.rows || 4}
            className="text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 resize-none"
          />
        </div>
      );

    case 'redirect':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
            {question.required && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Required
              </Badge>
            )}
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
            <div className="text-center space-y-3">
              <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {question.redirectInfo?.title}
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                {question.redirectInfo?.description}
              </p>
            </div>
            
            <div className="flex justify-center">
              <a
                href={question.redirectInfo?.route}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
              >
                {question.redirectInfo?.buttonText}
              </a>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {question.redirectInfo?.returnMessage}
              </p>
            </div>
          </div>
        </div>
      );

    case 'debtConfirmation':
      return (
        <DebtConfirmationQuestion
          question={question}
          preferences={preferences}
          updatePreference={updatePreference}
        />
      );

    case 'goalsConfirmation':
      return (
        <GoalsConfirmationQuestion
          question={question}
          preferences={preferences}
          updatePreference={updatePreference}
        />
      );

    case 'summary':
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <IconComponent className="w-12 h-12 text-green-600 mx-auto" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {question.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              {question.description}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Your Responses Summary:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {Object.entries(preferences).map(([key, value]) => {
                if (value && value !== '' && value !== 0) {
                  return (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
          
          <div className="text-center pt-6">
            <button 
              onClick={onGenerateAnalysis}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
            >
              <IconComponent className="w-4 h-4 mr-2 inline" />
              Generate AI Analysis
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
};
