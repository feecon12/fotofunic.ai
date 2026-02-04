# Testing Checklist - Free Credits System

## Pre-Test Setup

- [ ] Clear localStorage: `localStorage.removeItem('fotofunic_free_credits')`
- [ ] Dev server running: `npm run dev` (http://localhost:3001)
- [ ] Not logged in (incognito or clear cookies)

## Test 1: Initial State

- [ ] Visit http://localhost:3001
- [ ] See hero section with "Get Started" and "Sign In" buttons
- [ ] See PublicImageGenerator component
- [ ] See green credit banner showing "Free Credits: 2 / 2"
- [ ] Configurations form should be visible and enabled
- [ ] No dialog shown

## Test 2: First Generation

- [ ] Fill in prompt and click "Generate Image"
- [ ] See loading state
- [ ] Generation completes
- [ ] Image appears in "Generated Images" section
- [ ] Credit banner updates to "Free Credits: 1 / 2"
- [ ] Configurations form still enabled

## Test 3: Second Generation

- [ ] Fill in prompt and click "Generate Image" again
- [ ] Generation completes
- [ ] Image appears in Generated Images
- [ ] Credit banner updates to "Free Credits: 0 / 2"
- [ ] Banner color might change (depends on styling)
- [ ] Configurations form still enabled

## Test 4: Credit Exhaustion

- [ ] Try to generate a 3rd image
- [ ] One of these should happen:
  - [ ] SignupPromptDialog appears immediately (before form is disabled)
  - OR
  - [ ] Form gets disabled, shows lock icon
- [ ] Credit banner shows "Free Credits: 0 / 2" in red
- [ ] Cannot edit form fields (disabled state)
- [ ] "Sign Up to Continue" button appears

## Test 5: Signup Prompt Dialog

- [ ] Click "Sign Up" button from dialog or exhausted state
- [ ] SignupPromptDialog pops up
- [ ] Dialog shows title: "Unlock Unlimited Generations"
- [ ] Dialog shows message about 2 free generations used
- [ ] Three buttons visible:
  - [ ] "Continue as Guest" (closes dialog)
  - [ ] "Sign In" (should redirect to /auth/login)
  - [ ] "Sign Up" (should redirect to /auth/signup)

## Test 6: Navigate to Auth

- [ ] Click "Sign Up" button
- [ ] Redirected to /auth/signup page
- [ ] Fill signup form and create account
- [ ] After login, should redirect to /dashboard

## Test 7: Logged-In User Flow

- [ ] Stay logged in
- [ ] Visit http://localhost:3001
- [ ] Should auto-redirect to /dashboard (not see public page)

## Test 8: Reset Credits (Local Testing)

- [ ] Open browser console (F12)
- [ ] Run: `localStorage.removeItem('fotofunic_free_credits')`
- [ ] Refresh page
- [ ] Credit banner should reset to "Free Credits: 2 / 2"

## Test 9: localStorage Persistence

- [ ] Generate 1 image
- [ ] Refresh the page (F5)
- [ ] Credit banner should still show "Free Credits: 1 / 2"
- [ ] localStorage persists across page reloads

## Test 10: Logout and Free Credits

- [ ] Logout from account
- [ ] Visit public page again
- [ ] Remaining credits should still be 0 (from previous tests)
- [ ] SignupPromptDialog should appear when trying to generate

## Expected Behaviors

### Credit Decrement

- ✅ Credits decrement AFTER successful generation
- ✅ Credits persist in localStorage
- ✅ Dialog shows when credits hit 0
- ✅ Dialog persists on page reload if credits are 0

### Auth Redirection

- ✅ /auth/signup redirects to signup page
- ✅ /auth/login redirects to login page
- ✅ Logged-in users can't see public page

### UI States

- ✅ Green banner when credits available
- ✅ Red/orange banner when exhausted
- ✅ Disabled form when exhausted
- ✅ Lock icon when exhausted
- ✅ Dialog accessibility (can close with ESC or cancel button)

## Troubleshooting

### Issue: Credits not decrementing

- Check browser console for errors
- Verify PublicConfigurations component renders
- Check that useCredit() is called in handleGenerationSuccess

### Issue: Dialog not appearing

- Verify showSignupPrompt state updates
- Check useEffect dependencies
- Ensure SignupPromptDialog is imported

### Issue: Wrong routes

- Verify /auth/signup exists
- Verify /auth/login exists
- Check router.push() in dialog component

### Issue: Credits reset between sessions

- Check browser localStorage access
- Try incognito mode to test fresh
- Clear site data and retry

## Performance Notes

- First load may be slower (initializing localStorage)
- Subsequent loads cached
- No API calls for credits (fully client-side)
- Dialog lazy-loaded with page
