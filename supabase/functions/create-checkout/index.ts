import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email as string;

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId is required");

    // Verify the order belongs to this user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_cents, student_id, students(id, email, stripe_customer_id)")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Order not found");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const student = (order as any).students;
    let customerId = student?.stripe_customer_id;

    if (!customerId) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({ email: userEmail });
        customerId = customer.id;
      }

      // Save stripe_customer_id on the student record using service role
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await adminClient
        .from("students")
        .update({ stripe_customer_id: customerId })
        .eq("id", student.id);
    }

    const origin = req.headers.get("origin") || "https://localhost:3000";

    // Create Checkout session for $50 deposit with card saved for future use
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: "price_1T4nUiAZM1waSADi7PY5VjA5",
          quantity: 1,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        setup_future_usage: "off_session",
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/book?cancelled=true`,
    });

    // Save session ID on the order
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    await adminClient
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", orderId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
