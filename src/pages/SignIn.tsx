import { AuthLayout } from "@/components/layout/AuthLayout";
import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, resetPasswordSchema, type SignInFormData, type ResetPasswordFormData } from "@/lib/validations";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
});

type EmailFormData = z.infer<typeof emailSchema>;

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [step, setStep] = useState<'email' | 'password'>('email');
  const { signIn, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onEmailContinue = async (data: EmailFormData) => {
    signInForm.setValue("email", data.email);
    setStep('password');
  };

  const onSignIn = async (data: SignInFormData) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (roleData?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/discover");
      }
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    const { error } = await resetPassword(data.email);
    if (!error) {
      setShowForgotPassword(false);
      resetForm.reset();
    }
  };

  const handleBack = () => {
    setStep('email');
    signInForm.reset();
  };

  if (showForgotPassword) {
    return (
      <AuthLayout>
        <Seo title="Reset Password" canonical="/signin" />
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-2">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </button>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Reset password</h1>
            <p className="text-muted-foreground">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12"
                  {...resetForm.register("email")}
                />
              </div>
              {resetForm.formState.errors.email && (
                <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12"
              disabled={resetForm.formState.isSubmitting || loading}
            >
              {resetForm.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Seo title="Sign In" canonical="/signin" />
      <div className="space-y-6 animate-fade-in">
        {step === 'email' ? (
          <>
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">Enter your email to continue</p>
            </div>

            <form onSubmit={emailForm.handleSubmit(onEmailContinue)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-12"
                    autoFocus
                    {...emailForm.register("email")}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={emailForm.formState.isSubmitting}
              >
                Continue
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
                Create one
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Enter your password</h1>
              <p className="text-muted-foreground">{signInForm.getValues("email")}</p>
            </div>

            <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4">
              <input type="hidden" {...signInForm.register("email")} />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pr-10 h-12"
                    autoFocus
                    {...signInForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signInForm.formState.errors.password && (
                  <p className="text-sm text-destructive">{signInForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12"
                disabled={signInForm.formState.isSubmitting || loading}
              >
                {signInForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default SignIn;
