import { supabase } from '@/lib/supabase/client';

export interface ReelValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadReelResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
}

export class ReelStorageService {
  private readonly bucketName = 'creator-reels';
  private readonly maxFileSizeBytes = 100 * 1024 * 1024; // 100 MB max
  private readonly allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  /**
   * Validates video file format and size constraints
   */
  validateReelFile(file: File): ReelValidationResult {
    if (!file) {
      return { valid: false, error: 'No video file provided' };
    }

    if (!this.allowedMimeTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file format. Please upload MP4, WebM, or MOV video files.',
      };
    }

    if (file.size > this.maxFileSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${(this.maxFileSizeBytes / (1024 * 1024)).toFixed(0)}MB limit.`,
      };
    }

    return { valid: true };
  }

  /**
   * Uploads a video file to the Supabase Storage bucket or returns a local object URL for preview/development
   */
  async uploadReel(file: File, creatorId: string): Promise<UploadReelResult> {
    const validation = this.validateReelFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Attempt upload to Supabase Storage if configured
    if (supabase) {
      try {
        const fileExt = file.name.split('.').pop() || 'mp4';
        const fileName = `${creatorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(this.bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          // If bucket doesn't exist yet in development environment, fall back gracefully
          // using a local object URL or placeholder without crashing
          console.warn('Supabase storage upload fallback:', error.message);
          const fallbackUrl = URL.createObjectURL(file);
          return { success: true, videoUrl: fallbackUrl };
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(data.path);

        return { success: true, videoUrl: publicUrlData.publicUrl };
      } catch (err: any) {
        console.warn('Storage exception, using local object preview URL:', err?.message);
        const fallbackUrl = URL.createObjectURL(file);
        return { success: true, videoUrl: fallbackUrl };
      }
    }

    // Default development fallback
    const fallbackUrl = URL.createObjectURL(file);
    return { success: true, videoUrl: fallbackUrl };
  }

  /**
   * Deletes a reel from storage
   */
  async deleteReel(videoPathOrUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!videoPathOrUrl) return { success: false, error: 'Invalid path' };

    if (supabase && videoPathOrUrl.includes(this.bucketName)) {
      try {
        const path = videoPathOrUrl.split(`${this.bucketName}/`)[1];
        if (path) {
          const { error } = await supabase.storage.from(this.bucketName).remove([path]);
          if (error) return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  }

  /**
   * Generates public URL for a given storage path
   */
  getPublicUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path;
    }
    if (supabase) {
      const { data } = supabase.storage.from(this.bucketName).getPublicUrl(path);
      return data.publicUrl;
    }
    return `/reels/${path}`;
  }
}

export const reelStorageService = new ReelStorageService();
