

## Fix Booking Flow for Returning Students

**Problem**: When a returning student tries to book again without being logged in, `supabase.auth.signUp()` fails with "User already registered" and the entire booking aborts.

### Changes

**1. Update `src/pages/Book.tsx` — `handleSubmit` function (lines 126-135)**

Replace the current sign-up-only logic with a sign-up-then-fallback-to-sign-in approach:

- Attempt `signUp` first
- If the error message contains "already registered", automatically attempt `signInWithPassword` using the same email and password
- If sign-in also fails (wrong password), show a helpful error: "An account with this email already exists. Please use the correct password or reset your password from the login page."
- On successful sign-in, proceed with the rest of the booking flow as normal

**2. Update Step 0 UI (lines 301-337)**

- Add a small note below the email field: "Already have an account? Use your existing password."
- Add a "Forgot password?" link that calls `resetPasswordForEmail` (reusing the same pattern from Login.tsx), so returning students who forgot their password can recover without leaving the booking page

### Technical detail

```text
signUp(email, password)
  ├─ success → continue booking
  └─ "User already registered"
       └─ signIn(email, password)
            ├─ success → continue booking
            └─ failure → show "wrong password / reset" error
```

No database or migration changes needed.

