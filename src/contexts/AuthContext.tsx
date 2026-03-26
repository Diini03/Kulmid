import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
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
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any; needsEmailConfirmation?: boolean }>;
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
  const reconciliationDoneRef = useRef<Set<string>>(new Set());

  // Post-auth reconciliation: ensure profile + user_preferences rows exist
  const handlePostAuth = async (authUser: User) => {
    // Skip if already reconciled this session
    if (reconciliationDoneRef.current.has(authUser.id)) return;
    reconciliationDoneRef.current.add(authUser.id);

    try {
      const fullName = authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';

      // Upsert profile (in case trigger failed or metadata was missing)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { user_id: authUser.id, full_name: fullName },
          { onConflict: 'user_id' }
        );
      if (profileError) {
        console.error('Post-auth profile upsert error:', profileError);
      }

      // Check if user_preferences row exists; create if not
      const { data: prefs, error: prefsError } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (prefsError && prefsError.code !== 'PGRST116') {
        console.error('Post-auth preferences check error:', prefsError);
      }

      if (!prefs) {
        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert({ user_id: authUser.id, onboarding_completed: false });
        if (insertError) {
          console.error('Post-auth preferences insert error:', insertError);
        }
      }
    } catch (error) {
      console.error('Post-auth reconciliation error:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url, created_at, updated_at')
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

  // Listen for profile updates from settings
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setProfile(detail);
    };
    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => window.removeEventListener("profile-updated", handleProfileUpdate);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
          setSession(session);
          return;
        }
        
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
          if (session.user.id !== currentUserIdRef.current) {
            currentUserIdRef.current = session.user.id;
            setAdminCheckComplete(false);
            // Run reconciliation + fetch in parallel
            setTimeout(() => {
              handlePostAuth(session.user);
              fetchProfile(session.user.id);
              checkAdminRole(session.user.id);
            }, 0);
          }
        }
        
        if (!initialLoadComplete) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        currentUserIdRef.current = session.user.id;
        handlePostAuth(session.user);
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
          data: { full_name: fullName }
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
        
        toast({ title: "Sign up failed", description, variant: "destructive" });
        return { error, needsEmailConfirmation: false };
      }

      // Check if we got a session back (email confirmation disabled) or not (confirmation required)
      if (data.session) {
        // User is signed in immediately — run reconciliation
        await handlePostAuth(data.session.user);
        toast({ title: "Account created successfully", description: "Welcome! Let's set up your preferences." });
        return { error: null, needsEmailConfirmation: false };
      } else {
        // No session = email confirmation is required
        // Don't show misleading "you're signed in" toast
        return { error: null, needsEmailConfirmation: true };
      }
    } catch (error: any) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return { error, needsEmailConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        let description = error.message;

        if (msg.includes('email not confirmed')) {
          description = "Your email hasn't been verified yet. Please check your inbox for a confirmation link.";
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          description = "Invalid email or password. Please check your credentials and try again.";
        }

        toast({ title: "Sign in failed", description, variant: "destructive" });
      }
      return { error };
    } catch (error: any) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
        throw error;
      }
      
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.warn('Local storage cleanup warning:', e);
      }
      
      currentUserIdRef.current = null;
      reconciliationDoneRef.current.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      
      toast({ title: "Signed out", description: "You have been successfully signed out." });
      window.location.href = '/';
    } catch (error: any) {
      console.error('Sign out error:', error);
      currentUserIdRef.current = null;
      reconciliationDoneRef.current.clear();
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsAdmin(false);
      setAdminCheckComplete(true);
      toast({ title: "Signed out", description: "You have been signed out." });
      window.location.href = '/';
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
      
      if (error) {
        toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Reset email sent", description: "Please check your email for password reset instructions." });
      }
      return { error };
    } catch (error: any) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
      return { error };
    }
  };

  const value: AuthContextType = {
    user, session, profile, loading, isAdmin, adminCheckComplete,
    signUp, signIn, signOut, resetPassword, refreshSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
