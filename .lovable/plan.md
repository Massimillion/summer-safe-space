

# Admin Login on the Login Page

## How It Works

There's no need for a separate admin signup -- that would be a security risk. Instead, admins are created manually by you (the owner) in the database, and they log in through the same login page as students. The system automatically detects if someone is an admin and sends them to the right place.

## What Changes

### 1. Update the Login Page
After a successful login, the page will check if the user has the "admin" role. If they do, they get redirected to `/admin`. If not, they go to `/portal` as usual.

A small "Admin? Sign in here" toggle or link will be added below the student login, which simply changes the description text and redirect behavior -- keeping the page clean while making it clear admins can log in there too.

### 2. Fix the Logo (Bonus)
The login page still has the old squirrel emoji instead of the new SquirrelBox logo -- this will be updated to match the rest of the site.

### 3. How to Create Admin Accounts (Secure Process)

To add Luke (or anyone) as an admin:

1. **They sign up** on the site like a normal user (or you create their account)
2. **You tell me their email**, and I run a database command to assign them the "admin" role

This keeps it secure because:
- There is no public admin signup -- only you can grant admin access
- The role is stored in a separate secure table with strict access policies already in place
- The admin check happens server-side, so it can't be faked

## Technical Details

**File: `src/pages/Login.tsx`**
- Import the SquirrelBox logo asset
- Add an `isAdminLogin` toggle state
- After successful `signInWithPassword`, call `supabase.rpc("has_role", { _user_id: user.id, _role: "admin" })` to check the role
- If admin toggle is on and user has the role, navigate to `/admin`
- If admin toggle is on but user is NOT an admin, show an error toast ("You don't have admin access")
- If admin toggle is off, navigate to `/portal` as before
- Add a subtle text link below the form: "Admin? Sign in here" that toggles the mode, changing the card description to "Sign in to the admin dashboard"

**No database changes needed** -- the `user_roles` table and `has_role` function already exist.

