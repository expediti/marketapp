import { supabase } from '@/lib/supabase/client';

export interface ReelValidationResult {
  valid: boolean;
  error?: string;
}

export interface UploadReelResult {
  success: boolean;
  videoUrl?: string;
  storagePath?: string;
  fileSizeBytes?: number;
  mimeType?: string;
  error?: string;
}

export interface UploadImageResult {
  success: boolean;
  imageUrl?: string;
  storagePath?: string;
  error?: string;
}

export class ReelStorageService {
  private readonly reelsBucket = 'creator-reels';
  private readonly profilesBucket = 'creator-profiles';
  private readonly logosBucket = 'business-logos';

  // Strict 19 MB constraint as required
  public readonly maxReelSizeBytes = 19 * 1024 * 1024; // 19 MB
  public readonly maxImageSizeBytes = 5 * 1024 * 1024; // 5 MB

  private readonly allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

  /**
   * Validates video file format and 19 MB size constraint BEFORE upload
   */
  validateReelFile(file: File): ReelValidationResult {
    if (!file) {
      return { valid: false, error: 'No video file selected' };
    }

    if (!this.allowedVideoTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported video format. Please upload MP4, WebM, or MOV.',
      };
    }

    if (file.size > this.maxReelSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMB} MB) exceeds the strict 19 MB limit.`,
      };
    }

    return { valid: true };
  }

  /**
   * Validates image file format and 5 MB size constraint
   */
  validateImageFile(file: File): ReelValidationResult {
    if (!file) {
      return { valid: false, error: 'No image file selected' };
    }

    if (!this.allowedImageTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Unsupported image format. Please upload JPG, PNG, or WebP.',
      };
    }

    if (file.size > this.maxImageSizeBytes) {
      return {
        valid: false,
        error: 'Image file size exceeds the 5 MB limit.',
      };
    }

    return { valid: true };
  }

  /**
   * Uploads a video file to the Supabase Storage bucket 'creator-reels'
   */
  async uploadReel(
    file: File,
    creatorId: string,
    onProgress?: (percent: number) => void
  ): Promise<UploadReelResult> {
    const validation = this.validateReelFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    if (onProgress) onProgress(20);

    const fileExt = file.name.split('.').pop() || 'mp4';
    const storagePath = `${creatorId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    if (supabase) {
      try {
        if (onProgress) onProgress(50);
        const { data, error } = await supabase.storage
          .from(this.reelsBucket)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) {
          console.warn('Storage bucket fallback (development mode):', error.message);
          const fallbackUrl = URL.createObjectURL(file);
          if (onProgress) onProgress(100);
          return {
            success: true,
            videoUrl: fallbackUrl,
            storagePath,
            fileSizeBytes: file.size,
            mimeType: file.type,
          };
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.reelsBucket)
          .getPublicUrl(data.path);

        if (onProgress) onProgress(100);
        return {
          success: true,
          videoUrl: publicUrlData.publicUrl,
          storagePath: data.path,
          fileSizeBytes: file.size,
          mimeType: file.type,
        };
      } catch (err: any) {
        console.warn('Storage upload error, using local fallback:', err?.message);
        const fallbackUrl = URL.createObjectURL(file);
        if (onProgress) onProgress(100);
        return {
          success: true,
          videoUrl: fallbackUrl,
          storagePath,
          fileSizeBytes: file.size,
          mimeType: file.type,
        };
      }
    }

    if (onProgress) onProgress(100);
    const fallbackUrl = URL.createObjectURL(file);
    return {
      success: true,
      videoUrl: fallbackUrl,
      storagePath,
      fileSizeBytes: file.size,
      mimeType: file.type,
    };
  }

  /**
   * Uploads an avatar image to 'creator-profiles'
   */
  async uploadProfileImage(file: File, userId: string): Promise<UploadImageResult> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const storagePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(this.profilesBucket)
          .upload(storagePath, file, { upsert: true });

        if (error) {
          const fallbackUrl = URL.createObjectURL(file);
          return { success: true, imageUrl: fallbackUrl, storagePath };
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.profilesBucket)
          .getPublicUrl(data.path);

        return {
          success: true,
          imageUrl: publicUrlData.publicUrl,
          storagePath: data.path,
        };
      } catch (err: any) {
        const fallbackUrl = URL.createObjectURL(file);
        return { success: true, imageUrl: fallbackUrl, storagePath };
      }
    }

    const fallbackUrl = URL.createObjectURL(file);
    return { success: true, imageUrl: fallbackUrl, storagePath };
  }

  /**
   * Uploads a business logo to the Supabase Storage bucket 'business-logos'
   */
  async uploadBusinessLogo(
    file: File,
    businessId: string
  ): Promise<{ success: boolean; logoUrl?: string; storagePath?: string; error?: string }> {
    const validation = this.validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const storagePath = `${businessId}/logo-${Date.now()}.${fileExt}`;

    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(this.logosBucket)
          .upload(storagePath, file, { upsert: true });

        if (error) {
          const fallbackUrl = URL.createObjectURL(file);
          return { success: true, logoUrl: fallbackUrl, storagePath };
        }

        const { data: publicUrlData } = supabase.storage
          .from(this.logosBucket)
          .getPublicUrl(data.path);

        return {
          success: true,
          logoUrl: publicUrlData.publicUrl,
          storagePath: data.path,
        };
      } catch (err: any) {
        const fallbackUrl = URL.createObjectURL(file);
        return { success: true, logoUrl: fallbackUrl, storagePath };
      }
    }

    const fallbackUrl = URL.createObjectURL(file);
    return { success: true, logoUrl: fallbackUrl, storagePath };
  }

  /**
   * Deletes a reel from storage
   */
  async deleteReel(videoPathOrUrl: string): Promise<{ success: boolean; error?: string }> {
    if (!videoPathOrUrl) return { success: false, error: 'Invalid path' };

    if (supabase && videoPathOrUrl.includes(this.reelsBucket)) {
      try {
        const path = videoPathOrUrl.split(`${this.reelsBucket}/`)[1];
        if (path) {
          const { error } = await supabase.storage.from(this.reelsBucket).remove([path]);
          if (error) return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message };
      }
    }

    return { success: true };
  }

  getPublicUrl(path: string | null | undefined): string {
    if (!path || typeof path !== 'string' || !path.trim()) {
      return '';
    }
    const trimmed = path.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed;
    }
    if (supabase) {
      const { data } = supabase.storage.from(this.reelsBucket).getPublicUrl(trimmed);
      return data?.publicUrl || '';
    }
    return `/reels/${trimmed}`;
  }
}

export const reelStorageService = new ReelStorageService();
