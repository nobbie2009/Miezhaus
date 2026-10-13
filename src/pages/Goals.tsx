import { Award, Calendar, Check, CheckCircle2, Circle, Crown, Hammer, Heart, Home, Key, Landmark, Leaf, Lock, Megaphone, Smile, Star, Sun, Target, Trophy, Wrench, type LucideIcon } from 'lucide-react';
import { useGs } from '@/hooks/useGameState';
import { Badge, Card, CardBody, CardHeader, Progress } from '@/components/ui';
import { ACHIEVEMENTS, GOAL_BY_ID } from '@/content/goals';
import { SCENARIO_BY_ID } from '@/content/scenarios';
import { PHASES, phaseRequirementsMet } from '@/game/progression';
import { computeScore, scoreGrade } from '@/game/score';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/misc';

const ICONS: Record<string, LucideIcon> = { key: Key, home: Home, calendar: Calendar, award: Award, heart: Heart, hammer: Hammer, leaf: Leaf, sun: Sun, landmark: Landmark, wrench: Wrench, smile: Smile, check: Check, star: Star, megaphone: Megaphone, crown: Crown };

export function GoalsPage() {
  const s = useGs();
  const score = computeScore(s);
  const sc = SCENARIO_BY_ID[s.scenarioId.split(':')[0]];
  const horizons: { id: 'short' | 'mid' | 'long'; label: string }[] = [
    { id: 'short', label: 'Kurzfristig' },
    { id: 'mid', label: 'Mittelfristig' },
    { id: 'long', label: 'Langfristig' },
  ];
  return (
    <div className="min-w-0 space-y-5">
      {sc && sc.winGoals && s.mode !== 'endless' && (
        <Card className="border-primary/40">
          <CardHeader title={`Szenario: ${sc.title}`} subtitle={sc.description} icon={<Target size={16} />} actions={s.endDay && <Badge tone="warning">Frist {formatDate(s.endDay)} · noch {Math.max(0, s.endDay - s.day)} Tage</Badge>} />
          <CardBody className="flex flex-wrap gap-2">
            {sc.winGoals.map((id) => {
              const g = s.goals.find((x) => x.id === id);
              return (
                <Badge key={id} tone={g?.status === 'done' ? 'success' : 'primary'}>
                  {g?.status === 'done' ? '✓ ' : ''}
                  {GOAL_BY_ID[id]?.title} ({Math.round((g?.progress ?? 0) * 100)} %)
                </Badge>
              );
            })}
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader title="Entwicklungsphasen" icon={<Trophy size={16} />} subtitle="Jede Phase schaltet neue Möglichkeiten frei" />
        <CardBody className="grid gap-3 md:grid-cols-5">
          {PHASES.map((p) => {
            const reached = s.phase >= p.phase;
            const next = s.phase + 1 === p.phase;
            return (
              <div key={p.phase} className={cn('rounded-xl border p-3', reached ? 'border-success/40 bg-success/5' : next ? 'border-primary/50' : 'border-border opacity-70')}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-fg">Phase {p.phase}</span>
                  {reached ? <CheckCircle2 size={15} className="text-success" /> : <Lock size={14} className="text-muted-fg" />}
                </div>
                <div className="mt-1 text-sm font-semibold">{p.title}</div>
                <p className="mt-1 text-xs text-muted-fg">{p.description}</p>
                {p.requirement.length > 0 && !reached && (
                  <ul className="mt-2 space-y-0.5 text-[11px]">
                    {p.requirement.map((r) => (
                      <li key={r} className="flex gap-1">
                        <Circle size={9} className="mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                    {next && <li className={cn('mt-1 font-semibold', phaseRequirementsMet(s, p.phase) ? 'text-success' : 'text-muted-fg')}>{phaseRequirementsMet(s, p.phase) ? 'Erfüllt – Aufstieg beim Monatsabschluss' : 'Noch nicht erfüllt'}</li>}
                  </ul>
                )}
                {p.unlockText.length > 0 && <div className="mt-2 text-[11px] text-primary">Schaltet frei: {p.unlockText.join(', ')}</div>}
              </div>
            );
          })}
        </CardBody>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Ziele" icon={<Target size={16} />} />
          <CardBody className="grid gap-5 md:grid-cols-3">
            {horizons.map((h) => (
              <div key={h.id}>
                <div className="label mb-2">{h.label}</div>
                <div className="space-y-3">
                  {s.goals
                    .filter((g) => GOAL_BY_ID[g.id]?.horizon === h.id)
                    .map((g) => {
                      const def = GOAL_BY_ID[g.id];
                      return (
                        <div key={g.id} className={cn('rounded-lg p-2', g.status === 'done' && 'bg-success/5')}>
                          <div className="flex items-start justify-between gap-2 text-sm">
                            <span className="font-medium">{def.title}</span>
                            {g.status === 'done' ? <CheckCircle2 size={15} className="shrink-0 text-success" /> : <span className="num text-xs text-muted-fg">{Math.round(g.progress * 100)} %</span>}
                          </div>
                          <p className="mb-1.5 text-xs text-muted-fg">{def.description}</p>
                          {g.status === 'done' ? <div className="text-[11px] text-success">Erreicht am {formatDate(g.completedDay!)}</div> : <Progress value={g.progress * 100} tone="primary" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Gesamtbewertung" subtitle={scoreGrade(score.total)} icon={<Star size={16} />} actions={<span className="num text-2xl font-extrabold">{score.total}</span>} />
          <CardBody className="space-y-2.5">
            {score.parts.map((p) => (
              <div key={p.key} title={p.hint}>
                <div className="mb-0.5 flex justify-between text-xs">
                  <span className="text-muted-fg">{p.label}</span>
                  <span className="num font-semibold">
                    {p.value}/{p.max}
                  </span>
                </div>
                <Progress value={(p.value / p.max) * 100} tone={p.value / p.max >= 0.7 ? 'success' : p.value / p.max >= 0.4 ? 'warning' : 'danger'} />
                <div className="mt-0.5 text-[10px] text-muted-fg">{p.hint}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader title="Erfolge" icon={<Award size={16} />} subtitle={`${s.achievements.length} von ${ACHIEVEMENTS.length} freigeschaltet`} />
        <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ACHIEVEMENTS.map((a) => {
            const got = s.achievements.find((x) => x.id === a.id);
            const Icon = ICONS[a.icon] ?? Star;
            return (
              <div key={a.id} className={cn('rounded-xl border p-3 text-center', got ? 'border-accent/50 bg-accent/5' : 'border-border opacity-50 grayscale')}>
                <Icon size={22} className={cn('mx-auto', got ? 'text-accent' : 'text-muted-fg')} />
                <div className="mt-1 text-xs font-semibold">{a.title}</div>
                <div className="text-[11px] text-muted-fg">{a.description}</div>
                {got && <div className="mt-1 text-[10px] text-accent">{formatDate(got.day)}</div>}
              </div>
            );
          })}
        </CardBody>
      </Card>
    </div>
  );
}
