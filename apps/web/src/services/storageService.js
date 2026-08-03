import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const storageService = {
  /**
   * Upload an image file to Supabase Storage bucket 'fleet-media'
   * @param {File} file - Image file from file input
   * @param {string} folderPath - Target folder in bucket (e.g. 'fleets/driver-id')
   * @returns {Promise<{ publicUrl: string | null, error: Error | null }>}
   */
  async uploadFleetImage(file, folderPath = 'fleets') {
    if (!isSupabaseConfigured || !supabase) {
      return {
        publicUrl: null,
        error: new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'),
      };
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fleet-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('fleet-media')
        .getPublicUrl(filePath);

      return { publicUrl: data.publicUrl, error: null };
    } catch (err) {
      console.error('Storage Upload Error:', err);
      return { publicUrl: null, error: err };
    }
  },
};
