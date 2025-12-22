'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageIcon, X, Loader2 } from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing('coverImage', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        onChange(res[0].ufsUrl);
        setError(null);
      }
    },
    onUploadError: (err) => {
      setError(err.message || 'Upload failed. Please try again.');
    },
  });

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

    // Upload to UploadThing
    await startUpload([file]);
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
            unoptimized={value.startsWith('blob:')}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled || isUploading}
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
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
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
          disabled={disabled || isUploading}
          className="flex-1"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
