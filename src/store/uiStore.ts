import { create } from 'zustand';

export type PageId = 'overview' | 'building' | 'apartments' | 'tenants' | 'finance' | 'repairs' | 'renovation' | 'contracts' | 'energy' | 'staff' | 'events' | 'statistics' | 'goals' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* Speicher nicht verfügbar */
  }
};

export function applyTheme(t: Theme) {
  const dark = t === 'dark' || (t === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', !!dark);
  try {
    localStorage.setItem('mt-theme', t);
  } catch {
    /* ignore */
  }
}

interface UiStore {
  page: PageId;
  focusId: string | null;
  theme: Theme;
  expert: boolean;
  favorites: PageId[];
  sidebarOpen: boolean;
  searchOpen: boolean;
  helpOpen: boolean;
  aiEnabled: boolean;
  aiUrl: string;
  aiModel: string;
  navigate: (p: PageId | string, focusId?: string | null) => void;
  setTheme: (t: Theme) => void;
  setExpert: (v: boolean) => void;
  toggleFavorite: (p: PageId) => void;
  setSidebar: (v: boolean) => void;
  setSearch: (v: boolean) => void;
  setHelp: (v: boolean) => void;
  setAi: (p: Partial<Pick<UiStore, 'aiEnabled' | 'aiUrl' | 'aiModel'>>) => void;
}

export const useUi = create<UiStore>((set, get) => ({
  page: 'overview',
  focusId: null,
  theme: read<Theme>('mt-theme-pref', 'system'),
  expert: read('mt-expert', false),
  favorites: read<PageId[]>('mt-favorites', ['apartments', 'repairs']),
  sidebarOpen: false,
  searchOpen: false,
  helpOpen: false,
  aiEnabled: read('mt-ai', false),
  aiUrl: read('mt-ai-url', 'http://localhost:11434'),
  aiModel: read('mt-ai-model', 'llama3.2'),
  navigate: (p, focusId = null) => {
    set({ page: p as PageId, focusId, sidebarOpen: false });
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0 });
  },
  setTheme: (t) => {
    write('mt-theme-pref', t);
    applyTheme(t);
    set({ theme: t });
  },
  setExpert: (v) => {
    write('mt-expert', v);
    set({ expert: v });
  },
  toggleFavorite: (p) => {
    const f = get().favorites.includes(p) ? get().favorites.filter((x) => x !== p) : [...get().favorites, p];
    write('mt-favorites', f);
    set({ favorites: f });
  },
  setSidebar: (v) => set({ sidebarOpen: v }),
  setSearch: (v) => set({ searchOpen: v }),
  setHelp: (v) => set({ helpOpen: v }),
  setAi: (p) => {
    if (p.aiEnabled !== undefined) write('mt-ai', p.aiEnabled);
    if (p.aiUrl !== undefined) write('mt-ai-url', p.aiUrl);
    if (p.aiModel !== undefined) write('mt-ai-model', p.aiModel);
    set(p);
  },
}));
