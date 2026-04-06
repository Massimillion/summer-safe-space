import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import squirrelboxLogo from "@/assets/squirrelbox-logo.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email address first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResetSent(true);
      toast({ title: "Check your email", description: "We sent a password reset link to your inbox." });
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (isAdminLogin) {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: authData.user.id,
        _role: "admin",
      });

      if (isAdmin) {
        navigate("/admin");
      } else {
        toast({ title: "Access denied", description: "You don't have admin access.", variant: "destructive" });
        await supabase.auth.signOut();
      }
    } else {
      navigate("/portal");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mx-auto mb-4 flex items-center gap-2">
            <img src={squirrelboxLogo} alt="SquirrelBox" className="h-8 w-8" />
            <span className="font-display text-xl font-bold">
              Squirrel<span className="text-primary">Box</span>
            </span>
          </Link>
          <CardTitle className="font-display text-2xl">
            {isAdminLogin ? "Admin Login" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isAdminLogin ? "Sign in to the admin dashboard" : "Sign in to your student portal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={handleForgotPassword} className="text-xs text-muted-foreground hover:text-primary hover:underline">
                Forgot password?
              </button>
            </div>
            {resetSent && (
              <p className="text-sm text-center text-green-600">Reset link sent — check your inbox.</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isAdminLogin ? (
              <button
                type="button"
                onClick={() => setIsAdminLogin(false)}
                className="text-primary hover:underline"
              >
                ← Back to student login
              </button>
            ) : (
              <>
                Don't have an account?{" "}
                <Link to="/book" className="text-primary hover:underline">
                  Book storage to get started
                </Link>
              </>
            )}
          </p>
          {!isAdminLogin && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setIsAdminLogin(true)}
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Admin? Sign in here
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
