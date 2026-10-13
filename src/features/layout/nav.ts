import { Briefcase, BarChart3, Bell, Building2, Cog, DoorOpen, FileText, Gauge, Hammer, Home, Landmark, Leaf, Paintbrush, Trophy, Users, Wrench, type LucideIcon } from 'lucide-react';
import type { GameState } from '@/domain/schema';
import type { PageId } from '@/store/uiStore';
import { hasUnlock } from '@/game/progression';

export interface NavItem {
  id: PageId;
  label: string;
  icon: LucideIcon;
  locked?: (s: GameState) => string | null;
  badge?: (s: GameState) => { n: number; tone: 'danger' | 'warning' | 'primary' } | null;
}

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Übersicht', icon: Home },
  { id: 'building', label: 'Gebäude', icon: Building2 },
  {
    id: 'apartments',
    label: 'Wohnungen',
    icon: DoorOpen,
    badge: (s) => {
      const n = s.apartments.filter((a) => a.status === 'vacant_ready' && !a.listing).length + new Set(s.applicants.map((x) => x.apartmentId)).size;
      return n ? { n, tone: 'primary' } : null;
    },
  },
  { id: 'tenants', label: 'Mieter', icon: Users, badge: (s) => { const n = s.tenants.filter((t) => t.status === 'active' && t.satisfaction < 35).length; return n ? { n, tone: 'warning' } : null; } },
  { id: 'finance', label: 'Finanzen', icon: Landmark, badge: (s) => (s.cash < 0 ? { n: 1, tone: 'danger' } : null) },
  {
    id: 'repairs',
    label: 'Reparaturen',
    icon: Wrench,
    badge: (s) => {
      const open = s.defects.filter((d) => d.resolvedDay === null && d.discovered && !d.jobId);
      if (!open.length) return null;
      return { n: open.length, tone: open.some((d) => d.severity >= 3) ? 'danger' : 'warning' };
    },
  },
  { id: 'renovation', label: 'Renovierung', icon: Paintbrush },
  { id: 'contracts', label: 'Verträge', icon: FileText, badge: (s) => { const n = s.claims.filter((c) => (c.status === 'open' || c.status === 'partial') && c.dueDay < s.day - 7).length; return n ? { n, tone: 'warning' } : null; } },
  { id: 'energy', label: 'Energie & Betriebskosten', icon: Leaf, locked: (s) => (hasUnlock(s, 'energy') ? null : 'Wird in Phase 2 (Stabilisierung) freigeschaltet.') },
  { id: 'staff', label: 'Personal & Dienstleister', icon: Hammer },
  { id: 'events', label: 'Ereignisse & Nachrichten', icon: Bell, badge: (s) => { const d = s.decisions.length; const u = s.messages.filter((m) => !m.read).length; return d ? { n: d, tone: 'danger' } : u ? { n: u, tone: 'primary' } : null; } },
  { id: 'portfolio', label: 'Vermögen & Immobilien', icon: Briefcase, badge: (s) => (s.propertyMarket.length ? { n: s.propertyMarket.length, tone: 'primary' } : null) },
  { id: 'statistics', label: 'Statistiken', icon: BarChart3, locked: (s) => (s.history.length >= 1 ? null : 'Verfügbar nach dem ersten Monatsabschluss.') },
  { id: 'goals', label: 'Ziele & Erfolge', icon: Trophy },
  { id: 'settings', label: 'Einstellungen', icon: Cog },
];

export const PAGE_LABEL: Record<PageId, string> = Object.fromEntries(NAV.map((n) => [n.id, n.label])) as Record<PageId, string>;
export const GaugeIcon = Gauge;
