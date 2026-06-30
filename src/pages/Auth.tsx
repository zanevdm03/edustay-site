import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { toast } = useToast();
  const [loading, setLoading] = useState<"apple" | "google" | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate(redirect);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate(redirect);
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate, redirect]);

  const handleOAuth = async (provider: "apple" | "google") => {
  setLoading(provider);

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin + redirect,
    },
  });

  if (error) {
    toast({
      title: "Sign-in failed",
      description: error.message,
      variant: "destructive",
    });

    setLoading(null);
  }
};

  return (
    <Layout>
      <section className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-xl bg-card p-8 card-shadow">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Welcome to EduStay</h1>
          <p className="mb-8 text-muted-foreground">Sign in to save favorites and manage enquiries.</p>
          <div className="space-y-3">
            <Button
              onClick={() => handleOAuth("apple")}
              disabled={loading !== null}
              size="lg"
              className="w-full bg-foreground text-background hover:bg-foreground/90"
            >
              <Apple className="mr-2 h-5 w-5" />
              {loading === "apple" ? "Signing in..." : "Continue with Apple"}
            </Button>
            <Button
              onClick={() => handleOAuth("google")}
              disabled={loading !== null}
              size="lg"
              variant="outline"
              className="w-full"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading === "google" ? "Signing in..." : "Continue with Google"}
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
