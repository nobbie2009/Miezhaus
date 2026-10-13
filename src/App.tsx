import * as React from 'react';
import { useGame } from '@/store/gameStore';
import { applyTheme, useUi, type PageId } from '@/store/uiStore';
import { TooltipProvider } from '@/components/ui';
import { useGameLoop } from '@/hooks/useGameLoop';
import { Sidebar } from '@/features/layout/Sidebar';
import { TopBar } from '@/features/layout/TopBar';
import { DecisionModal, GameOverModal, HelpDialog, SearchPalette, Toasts, Tutorial } from '@/features/layout/Overlays';
import { NAV, PAGE_LABEL } from '@/features/layout/nav';
import { StartScreen } from '@/pages/Start';
import { OverviewPage } from '@/pages/Overview';
import { BuildingPage } from '@/pages/Building';
import { ApartmentsPage } from '@/pages/Apartments';
import { TenantsPage } from '@/pages/Tenants';
import { FinancePage } from '@/pages/Finance';
import { RepairsPage } from '@/pages/Repairs';
import { RenovationPage } from '@/pages/Renovation';
import { ContractsPage } from '@/pages/Contracts';
import { EnergyPage } from '@/pages/Energy';
import { StaffPage } from '@/pages/Staff';
import { EventsPage } from '@/pages/Events';
import { StatisticsPage } from '@/pages/Statistics';
import { GoalsPage } from '@/pages/Goals';
import { SettingsPage } from '@/pages/Settings';
import { useGfxStore } from '@/features/graphics/useGraphics';

const PAGES: Record<PageId, React.ComponentType> = {
  overview: OverviewPage,
  building: BuildingPage,
  apartments: ApartmentsPage,
  tenants: TenantsPage,
  finance: FinancePage,
  repairs: RepairsPage,
  renovation: RenovationPage,
  contracts: ContractsPage,
  energy: EnergyPage,
  staff: StaffPage,
  events: EventsPage,
  statistics: StatisticsPage,
  goals: GoalsPage,
  settings: SettingsPage,
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error)
      return (
        <div className="rounded-xl border border-danger/40 bg-danger/5 p-6 text-sm">
          <div className="font-semibold text-danger">Diese Ansicht konnte nicht angezeigt werden.</div>
          <p className="mt-1 text-muted-fg">{this.state.error.message}</p>
          <p className="mt-2 text-muted-fg">Ihr Spielstand ist nicht betroffen. Wechseln Sie die Ansicht oder laden Sie die Seite neu.</p>
        </div>
      );
    return this.props.children;
  }
}

function GameShell() {
  const page = useUi((x) => x.page);
  const s = useGame((x) => x.game)!;
  const navigate = useUi((x) => x.navigate);
  useGameLoop();
  const item = NAV.find((n) => n.id === page);
  const locked = item?.locked?.(s);
  React.useEffect(() => {
    if (locked) navigate('overview');
  }, [locked, navigate]);
  React.useEffect(() => {
    document.title = `${PAGE_LABEL[page] ?? ''} · ${s.building.name} · Mietshaus Tycoon`;
  }, [page, s.building.name]);
  const Page = PAGES[page] ?? OverviewPage;
  return (
    <TooltipProvider>
      <div className="flex min-h-full">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-5 sm:px-5" id="main">
            <h1 className="mb-4 text-xl font-bold tracking-tight">{PAGE_LABEL[page]}</h1>
            <ErrorBoundary resetKey={page}>
              <div key={page} className="animate-fade-in">
                <Page />
              </div>
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <DecisionModal />
      <GameOverModal />
      <SearchPalette />
      <HelpDialog />
      <Tutorial />
      <Toasts />
    </TooltipProvider>
  );
}

export default function App() {
  const hasGame = useGame((x) => !!x.game);
  const theme = useUi((x) => x.theme);
  React.useEffect(() => {
    void useGfxStore.getState().probe();
  }, []);
  React.useEffect(() => {
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const on = () => applyTheme('system');
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [theme]);
  return hasGame ? <GameShell /> : <StartScreen />;
}
