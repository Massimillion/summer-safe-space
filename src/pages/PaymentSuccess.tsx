import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verify = async () => {
      if (!sessionId || !orderId) {
        setStatus("error");
        setErrorMsg("Missing payment information.");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId, orderId },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Could not verify payment.");
      }
    };

    verify();
  }, [sessionId, orderId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <CardTitle className="font-display mt-4">Verifying Payment…</CardTitle>
              <CardDescription>Please wait while we confirm your deposit.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-primary" />
              <CardTitle className="font-display mt-4">Booking Confirmed! 🎉</CardTitle>
              <CardDescription>Your $50 deposit has been received and your card is saved on file.</CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <CardTitle className="font-display mt-4">Something Went Wrong</CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </>
          )}
        </CardHeader>
        {status === "success" && (
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-accent p-4 text-sm text-foreground space-y-2">
              <p>✅ Your deposit of <strong>$50.00</strong> has been charged.</p>
              <p>💳 Your card is saved on file for the remaining balance.</p>
              <p>📦 We'll deliver your empty boxes on your selected drop-off date.</p>
              <p>🚚 After we pick up and verify your items, the remaining balance will be charged.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link to="/portal">Go to My Portal</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        )}
        {status === "error" && (
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
