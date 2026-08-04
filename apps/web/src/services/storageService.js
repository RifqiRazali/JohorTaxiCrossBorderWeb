import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Compress image using HTML5 Canvas before uploading
 * Reduces image dimensions to max 1200px and converts to WebP (~0.75 quality)
 * preserving Supabase Free Tier storage limits.
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Convert a Supabase Storage public URL into the bucket-relative object path,
 * e.g. ".../object/public/fleet-media/fleets/abc/file.webp" -> "fleets/abc/file.webp"
 */
const extractStoragePath = (publicUrl, bucket = 'fleet-media') => {
  if (!publicUrl || typeof publicUrl !== 'string') return null;
  const marker = `/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
};

export const storageService = {
  /**
   * Upload an image file to Supabase Storage bucket 'fleet-media' with client-side compression
   * @param {File} file - Image file from file input
   * @param {string} folderPath - Target folder in bucket (e.g. 'fleets/driver-id')
   * @returns {Promise<{ publicUrl: string | null, error: Error | null }>}
   */
  async uploadFleetImage(file, folderPath = 'fleets') {
    if (!isSupabaseConfigured || !supabase) {
      return {
        publicUrl: null,
        error: new Error('The system is not set up correctly. Please contact the site administrator.'),
      };
    }

    try {
      const compressedFile = await compressImage(file);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fleet-media')
        .upload(filePath, compressedFile, {
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

  /**
   * Delete uploaded fleet photos from Storage given their public URLs.
   * Used to free up Free Tier storage quota when a photo is replaced or a driver is removed.
   */
  async removeFleetImages(publicUrls = []) {
    if (!isSupabaseConfigured || !supabase) return;

    const paths = publicUrls.map((url) => extractStoragePath(url)).filter(Boolean);
    if (paths.length === 0) return;

    const { error } = await supabase.storage.from('fleet-media').remove(paths);
    if (error) {
      console.warn('Storage cleanup error:', error.message);
    }
  },
};
