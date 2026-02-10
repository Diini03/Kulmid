import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  adminCheckComplete: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  const { toast } = useToast();
  const currentUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        setAdminCheckComplete(true);
        return;
      }
      
      const hasAdminRole = !!data;
      console.log('Admin role check:', { userId, hasAdminRole, data });
      setIsAdmin(hasAdminRole);
      setAdminCheckComplete(true);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
      setAdminCheckComplete(true);
    }
  };

  const refreshSession = async (): Promise<Session | null> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        // If refresh fails, sign out the user
        await signOut();
        return null;
      }
      return data.session;
    } catch (error) {
      console.error('Session refresh error:', error);
      await signOut();
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        // Handle token refresh - update session silently without triggering loading state
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setSession(session);
          return; // Don't trigger loading or re-render the entire app
        }
        
        // Handle sign out or session expiry
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsAdmin(false);
          setAdminCheckComplete(true);
          if (!initialLoadComplete) {
            setLoading(false);
            setInitialLoadComplete(true);
          }
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Only re-check admin role if the user actually changed
          if (session.user.id !== currentUserIdRef.current) {
            currentUserIdRef.current = session.user.id;
            setAdminCheckComplete(false);
            setTimeout(() => {
              fetchProfile(session.user.id);
              checkAdminRole(session.user.id);
            }, 0);
          }
        }
        
        // Only set loading to false on initial load
        if (!initialLoadComplete) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      } else {
        setAdminCheckComplete(true);
      }
      
      setLoading(false);
      setInitialLoadComplete(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        const message = error.message?.toLowerCase() || '';
        let description = error.message;
        
        if (message.includes('rate limit') || message.includes('too many requests')) {
          description = "Too many attempts. Please wait a few minutes and try again.";
        } else if (message.includes('already registered') || message.includes('already been registered')) {
          description = "This email is already registered. Try signing in instead.";
        }
        
        toast({
          title: "Sign up failed",
          description,
          variant: "destructive"
        });
        return { error };
      }
      
      toast({
        title: "Account created successfully",
        description: "Welcome! You're now signed in."
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const adminSignIn = async (email: string, password: string, fullName: string) => {
    try {
      // Check if admin user exists
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // If admin exists, sign in
      if (existingUser.user) {
        // Ensure admin role is set
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', existingUser.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (!roleData) {
          await supabase
            .from('user_roles')
            .insert({ user_id: existingUser.user.id, role: 'admin' });
        }

        toast({
          title: "Welcome back, Admin",
          description: "Successfully signed in."
        });
        return { error: null };
      }

      // If admin doesn't exist, create the account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName
          }
        }
      });

      if (signUpError) {
        toast({
          title: "Admin setup failed",
          description: signUpError.message,
          variant: "destructive"
        });
        return { error: signUpError };
      }

      // Create admin role
      if (signUpData.user) {
        await supabase
          .from('user_roles')
          .insert({ user_id: signUpData.user.id, role: 'admin' });

        toast({
          title: "Admin account created",
          description: "Welcome to EventEase Admin Panel!"
        });
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Admin sign in failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase first - this clears all auth tokens
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      // HARD CLEAR: remove any residual Supabase auth keys from localStorage
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Local storage cleanup warning:', e);
      }
      
      // Clear local state
      currentUserIdRef.current = null;
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out."
      });
      
      // Force reload to clear any cached state
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Even on error, clear local state and redirect
      currentUserIdRef.current = null;
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      
      toast({
        title: "Signed out",
        description: "You have been signed out."
      });
      
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      
      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset email sent",
          description: "Please check your email for password reset instructions."
        });
      }
      
      return { error };
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive"
      });
      return { error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    adminCheckComplete,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};