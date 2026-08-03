import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { authService } from '../services/authService';

const AuthContext = createContext({
  user: null,
  profile: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveProfile = async (userObj) => {
    if (!userObj) return null;
    let userProf = await authService.getUserProfile(userObj.id);
    if (!userProf || !userProf.role) {
      const metaRole = userObj.user_metadata?.role || (userObj.email?.toLowerCase().includes('admin') ? 'admin' : 'driver');
      const metaName = userObj.user_metadata?.full_name || userObj.email;
      userProf = { id: userObj.id, full_name: metaName, role: metaRole };
    }
    return userProf;
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Load initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const prof = await resolveProfile(session.user);
          setProfile(prof);
        }
      } catch (err) {
        console.error('Error restoring session:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        const prof = await resolveProfile(session.user);
        setProfile(prof);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    if (data?.user) {
      setUser(data.user);
      const prof = await resolveProfile(data.user);
      setProfile(prof);
    }
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    role: profile?.role || null,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
