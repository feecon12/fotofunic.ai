# Free Credits System Implementation

## Overview

The app now includes a freemium model with 2 free image generations for public users, who are then prompted to sign up/login for unlimited access.

## Components

### 1. **Public Home Page** (`src/app/page.tsx`)

- Public landing page accessible without authentication
- Displays hero section with Fotofunic AI branding
- Shows "Sign In" and "Get Started" CTAs
- Auto-redirects logged-in users to `/dashboard`
- Renders the PublicImageGenerator component

### 2. **Free Credits Hook** (`src/hooks/use-free-credits.ts`)

- Manages credit state in localStorage (`fotofunic_free_credits`)
- **Exports:**
  - `creditsRemaining` (0-2): Remaining free generations
  - `isExhausted` (boolean): Whether all credits are used
  - `useCredit()` → returns remaining credits after decrement
  - `resetCredits()`: Resets to 2 credits (for testing)
  - `isLoading`: Initialization state

### 3. **Public Image Generator** (`src/components/public-image-generator.tsx`)

- Main component for public users
- **Features:**
  - Credit banner (green if credits remain, red if exhausted)
  - Generation form (Configurations) - disabled when exhausted
  - Lock UI when credits exhausted
  - Renders SignupPromptDialog when triggered
  - Auth check: Logged-in users redirected to `/dashboard`

### 4. **Public Configurations Wrapper** (`src/components/public-configurations.tsx`)

- Wraps the default Configurations component
- Intercepts `generateImage()` calls from Zustand store
- **On generation success:**
  - Calls `useCredit()` to decrement counter
  - Triggers `onGenerationSuccess` callback
  - After 2 generations, triggers signup prompt

### 5. **Signup Prompt Dialog** (`src/components/signup-prompt-dialog.tsx`)

- AlertDialog component shown when credits exhausted
- **Props:**
  - `isOpen` (boolean): Dialog visibility
  - `onOpenChange` (callback): Handle open/close
- **Buttons:**
  - "Sign In" → routes to `/auth/login`
  - "Sign Up" → routes to `/auth/signup`
  - "Continue as Guest" → closes dialog

## Flow

```
User visits / (public page)
    ↓
Check if logged in
├─ YES → Redirect to /dashboard
└─ NO → Show hero + PublicImageGenerator
    ↓
Click "Generate Image"
    ↓
Check free credits
├─ Credits > 0 → Allow generation
│   ↓
│   Generation completes
│   ↓
│   useCredit() decrements counter
│   ├─ Credits > 0 after → Continue
│   └─ Credits = 0 after → Show SignupPromptDialog
│
└─ Credits = 0 → Show SignupPromptDialog immediately
    ↓
SignupPromptDialog shows:
├─ "Sign In" → /auth/login
├─ "Sign Up" → /auth/signup
└─ "Continue as Guest" → Close dialog
```

## State Management

### localStorage Structure

```json
{
  "fotofunic_free_credits": {
    "creditsUsed": 0, // 0-2
    "timestamp": 1234567890 // Last update time
  }
}
```

### Derived States

- `creditsRemaining = 2 - creditsUsed`
- `isExhausted = creditsRemaining <= 0`

## Key Implementation Details

### Credit Tracking

1. On generation success in PublicConfigurations, `useCredit()` is called
2. Hook increments `creditsUsed` and persists to localStorage
3. `creditsRemaining` is automatically recalculated
4. When `creditsRemaining` reaches 0, `isExhausted` becomes true
5. PublicImageGenerator watches `creditsRemaining` and triggers dialog when it hits 0

### Dialog Triggers

1. **Before generation:** If `isExhausted` is already true, show dialog immediately
2. **After generation:** If `creditsRemaining` becomes 0, auto-trigger dialog
3. **Manual button click:** User clicks "Sign Up" button in exhausted state

### Auth Routing

- Signup page: `/auth/signup`
- Login page: `/auth/login`
- Dashboard (logged-in users): `/dashboard`

## Testing

### Test Scenario

```
1. Open http://localhost:3001 (not logged in)
2. See credit banner: "Free Credits: 2 / 2"
3. Click "Generate Image" → Generation 1 succeeds
4. Banner updates: "Free Credits: 1 / 2"
5. Click "Generate Image" → Generation 2 succeeds
6. Banner updates: "Free Credits: 0 / 2"
7. Click "Generate Image" or form still shows:
   → SignupPromptDialog pops up
8. Click "Sign Up" → Redirects to /auth/signup
9. Complete signup → Logged-in users go to /dashboard
```

### Reset for Testing

```javascript
// In browser console:
localStorage.removeItem("fotofunic_free_credits");
location.reload();
```

## Files Modified/Created

### Created

- ✅ `src/components/signup-prompt-dialog.tsx` - Signup/Login dialog
- ✅ `src/components/public-configurations.tsx` - Credit-tracking wrapper
- ✅ `src/hooks/use-free-credits.ts` - Credit state management
- ✅ `src/components/public-image-generator.tsx` - Public generator component
- ✅ `src/app/page.tsx` - Public home page

### Existing

- ✅ `src/store/useGeneratedStore.ts` - Zustand store for image generation
- ✅ `src/components/image-generation/Configurations.tsx` - Generation form
- ✅ `src/components/image-generation/GeneratedImages.tsx` - Display generated images
- ✅ `src/app/auth/signup/` - Signup page (existing)
- ✅ `src/app/auth/login/` - Login page (existing)

## Next Steps (Optional Enhancements)

1. **Track IP addresses** for generating by device instead of localStorage
2. **Email verification** for signup to prevent abuse
3. **Promo codes** to grant extra credits
4. **Analytics dashboard** tracking free credit usage
5. **Email reminder** when user has 1 credit left
6. **Social login** (Google, GitHub) for faster signup
7. **Pro plan analytics** showing credit usage over time
