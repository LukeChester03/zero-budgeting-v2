# Firebase Setup Guide

This guide will help you set up Firebase for the Zero Budgeting application.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: "zero-budgeting"
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. **Enable Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"
3. **Enable Google OAuth**:
   - Click on "Google"
   - Toggle "Enable" to ON
   - Add a "Project support email" (your email)
   - Click "Save"
4. **Add Authorized Domains**:
   - Go to **Authentication** → **Settings** → **Authorized domains**
   - Add `localhost` (for development)
   - Add your production domain when ready

### 3. Create Firestore Database
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select a location (choose closest to your users)
4. Click **Done**

### 4. Set Up Security Rules
1. Go to **Firestore Database** → **Rules**
2. Replace the default rules with the content from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access all collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **Publish**

### 5. Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll down to **Your apps**
3. Click **Add app** → **Web**
4. Register app with name "Zero Budgeting Web"
5. Copy the config object
6. Update `lib/firebase.ts` with your config

## 📊 Database Structure

### Collections

#### `users`
- `uid`: string (Firebase Auth UID)
- `email`: string
- `displayName`: string (optional)
- `photoURL`: string (optional)
- `emailVerified`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `lastLoginAt`: timestamp
- `preferences`: object
  - `currency`: string (default: "GBP")
  - `timezone`: string (default: "Europe/London")
  - `notifications`: boolean (default: true)

#### `userStats`
- `uid`: string (Firebase Auth UID)
- `totalBudgets`: number
- `totalDebts`: number
- `totalGoals`: number
- `totalSavings`: number
- `lastBudgetDate`: timestamp (optional)

#### `budgets`
- `userId`: string (Firebase Auth UID)
- `name`: string
- `month`: number
- `year`: number
- `income`: number
- `allocations`: array
  - `category`: string
  - `amount`: number
- `isActive`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### `debts`
- `userId`: string (Firebase Auth UID)
- `name`: string
- `totalAmount`: number
- `months`: number
- `interestRate`: number
- `startDate`: string
- `debtType`: string
- `priority`: string
- `notes`: string (optional)
- `monthlyRepayment`: number
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### `goals`
- `userId`: string (Firebase Auth UID)
- `name`: string
- `targetAmount`: number
- `currentAmount`: number
- `deadline`: timestamp
- `category`: string
- `isActive`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

## 🔐 Security Features

### Authentication
- Email/password authentication
- Google OAuth integration
- Email verification
- Password reset functionality

### Data Security
- Users can only access their own data
- All collections require authentication
- User-specific data isolation
- Secure API endpoints

## 🚀 User Onboarding

When a new user signs up:

1. **Firebase Auth**: User account created
2. **User Profile**: Profile document created in `users` collection
3. **User Stats**: Stats document created in `userStats` collection
4. **Welcome Budget**: Sample budget created in `budgets` collection
5. **Sample Goal**: Emergency fund goal created in `goals` collection
6. **Email Verification**: Verification email sent

## 📱 Features

### Real-time Updates
- Live data synchronization
- Real-time budget updates
- Instant debt tracking
- Goal progress monitoring

### User Management
- Profile management
- Preference settings
- Account statistics
- Login history

### Data Persistence
- Local storage backup
- Offline capability
- Data recovery
- Cross-device sync

## 🛠️ Development

### Local Development
1. Use Firebase Emulator Suite for local development
2. Set up authentication emulator
3. Set up Firestore emulator
4. Configure local environment variables

### Testing
1. Test user registration flow
2. Test data creation and updates
3. Test real-time listeners
4. Test security rules

## 🔧 Troubleshooting

### Common Issues
1. **Authentication errors**: Check Firebase config and domain settings
2. **Permission denied**: Verify security rules are published
3. **Real-time updates not working**: Check listener setup
4. **Data not syncing**: Verify user authentication state
5. **"auth/operation-not-allowed"**: Enable authentication methods in Firebase Console
6. **"Missing or insufficient permissions"**: Update Firestore security rules

### Debug Steps
1. Check browser console for errors
2. Verify Firebase project settings
3. Test security rules in Firebase Console
4. Check network requests in DevTools
5. Ensure authentication methods are enabled
6. Verify domain is in authorized domains list

### Quick Fixes
- **For "auth/operation-not-allowed"**: Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password and Google
- **For "Missing or insufficient permissions"**: Update Firestore rules to allow document creation for new users
- **For Google OAuth errors**: Ensure Google provider is enabled and project support email is set

## 📈 Monitoring

### Firebase Analytics
- User engagement tracking
- Feature usage analytics
- Error monitoring
- Performance metrics

### Firestore Usage
- Monitor read/write operations
- Track storage usage
- Set up billing alerts
- Optimize queries

## 🔄 Migration

### From Local Storage
1. Export existing data
2. Create user accounts
3. Import data to Firestore
4. Verify data integrity
5. Update application to use Firebase

### Data Backup
1. Regular Firestore exports
2. User data backup
3. Configuration backups
4. Security rules versioning

---

For more information, see the [Firebase Documentation](https://firebase.google.com/docs). 