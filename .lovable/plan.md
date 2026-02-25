

# Stripe Deposit Integration Plan

## What We Know
- You have a **Deposit** product in Stripe: `prod_U2tHWjoGA9hS6m` with price `price_1T4nUiAZM1waSADi7PY5VjA5` at **$50.00**
- The booking flow currently shows the full estimated total and submits the order directly
- Students already create an account during signup (Step 0), so we have authenticated users

## How It Will Work

**For the student:**
1. They complete the booking form as usual through all steps
2. On the Review step (Step 7), they see their **estimated total** AND a clear explanation that they only pay a **$50 deposit now**
3. The deposit is applied toward their final bill, which is charged to the card on file once pickup is complete
4. Clicking "Pay Deposit & Confirm" saves their order to the database, then redirects them to Stripe Checkout to pay the $50 deposit
5. After successful payment, they land on a success page confirming their booking

**For you (admin):**
- After pickup, you charge the remaining balance (total minus $50 deposit) from the admin billing page (future enhancement) or directly via Stripe

## Technical Steps

### 1. Create an Edge Function: `create-checkout`
- Receives the order ID from the frontend
- Authenticates the user
- Creates or finds a Stripe customer by email
- Creates a Stripe Checkout session in `payment` mode with `setup_future_usage: 'off_session'` — this charges the $50 deposit AND saves the card for future charges
- Returns the checkout URL

### 2. Add a `stripe_customer_id` column to the `students` table
- So we can reference the Stripe customer later when charging the remaining balance

### 3. Add `deposit_paid` boolean and `stripe_session_id` to the `orders` table
- Track whether the deposit has been paid
- Store the Stripe session ID for reference

### 4. Create an Edge Function: `verify-payment`
- Called when the student returns to the success page
- Verifies the Checkout session status with Stripe
- Updates the order's `deposit_paid` to true
- Records the payment in the `payments` table
- Saves the `stripe_customer_id` on the student record

### 5. Update the Booking Flow (`Book.tsx`)
- On the Review step, redesign the pricing section to show:
  - **Estimated Total**: $XXX (the full calculated amount)
  - **Deposit Due Today**: $50.00
  - **Remaining Balance**: $XXX (charged after pickup)
  - A clear note: "Your card will be saved on file. The remaining balance will be charged once we've picked up and verified your items."
- Change the submit button text to **"Pay $50 Deposit & Confirm"**
- After saving the order to the database, invoke the `create-checkout` edge function and redirect to Stripe

### 6. Create a Payment Success Page
- New route `/payment-success`
- Calls `verify-payment` to confirm the deposit
- Shows a confirmation message with order details and next steps

### 7. Database Migration
```text
ALTER TABLE students ADD COLUMN stripe_customer_id text;
ALTER TABLE orders ADD COLUMN deposit_paid boolean DEFAULT false;
ALTER TABLE orders ADD COLUMN stripe_session_id text;
```

### Files to Create/Modify
- **Create**: `supabase/functions/create-checkout/index.ts`
- **Create**: `supabase/functions/verify-payment/index.ts`
- **Create**: `src/pages/PaymentSuccess.tsx`
- **Modify**: `src/pages/Book.tsx` (Review step UI + submit logic)
- **Modify**: `src/App.tsx` (add `/payment-success` route)
- **Modify**: `supabase/config.toml` (edge function JWT settings)
- **Database migration**: Add columns to `students` and `orders` tables

