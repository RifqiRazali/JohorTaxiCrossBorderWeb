import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { storageService } from './storageService';
import { formatCountLabel, formatRateLabel } from '../lib/utils';

const DEMO_ACCOUNT_HINT =
  'Demo accounts must be seeded first. Run supabase_schema.sql in your Supabase SQL Editor if admin@taxijohor.com or driver@taxijohor.com cannot sign in.';

const DEMO_ACCOUNT_EMAILS = new Set(['admin@taxijohor.com', 'driver@taxijohor.com']);

const getAuthErrorMessage = (error) => {
  if (!error?.message || error.message === '{}') {
    return `status ${error?.status || 'unknown'}`;
  }

  return error.message;
};

export const authService = {
  /**
   * Log in user with email & password
   */
  async login(email, password) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The login system is not set up yet. Please contact the site administrator.');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      if (error?.message?.toLowerCase().includes('email not confirmed')) {
        throw new Error('This account has not been confirmed yet. Please contact the site administrator.');
      }

      if (import.meta.env.DEV && DEMO_ACCOUNT_EMAILS.has(cleanEmail) && password === 'Password123!') {
        throw new Error(`${DEMO_ACCOUNT_HINT} Supabase sign-in returned: ${getAuthErrorMessage(error)}`);
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
  async adminProvisionDriver({
    email,
    password,
    fullName,
    phoneNumber,
    carName,
    carSeats,
    carLargeBags,
    carRate,
    carImageUrl,
    carDescription,
  }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error: rpcErr } = await supabase.rpc('admin_create_driver_user', {
      driver_email: cleanEmail,
      driver_password: password,
      driver_full_name: fullName.trim(),
      driver_phone: phoneNumber.trim(),
      car_name: carName.trim(),
      car_seats: formatCountLabel(carSeats, 'Seater', 'Seater'),
      car_luggage: formatCountLabel(carLargeBags, 'large bag', 'large bags'),
      car_rate: formatRateLabel(carRate),
      car_image_url: carImageUrl.trim(),
      car_description: carDescription?.trim() || null,
    });

    if (rpcErr) {
      throw new Error(rpcErr.message || 'Driver provisioning failed. Please contact the site administrator.');
    }

    if (!data?.driver_id || !data?.fleet_id) {
      throw new Error('Driver provisioning returned incomplete account details.');
    }

    return { driverId: data.driver_id, fleetId: data.fleet_id };
  },

  /**
   * Admin creates a driver login and attaches it to an EXISTING vehicle
   * (preserving that vehicle's photo/rate/specs), instead of creating a new one.
   */
  async adminProvisionDriverForFleet({ email, password, fullName, phoneNumber, fleetId }) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const cleanEmail = email.trim().toLowerCase();

    const { data, error: rpcErr } = await supabase.rpc('admin_provision_driver_for_fleet', {
      driver_email: cleanEmail,
      driver_password: password,
      driver_full_name: fullName.trim(),
      driver_phone: phoneNumber.trim(),
      target_fleet_id: fleetId,
    });

    if (rpcErr) {
      throw new Error(rpcErr.message || 'Driver provisioning failed. Please contact the site administrator.');
    }

    if (!data?.driver_id || !data?.fleet_id) {
      throw new Error('Driver provisioning returned incomplete account details.');
    }

    return { driverId: data.driver_id, fleetId: data.fleet_id };
  },

  /**
   * Admin renews driver account for +1 year
   */
  async adminRenewDriver(driverId, currentExpiresAt) {
    if (!isSupabaseConfigured || !supabase || !driverId) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    // Try calling admin_renew_driver RPC first
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_renew_driver', {
      target_driver_id: driverId,
      extend_months: 12,
    });

    if (!rpcErr && rpcData) {
      return rpcData;
    }

    // Fallback: Direct table update on public.profiles
    const now = new Date();
    const baseDate = currentExpiresAt && new Date(currentExpiresAt) > now ? new Date(currentExpiresAt) : now;
    const newExpiresAt = new Date(baseDate.setFullYear(baseDate.getFullYear() + 1)).toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update({
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', driverId)
      .select('expires_at')
      .maybeSingle();

    if (error) {
      console.warn('Direct renew profile update fallback:', error.message);
      return newExpiresAt;
    }

    return data?.expires_at || newExpiresAt;
  },

  /**
   * Logged-in user changes their own password. Re-verifies the current
   * password via sign-in before applying the change.
   */
  async updatePassword(email, currentPassword, newPassword) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: currentPassword,
    });

    if (verifyErr) {
      throw new Error('Current password is incorrect.');
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      throw new Error(error.message || 'Failed to update password.');
    }

    return true;
  },

  /**
   * Admin resets a driver's login password to a new temporary one (e.g. if the driver forgot it)
   */
  async adminResetDriverPassword(driverId, newPassword) {
    if (!isSupabaseConfigured || !supabase || !driverId) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const { error } = await supabase.rpc('admin_reset_driver_password', {
      target_driver_id: driverId,
      new_password: newPassword,
    });

    if (error) {
      throw new Error(error.message || 'Failed to reset driver password. Please try again.');
    }

    return true;
  },

  /**
   * Admin permanently deletes driver account and unlinks/removes their fleet record
   */
  async adminDeleteDriver(driverId, fleetId, media = {}) {
    if (!isSupabaseConfigured || !supabase || !driverId) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    // Best-effort: free up Storage quota by removing this driver's uploaded photos
    // before the DB records (and the driverId-scoped storage RLS access) are gone.
    const mediaUrls = [media.imageUrl, ...(media.galleryUrls || [])].filter(Boolean);
    if (mediaUrls.length > 0) {
      await storageService.removeFleetImages(mediaUrls).catch((err) => {
        console.warn('Failed to clean up driver photos from Storage:', err);
      });
    }

    // Try calling admin_delete_driver RPC first
    const { error: rpcErr } = await supabase.rpc('admin_delete_driver', {
      target_driver_id: driverId,
    });

    if (!rpcErr) {
      return true;
    }

    console.warn('admin_delete_driver RPC fallback:', rpcErr.message);

    // Fallback direct deletion sequence:
    if (fleetId) {
      await supabase.from('fleets').delete().eq('id', fleetId);
    }
    await supabase.from('fleets').delete().eq('driver_id', driverId);

    const { error: profErr } = await supabase.from('profiles').delete().eq('id', driverId);
    if (profErr) {
      throw new Error(profErr.message || 'Failed to delete driver profile.');
    }

    return true;
  },
};
