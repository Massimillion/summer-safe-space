

## Add Forgot Password for Admin Login

There is currently no forgot password functionality anywhere in the app. This plan adds a "Forgot password?" link that appears on both student and admin login views, plus a `/reset-password` page to handle the reset flow.

### Changes

**1. Update `src/pages/Login.tsx`**
- Add a "Forgot password?" button below the password field (before the Sign In button)
- Show it in both student and admin login modes
- On click, call `supabase.auth.resetPasswordForEmail(email)` with `redirectTo` pointing to `/reset-password`
- Show a toast confirming the reset email was sent (or error if email is empty)

**2. Create `src/pages/ResetPassword.tsx`**
- New page at `/reset-password`
- Detects the `type=recovery` token in the URL hash (Supabase appends this)
- Shows a form with new password + confirm password fields
- Calls `supabase.auth.updateUser({ password })` to set the new password
- On success, redirects to `/login` with a success toast

**3. Update `src/App.tsx`**
- Add route: `<Route path="/reset-password" element={<ResetPassword />} />`

### Design
- The "Forgot password?" link will be a small text button aligned right under the password field, styled as `text-xs text-muted-foreground hover:text-primary`
- The reset password page will use the same Card layout as the login page for visual consistency

