'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, X, Upload, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (4MB max)
    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be less than 4MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // For now, we'll use a placeholder URL approach
      // In production, this would use UploadThing
      const formData = new FormData();
      formData.append('file', file);

      // Simulated upload - replace with actual UploadThing integration
      // const response = await fetch('/api/uploadthing', {
      //   method: 'POST',
      //   body: formData,
      // });

      // For development, use object URL
      const objectUrl = URL.createObjectURL(file);
      onChange(objectUrl);

      // TODO: Integrate with UploadThing
      // const { url } = await response.json();
      // onChange(url);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  // Manual URL input fallback
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative aspect-video rounded-lg overflow-hidden border">
          <Image
            src={value}
            alt="Cover image preview"
            fill
            className="object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label
          className={`
            flex flex-col items-center justify-center
            w-full aspect-video
            border-2 border-dashed rounded-lg
            cursor-pointer
            hover:bg-muted/50 transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center py-6">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground mb-1">
                  Click to upload or drag and drop
                </span>
                <span className="text-xs text-muted-foreground">
                  PNG, JPG, GIF up to 4MB
                </span>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />
        </label>
      )}

      {/* URL Input fallback */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Or enter URL:</span>
        <Input
          type="url"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={handleUrlChange}
          disabled={disabled}
          className="flex-1"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
