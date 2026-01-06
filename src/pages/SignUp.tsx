import { AuthLayout } from "@/components/layout/AuthLayout";
import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, User, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { signUpSchema, type SignUpFormData } from "@/lib/validations";
import { SocialLoginButton } from "@/components/auth/SocialLoginButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    const { error } = await signUp(data.email, data.password, data.fullName);
    if (!error) {
      navigate("/onboarding");
    }
  };

  const handleGoogleSignUp = async () => {
    // Temporarily disabled - will be enabled later
    toast.info("Google sign-up coming soon!");
  };

  return (
    <AuthLayout>
      <Seo title="Sign Up" canonical="/signup" />
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Create an account</h1>
          <p className="text-muted-foreground">
            Join Kulmid and start discovering amazing events
          </p>
        </div>

        {/* Social Login */}
        <SocialLoginButton
          provider="google"
          onClick={handleGoogleSignUp}
          loading={googleLoading}
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-4 text-muted-foreground">
              or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                placeholder="Enter your full name"
                className="pl-10 h-12"
                {...register("fullName")}
              />
            </div>
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-12"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="pr-10 h-12"
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-primary font-medium hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link to="/help" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/help" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
