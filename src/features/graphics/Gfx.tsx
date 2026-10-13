import * as React from 'react';
import { useGfx, useGfxMap } from './useGraphics';
import { cn } from '@/utils/misc';

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Mieterporträt; Variante stabil aus der ID. Ohne Grafik: Initialen-Avatar. */
export function Portrait({ id, name, archetype, size = 36, className }: { id: string; name: string; archetype: string; size?: number; className?: string }) {
  const map = useGfxMap();
  const variants = [1, 2, 3].map((v) => map[`portrait.${archetype}_${v}`]).filter(Boolean) as string[];
  const url = variants.length ? variants[hash(id) % variants.length] : null;
  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2);
  const hue = hash(name) % 360;
  return url ? (
    <img src={url} alt="" width={size} height={size} className={cn('shrink-0 rounded-full object-cover ring-1 ring-border', className)} style={{ width: size, height: size }} />
  ) : (
    <span aria-hidden className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)} style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 45% 45%)` }}>
      {initials}
    </span>
  );
}

/** Bild einer Grafik aus dem Manifest – rendert nichts (bzw. fallback), wenn nicht vorhanden. */
export function GfxImage({ id, fallbackId, className, alt = '', fallback = null }: { id: string; fallbackId?: string; className?: string; alt?: string; fallback?: React.ReactNode }) {
  const url = useGfx(id);
  const fb = useGfx(fallbackId ?? '__none__');
  const src = url ?? fb;
  if (!src) return <>{fallback}</>;
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
