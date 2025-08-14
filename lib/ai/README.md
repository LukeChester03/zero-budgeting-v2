# AI Budgeting Assistant Architecture

This directory contains the refactored AI Budgeting Assistant with proper separation of concerns and best practices.

## Architecture Overview

The AI system is now organized into several layers:

### 1. Types (`../types/ai.ts`)
- **AIPreferences**: User questionnaire responses
- **AIAnalysisData**: Structured AI analysis output
- **StoredAIPreferences**: Database storage format
- **AIQuestion**: Question configuration
- **AIAnalysisRequest/Response**: API communication

### 2. Service Layer (`../services/ai-service.ts`)
- **AIService**: Handles all business logic and API calls
- **generateBudgetAnalysis()**: Creates Gemini prompts and parses responses
- **savePreferencesAndAnalysis()**: Manages Firestore operations
- **getExistingAnalysis()**: Retrieves user's previous analysis

### 3. State Management (`../store/ai-store.ts`)
- **useAIStore**: Zustand store for AI state management
- **preferences**: Current user questionnaire responses
- **aiAnalysis**: Raw AI response text
- **parsedAnalysis**: Structured analysis data
- **isLoading/error**: UI state management

### 4. Custom Hooks (`../../hooks/use-ai-budgeting.ts`)
- **useAIBudgeting**: Main hook for AI functionality
- **handleSavePreferences**: Orchestrates the save/analysis flow
- **navigation**: Step management and validation

### 5. UI Components
- **QuestionRenderer**: Renders different question types
- **AnalysisSummary**: Displays AI analysis results
- **AIBudgetingAssistantModal**: Main modal orchestrator

### 6. Data (`../data/ai-questions.ts`)
- **AI_QUESTIONS**: Centralized question configuration
- **Question types**: welcome, radio, slider, text, textarea

## Key Benefits of Refactoring

1. **Separation of Concerns**: Business logic is separated from UI
2. **Reusability**: Components can be used independently
3. **Testability**: Each layer can be tested in isolation
4. **Maintainability**: Clear structure makes updates easier
5. **Type Safety**: Full TypeScript coverage with proper interfaces
6. **Error Handling**: Centralized error management
7. **Performance**: Optimized state updates and API calls

## Usage Example

```typescript
import { useAIBudgeting } from '@/hooks/use-ai-budgeting';

function MyComponent() {
  const {
    preferences,
    updatePreference,
    handleSavePreferences,
    isLoading
  } = useAIBudgeting();

  // Use the AI functionality
}
```

## Data Flow

1. **User Input** → `updatePreference()` → Store
2. **Save** → `handleSavePreferences()` → Service → Gemini API
3. **Response** → Parse JSON → Store → UI Update
4. **Persistence** → Firestore storage for future use

## Error Handling

- **API Errors**: Caught and displayed to user
- **JSON Parsing**: Graceful fallback for malformed responses
- **Network Issues**: Retry mechanisms and user feedback
- **Validation**: Input validation before API calls

## Performance Optimizations

- **Single API Call**: Only one Gemini call per user
- **Caching**: Existing analysis is reused
- **Lazy Loading**: Components render only when needed
- **State Persistence**: Zustand persistence for better UX
