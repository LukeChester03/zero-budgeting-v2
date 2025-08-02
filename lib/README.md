# Firebase Integration Setup

This project now includes Firebase integration with Zustand for state management. Here's how to use it:

## 🔥 Firebase Services Setup

### 1. Firebase Configuration (`lib/firebase.ts`)
- **Firestore**: Database for storing budgets, debts, and goals
- **Authentication**: User management with email/password
- **Analytics**: Usage tracking
- **Storage**: File storage (if needed)

### 2. Firestore Utilities (`lib/firestore.ts`)
- **CRUD Operations**: Create, read, update, delete documents
- **Real-time Listeners**: Subscribe to data changes
- **Batch Operations**: Multiple operations in one transaction
- **Query Support**: Filter and sort data

### 3. Firebase Store (`lib/store-firebase.ts`)
- **Zustand Integration**: Combines local state with Firebase
- **Real-time Sync**: Automatic data synchronization
- **User-specific Data**: All data is tied to authenticated users
- **Computed Values**: Pre-calculated totals and metrics

### 4. Authentication (`lib/auth-context.tsx`)
- **Auth Provider**: Manages user authentication state
- **Login/Signup**: Email/password authentication
- **Protected Routes**: Secure access to authenticated content

## 🚀 Usage Examples

### Using the Firebase Store

```typescript
import { useFirebaseStore } from "@/lib/store-firebase";

function MyComponent() {
  const { 
    budgets, 
    debts, 
    goals, 
    addBudget, 
    addDebt, 
    addGoal,
    getTotalSaved,
    getTotalMonthlyDebtRepayments 
  } = useFirebaseStore();

  // Add a new budget
  const handleAddBudget = async () => {
    await addBudget({
      month: "January 2024",
      income: 5000,
      allocations: [
        { category: "Housing", amount: 1500 },
        { category: "Food", amount: 500 },
        { category: "Savings", amount: 1000 }
      ]
    });
  };

  // Get computed values
  const totalSaved = getTotalSaved();
  const monthlyDebtPayments = getTotalMonthlyDebtRepayments();

  return (
    <div>
      <p>Total Saved: £{totalSaved}</p>
      <p>Monthly Debt Payments: £{monthlyDebtPayments}</p>
      <button onClick={handleAddBudget}>Add Budget</button>
    </div>
  );
}
```

### Using Authentication

```typescript
import { useAuth } from "@/lib/auth-context";

function LoginComponent() {
  const { signIn, signUp, user, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await signIn("user@example.com", "password");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div>
      {user ? (
        <button onClick={logout}>Logout</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### Protected Routes

```typescript
import ProtectedRoute from "@/app/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

## 📊 Data Structure

### Budget
```typescript
interface Budget {
  id: string;
  userId: string;
  month: string;
  income: number;
  allocations: Allocation[];
  createdAt?: any;
  updatedAt?: any;
}
```

### Debt
```typescript
interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  months: number;
  interestRate: number;
  startDate: string;
  debtType: string;
  priority: string;
  notes?: string;
  monthlyRepayment: number;
  createdAt?: any;
  updatedAt?: any;
}
```

### Goal
```typescript
interface Goal {
  id: string;
  userId: string;
  title: string;
  target: number;
  saved: number;
  iconKey: string;
  createdAt?: any;
  updatedAt?: any;
}
```

## 🔧 Migration from Local Store

To migrate existing components from the local Zustand store to Firebase:

1. **Replace imports**:
   ```typescript
   // Old
   import { useBudgetStore } from "@/lib/store";
   
   // New
   import { useFirebaseStore } from "@/lib/store-firebase";
   ```

2. **Update store usage**:
   ```typescript
   // Old
   const { budgets, addBudget } = useBudgetStore();
   
   // New
   const { budgets, addBudget } = useFirebaseStore();
   ```

3. **Add authentication**:
   ```typescript
   import { useAuth } from "@/lib/auth-context";
   const { user } = useAuth();
   ```

## 🔒 Security Rules

Make sure to set up Firestore security rules to protect user data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

## 📱 Next Steps

1. **Update Components**: Replace local store usage with Firebase store
2. **Add Authentication**: Wrap pages with `ProtectedRoute`
3. **Test Real-time Sync**: Verify data updates across devices
4. **Add Error Handling**: Handle network and authentication errors
5. **Optimize Performance**: Implement pagination for large datasets 