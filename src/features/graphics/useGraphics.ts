import { create } from 'zustand';
import { GFX_BASE, GFX_EXTENSIONS, GRAPHICS } from '@/content/graphics';

/**
 * Prüft beim Start einmalig, welche Grafikdateien vorhanden sind.
 * Fehlende Dateien → null → die Ansicht zeichnet die eingebaute Vektor-Grafik.
 */
interface GfxStore {
  ready: boolean;
  urls: Record<string, string | null>;
  probe: () => Promise<void>;
}

function tryLoad(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

let started = false;

export const useGfxStore = create<GfxStore>((set) => ({
  ready: false,
  urls: {},
  probe: async () => {
    if (started || typeof window === 'undefined' || typeof Image === 'undefined') return;
    started = true;
    const urls: Record<string, string | null> = {};
    await Promise.all(
      GRAPHICS.map(async (a) => {
        for (const ext of GFX_EXTENSIONS) {
          const url = `${GFX_BASE}${a.path}.${ext}`;
          if (await tryLoad(url)) {
            urls[a.id] = url;
            return;
          }
        }
        urls[a.id] = null;
      }),
    );
    set({ urls, ready: true });
  },
}));

/** URL einer Grafik oder null, falls (noch) nicht vorhanden. */
export const useGfx = (id: string): string | null => useGfxStore((s) => s.urls[id] ?? null);
export const useGfxMap = () => useGfxStore((s) => s.urls);
