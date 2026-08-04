import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { FLEET, SERVICES, DESTINATIONS, DEFAULT_WHATSAPP_NUMBER } from '../data/fleetData';

export const fleetService = {
  /**
   * Fetch all published fleet vehicles for public display.
   * Falls back to local fleetData.js if Supabase is unconfigured or fails.
   */
  async getPublicFleets() {
    if (!isSupabaseConfigured || !supabase) {
      return FLEET;
    }

    try {
      const { data, error } = await supabase
        .from('fleets')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Supabase fetch fleets error, using fallback data:', error.message);
        return FLEET;
      }

      // Map Supabase snake_case columns to camelCase for frontend
      return data.map((item) => ({
        id: item.id,
        driverId: item.driver_id,
        name: item.name,
        driverName: item.driver_name,
        rate: item.rate,
        seats: item.seats,
        luggage: item.luggage,
        whatsappNumber: item.whatsapp_number,
        image: item.image_url,
        imagePositionX: item.image_position_x ?? 50,
        imagePositionY: item.image_position_y ?? 50,
        galleryUrls: item.gallery_urls || [],
        description: item.description,
        direction: item.direction || 'jb-sg',
        isPublished: item.is_published,
      }));
    } catch (err) {
      console.warn('Failed to connect to Supabase fleets, using local fallback:', err);
      return FLEET;
    }
  },

  /**
   * Fetch services list
   */
  async getPublicServices() {
    if (!isSupabaseConfigured || !supabase) {
      return SERVICES;
    }

    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return SERVICES;
      }

      return data.map((srv) => ({
        id: srv.id,
        title: srv.title,
        desc: srv.description,
        image: srv.image_url,
      }));
    } catch (err) {
      return SERVICES;
    }
  },

  /**
   * Fetch destinations
   */
  async getPublicDestinations() {
    if (!isSupabaseConfigured || !supabase) {
      return DESTINATIONS;
    }

    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return DESTINATIONS;
      }

      const johor = data
        .filter((d) => d.category === 'johor')
        .map((d) => ({ id: d.id, name: d.name, location: d.location, tag: d.tag, image: d.image_url }));

      const singapore = data
        .filter((d) => d.category === 'singapore')
        .map((d) => ({ id: d.id, name: d.name, location: d.location, tag: d.tag, image: d.image_url }));

      return { johor, singapore };
    } catch (err) {
      return DESTINATIONS;
    }
  },

  /**
   * Fetch single vehicle for logged-in Driver
   */
  async getDriverFleet(driverId) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const { data, error } = await supabase
      .from('fleets')
      .select('*')
      .eq('driver_id', driverId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      driverId: data.driver_id,
      name: data.name,
      driverName: data.driver_name,
      rate: data.rate,
      seats: data.seats,
      luggage: data.luggage,
      whatsappNumber: data.whatsapp_number,
      image: data.image_url,
      imagePositionX: data.image_position_x ?? 50,
      imagePositionY: data.image_position_y ?? 50,
      galleryUrls: data.gallery_urls || [],
      description: data.description,
      direction: data.direction || 'jb-sg',
      isPublished: data.is_published,
    };
  },

  /**
   * Driver updates their assigned fleet profile
   */
  async updateDriverFleet(fleetId, payload) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const { data, error } = await supabase
      .from('fleets')
      .update({
        name: payload.name,
        driver_name: payload.driverName,
        rate: payload.rate,
        seats: payload.seats,
        luggage: payload.luggage,
        whatsapp_number: payload.whatsappNumber,
        image_url: payload.imageUrl,
        image_position_x: payload.imagePositionX ?? 50,
        image_position_y: payload.imagePositionY ?? 50,
        gallery_urls: payload.galleryUrls || [],
        description: payload.description,
        direction: payload.direction,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fleetId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Admin: Fetch all fleet records
   */
  async getAllFleetsAdmin() {
    if (!isSupabaseConfigured || !supabase) {
      return FLEET.map((f, i) => {
        const now = new Date();
        const fakeExpiry = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
        return {
          ...f,
          isPublished: true,
          driverId: f.driverName ? `driver-${i}` : null,
          expiresAt: fakeExpiry,
        };
      });
    }

    let data = null;
    let error = null;

    const res = await supabase
      .from('fleets')
      .select('*, profiles:driver_id(full_name, created_at, expires_at)')
      .order('display_order', { ascending: true });

    data = res.data;
    error = res.error;

    if (error) {
      console.warn('getAllFleetsAdmin joined select error, trying simple select:', error.message);
      const resFallback = await supabase.from('fleets').select('*').order('display_order', { ascending: true });
      data = resFallback.data;
      if (resFallback.error) throw resFallback.error;
    }

    return (data || []).map((item) => {
      const rawExpiresAt = item.profiles?.expires_at;
      let expiresAt = rawExpiresAt;
      if (!expiresAt) {
        const baseDate = item.profiles?.created_at
          ? new Date(item.profiles.created_at)
          : item.created_at
          ? new Date(item.created_at)
          : new Date();
        const futureDate = new Date(baseDate);
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expiresAt = futureDate.toISOString();
      }

      // Whether this vehicle is currently hidden from the public site by the
      // "Public read published fleets" RLS policy despite isPublished=true,
      // because its assigned driver's account has expired.
      const isDriverExpired = Boolean(item.driver_id) && Boolean(rawExpiresAt) && new Date(rawExpiresAt) < new Date();

      return {
        id: item.id,
        driverId: item.driver_id,
        name: item.name,
        driverName: item.driver_name,
        assignedDriverName: item.profiles?.full_name || null,
        expiresAt: expiresAt || null,
        isDriverExpired,
        rate: item.rate,
        seats: item.seats,
        luggage: item.luggage,
        whatsappNumber: item.whatsapp_number,
        image: item.image_url,
        imagePositionX: item.image_position_x ?? 50,
        imagePositionY: item.image_position_y ?? 50,
        galleryUrls: item.gallery_urls || [],
        description: item.description,
        direction: item.direction || 'jb-sg',
        isPublished: item.is_published,
      };
    });
  },

  /**
   * Admin: Toggle publish status
   */
  async toggleFleetPublishStatus(fleetId, isPublished) {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('The system is not set up correctly. Please contact the site administrator.');
    }

    const { error } = await supabase
      .from('fleets')
      .update({ is_published: isPublished })
      .eq('id', fleetId);

    if (error) throw error;
  },
};
