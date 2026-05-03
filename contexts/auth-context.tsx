import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { Alert } from 'react-native';
import { type Session, type User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { supabase } from '@/utils/supabase';

export type UserRole = 'searcher' | 'owner' | 'admin';

export const ROLE_LABEL: Record<UserRole, string> = {
  searcher: 'Searcher',
  owner: 'Owner',
  admin: 'Admin',
};

export const isAdminRole = (role: UserRole | undefined | null): boolean => role === 'admin';

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  confirmSignOut: () => void;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_active')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('[auth] failed to load profile:', error.message);
          setProfile(null);
          return;
        }
        setProfile((data as Profile) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const handleURL = async (event: { url: string }) => {
      const params = extractHashParams(event.url);
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      }
    };

    const subscription = Linking.addEventListener('url', handleURL);
    Linking.getInitialURL().then(url => {
      if (url) handleURL({ url });
    });

    return () => subscription.remove();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You will need to log in again to continue.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const resetPassword = async (email: string) => {
    const redirectTo = Linking.createURL('reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        confirmSignOut,
        resetPassword,
        updatePassword,
        resendVerificationEmail,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
