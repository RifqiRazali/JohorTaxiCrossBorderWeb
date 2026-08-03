import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in apps/web/.env');
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try standard sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      // 2. Fallback for demo test accounts if they are not yet registered in live Supabase Auth
      if ((cleanEmail === 'admin@taxijohor.com' || cleanEmail === 'driver@taxijohor.com') && password === 'Password123!') {
        const isDemoAdmin = cleanEmail === 'admin@taxijohor.com';
        const role = isDemoAdmin ? 'admin' : 'driver';
        const fullName = isDemoAdmin ? 'System Administrator' : 'Mr. Razali';

        console.info(`Auto-provisioning demo ${role} account on Supabase Auth...`);

        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: 'Password123!',
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (!signUpErr && signUpData?.user) {
          // Upsert profile role
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            full_name: fullName,
            role,
          });

          // Link vehicle for driver
          if (!isDemoAdmin) {
            await supabase.from('fleets').update({ driver_id: signUpData.user.id }).eq('id', 'tinnova-razali');
          }

          if (signUpData.session) return signUpData;

          // Retry sign in
          const retryRes = await supabase.auth.signInWithPassword({ email: cleanEmail, password: 'Password123!' });
          if (retryRes.data?.user) return retryRes.data;
        }
      }

      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        throw new Error("Email not confirmed. Please run the updated supabase_schema.sql in your Supabase SQL Editor to auto-confirm test accounts, or turn OFF 'Confirm email' in Supabase Dashboard -> Authentication -> Providers -> Email.");
      }

      throw error;
    }

    return data;
  },

  /**
   * Log out user session
   */
  async logout() {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
  },

  /**
   * Fetch current user's profile and RBAC role ('admin' | 'driver')
   */
  async getUserProfile(userId) {
    if (!isSupabaseConfigured || !supabase || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  },

  /**
   * Admin provisions a new driver account and links to fleet record
   */
  async adminProvisionDriver({ email, password, fullName, fleetId }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase is not configured.');
    }

    // 1. Try auto-confirmed RPC driver provisioning
    const { data: rpcDriverId, error: rpcErr } = await supabase.rpc('admin_create_driver_user', {
      driver_email: email,
      driver_password: password,
      driver_full_name: fullName,
      target_fleet_id: fleetId,
    });

    if (!rpcErr && rpcDriverId) {
      return { driverId: rpcDriverId };
    }

    // 2. Fallback to client signUp
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'driver',
        },
      },
    });

    if (signUpError) throw signUpError;
    if (!signUpData.user) throw new Error('User creation returned no user object.');

    const newDriverId = signUpData.user.id;

    await supabase.from('profiles').upsert({
      id: newDriverId,
      full_name: fullName,
      role: 'driver',
    });

    await supabase.from('fleets').update({ driver_id: newDriverId }).eq('id', fleetId);

    return { user: signUpData.user, driverId: newDriverId };
  },
};
