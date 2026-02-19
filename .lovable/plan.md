

# SquirrelBox Storage — Full Platform Plan

## Overview
A modern, clean website and full-service platform replacing Zoho Forms and Airtable. Serves CU Boulder and DU students with valet storage — empty box drop-off, full box pickup, summer storage, and fall delivery. Includes a public marketing site, student booking & portal, Stripe payments, and a full admin dashboard.

---

## 1. Public Marketing Website
- **Homepage** with hero section, how-it-works steps, pricing preview, school selector (CU Boulder / DU), testimonials, and CTA to book
- **How It Works** page — visual step-by-step (sign up → we drop off boxes → you pack → we pick up → we store → we deliver in fall)
- **Pricing** page — dynamically pulls packages and add-on prices from admin-configured settings
- **FAQ** page
- **Contact** page
- Modern, clean design with SquirrelBox branding (orange accents, professional feel)

## 2. Student Booking Flow (Sign-Up Form)
A multi-step form collecting:
- **Step 1 — Student Info**: Name, email, phone
- **Step 2 — Parent/Guardian Info**: Name, email, phone
- **Step 3 — School & Location**: School (CU Boulder or DU), dorm or off-campus address
- **Step 4 — Box Drop-Off Date**: Dropdown of admin-configured available dates for empty box delivery
- **Step 5 — Pickup Date & Time**: Dropdown of admin-configured dates/times for full box collection
- **Step 6 — Package Selection**: Choose a box package (admin-configured) or custom number of boxes, plus special item add-ons (bike, mini fridge, furniture, etc. — each with fixed pricing set by admin)
- **Step 7 — Comments**: Free-text field for special instructions
- **Step 8 — Review & Pay**: Order summary with total, Stripe checkout for deposit or full payment

After booking, a student account is automatically created.

## 3. Student Portal (Login Required)
- **My Storage**: View list of items currently in storage
- **Billing**: View charges, payments made, and outstanding balance
- Simple, read-only dashboard — no self-service delivery requests

## 4. Admin Dashboard (Login Required, Role-Based Access)
### Orders & Customers
- View all bookings with filters (school, status, date)
- View individual order details (student info, parent info, items, dates, billing)
- Update order status (booked → boxes delivered → boxes picked up → in storage → delivered back)

### Inventory Management
- Per-student item list with quantities (boxes by size, special items)
- Warehouse location tracking (assign a bin/shelf/zone to each student's items)
- Search and filter by student, school, item type, location

### Scheduling
- Manage available dates for box drop-off and pickup (add/remove date slots that students see in the booking form)
- View calendar of upcoming drop-offs and pickups

### Configuration
- Manage box packages (name, description, number of boxes, price)
- Manage special item add-ons (name, price)
- Manage dorm/building lists per school

### Billing & Payments
- View payments received via Stripe
- Track outstanding balances per student
- Add manual charges or adjustments (extra fees, discounts)

## 5. Backend & Integrations
- **Supabase** for database, authentication, and row-level security
- **Stripe** for payment processing (deposit at sign-up)
- **Role-based access**: Admin role stored in separate `user_roles` table with security-definer functions
- Key database tables: students, parents, orders, order_items, packages, add_ons, available_dates, warehouse_locations, payments

## 6. Implementation Order
1. Set up Supabase database schema and authentication
2. Build the public marketing pages (Home, How It Works, Pricing, FAQ, Contact)
3. Build the student booking form with Stripe payment
4. Build the student portal (view items, billing)
5. Build the admin dashboard (orders, inventory, scheduling, config, billing)
6. Connect Stripe for live payments

