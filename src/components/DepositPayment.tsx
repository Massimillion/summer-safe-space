import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const stripePromise = loadStripe("pk_live_d3JyKgg7AbQAVrpvTkJuZ8fn");

interface DepositPaymentFormProps {
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
}

const CheckoutForm = ({ orderId, onSuccess }: DepositPaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?order_id=${orderId}`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      // Verify on the server
      const { data, error: verifyError } = await supabase.functions.invoke("verify-payment", {
        body: { paymentIntentId: paymentIntent.id, orderId },
      });

      if (verifyError || data?.error) {
        toast({
          title: "Payment received",
          description: "Your deposit was charged but verification is still processing. You'll receive a confirmation soon.",
        });
      }

      onSuccess(paymentIntent.id);
    } else {
      setError("Payment was not completed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="w-full"
        size="lg"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" /> Pay $50 Deposit & Confirm
          </>
        )}
      </Button>
    </form>
  );
};

interface DepositPaymentProps {
  clientSecret: string;
  orderId: string;
  onSuccess: (paymentIntentId: string) => void;
}

const DepositPayment = ({ clientSecret, orderId, onSuccess }: DepositPaymentProps) => {
  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Stripe is not configured. Please ensure the publishable key is set.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#16a34a",
            borderRadius: "8px",
          },
        },
      }}
    >
      <CheckoutForm orderId={orderId} onSuccess={onSuccess} />
    </Elements>
  );
};

export default DepositPayment;
