import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

function extractHashParams(url: string): Record<string, string> {
  const hash = url.split('#')[1];
  if (!hash) return {};
  const params: Record<string, string> = {};
  hash.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) params[key] = decodeURIComponent(value);
  });
  return params;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[Auth] Initializing - fetching session...');
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession result:', { hasSession: !!session, userId: session?.user?.id, error: error?.message });
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] onAuthStateChange:', { event, hasSession: !!session, userId: session?.user?.id, email: session?.user?.email });
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Deep link handler for password reset
  useEffect(() => {
    const handleURL = async (event: { url: string }) => {
      console.log('[Auth] Deep link received:', event.url);
      const params = extractHashParams(event.url);
      console.log('[Auth] Extracted hash params:', Object.keys(params));
      if (params.access_token && params.refresh_token) {
        console.log('[Auth] Setting session from deep link tokens...');
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
        console.log('[Auth] setSession result:', { error: error?.message ?? 'success' });
      } else {
        console.log('[Auth] No tokens found in deep link');
      }
    };

    const subscription = Linking.addEventListener('url', handleURL);
    Linking.getInitialURL().then(url => {
      console.log('[Auth] Initial URL:', url);
      if (url) handleURL({ url });
    });

    return () => subscription.remove();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[Auth] signIn attempt:', { email });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('[Auth] signIn result:', { success: !!data.session, error: error?.message });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('[Auth] signUp attempt:', { email, fullName });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    console.log('[Auth] signUp result:', {
      success: !error,
      userId: data.user?.id,
      emailConfirmed: data.user?.email_confirmed_at,
      identities: data.user?.identities?.length,
      error: error?.message,
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    console.log('[Auth] signOut');
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectTo = Linking.createURL('reset-password');
    console.log('[Auth] resetPassword attempt:', { email, redirectTo });
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    console.log('[Auth] resetPassword result:', { error: error?.message ?? 'success' });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    console.log('[Auth] updatePassword attempt');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    console.log('[Auth] updatePassword result:', { error: error?.message ?? 'success' });
    return { error: error?.message ?? null };
  };

  const resendVerificationEmail = async (email: string) => {
    console.log('[Auth] resendVerificationEmail attempt:', { email });
    const { data, error } = await supabase.auth.resend({ type: 'signup', email });
    console.log('[Auth] resendVerificationEmail result:', { data, error: error?.message ?? 'success' });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
