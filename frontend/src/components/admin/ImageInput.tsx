'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Images } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';

const MAX_SIDE = 800;

/** Rasmni brauzerda kvadrat qilib kesib, 800px WEBP ga kichraytiradi */
async function resize(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(MAX_SIDE, side);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Rasmni o\'qib bo\'lmadi'))), 'image/webp', 0.85)
  );
}

export function ImageInput({ value, onChange, gallery = [] }: { value: string; onChange: (v: string) => void; gallery?: string[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const blob = await resize(file);
      const form = new FormData();
      form.append('file', new File([blob], 'image.webp', { type: 'image/webp' }));
      const { url } = await adminApi<{ url: string }>('/api/admin/upload', { method: 'POST', body: form });
      onChange(url);
      toast.success('Rasm yuklandi');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-200">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-ink-400">
              <ImagePlus size={28} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-white/70">
              <Spinner className="h-6 w-6 text-gold-600" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="bg-gold-gradient inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-bold text-white"
            >
              <ImagePlus size={16} /> Yuklash
            </button>
            {gallery.length > 0 && (
              <button
                type="button"
                onClick={() => setShowGallery((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cream-200 px-3 py-2 text-[13px] font-bold"
              >
                <Images size={16} /> Galereya
              </button>
            )}
          </div>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="yoki rasm havolasi (https://...)"
            className="h-10 rounded-xl border border-cream-300 bg-white px-3 text-[13px] outline-none focus:border-gold-500"
          />
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = '';
        }}
      />
      {showGallery && (
        <div className="mt-3 grid max-h-56 grid-cols-5 gap-2 overflow-y-auto rounded-2xl bg-cream-100 p-2">
          {gallery.map((src) => (
            <button
              type="button"
              key={src}
              onClick={() => {
                onChange(src);
                setShowGallery(false);
              }}
              className={cn('aspect-square overflow-hidden rounded-xl ring-2', value === src ? 'ring-gold-500' : 'ring-transparent')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
