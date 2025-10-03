import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signInSchema, resetPasswordSchema, type SignInFormData, type ResetPasswordFormData } from "@/lib/validations";
import { ADMIN_CREDENTIALS } from "@/constants/admin";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, adminSignIn, resetPassword, loading } = useAuth();
  const navigate = useNavigate();
  
  const signInForm = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema)
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSignIn = async (data: SignInFormData) => {
    // Check if credentials match admin
    if (
      data.email === ADMIN_CREDENTIALS.username ||
      data.email === ADMIN_CREDENTIALS.email
    ) {
      if (data.password === ADMIN_CREDENTIALS.password) {
        const { error } = await adminSignIn(
          ADMIN_CREDENTIALS.email,
          ADMIN_CREDENTIALS.password,
          "Admin"
        );
        if (!error) {
          navigate('/admin');
        }
        return;
      }
    }

    // Regular user sign in
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      navigate('/');
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    const { error } = await resetPassword(data.email);
    if (!error) {
      setShowForgotPassword(false);
      resetForm.reset();
    }
  };

  if (showForgotPassword) {
    return (
      <Layout>
        <Seo title="Reset Password" canonical="/signin" />
        <section className="container py-16 grid place-items-center">
          <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
            <h1 className="text-2xl font-bold mb-6">Reset your password</h1>
            <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  {...resetForm.register("email")}
                />
                {resetForm.formState.errors.email && (
                  <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={resetForm.formState.isSubmitting || loading}
              >
                {resetForm.formState.isSubmitting ? "Sending..." : "Send Reset Email"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo title="Sign In" canonical="/signin" />
      <section className="container py-16 grid place-items-center">
        <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
          <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="font-medium">Admin Access</p>
                <p className="text-xs text-muted-foreground">
                  Username: <code className="bg-background px-1 rounded">admin</code> | 
                  Password: <code className="bg-background px-1 rounded">Admin@123</code>
                </p>
              </div>
            </div>
          </div>
          <form onSubmit={signInForm.handleSubmit(onSignIn)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email or Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                {...signInForm.register("email")}
              />
              {signInForm.formState.errors.email && (
                <p className="text-sm text-destructive">{signInForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...signInForm.register("password")}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              className="w-full" 
              disabled={signInForm.formState.isSubmitting || loading}
            >
              {signInForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot your password?
            </Button>

            <div className="text-sm text-muted-foreground text-center">
              New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default SignIn;
