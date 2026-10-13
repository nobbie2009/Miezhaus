import * as React from 'react';
import { Bell, CheckCheck, History, Inbox, ListChecks } from 'lucide-react';
import type { Message } from '@/domain/schema';
import { useDispatch, useGs } from '@/hooks/useGameState';
import { useUi } from '@/store/uiStore';
import { useGame } from '@/store/gameStore';
import { Badge, Button, Card, CardBody, CardHeader, DataTable, Tabs } from '@/components/ui';
import { formatDate } from '@/utils/date';
import { cn } from '@/utils/misc';
import { nullProvider, ollamaProvider } from '@/ai/textProvider';
import { GfxImage } from '@/features/graphics/Gfx';

const CAT_LABEL: Record<Message['category'], string> = { tenant: 'Mieter', building: 'Gebäude', finance: 'Finanzen', event: 'Ereignis', system: 'System', contractor: 'Handwerker', goal: 'Ziele' };
const SEV_TONE = { info: 'info', success: 'success', warning: 'warning', danger: 'danger' } as const;

export function EventsPage() {
  const s = useGs();
  const dispatch = useDispatch();
  const busy = useGame((x) => x.busy);
  const navigate = useUi((x) => x.navigate);
  const [tab, setTab] = React.useState<'inbox' | 'decisions' | 'log'>(s.decisions.length ? 'decisions' : 'inbox');
  const [cat, setCat] = React.useState<'all' | Message['category'] | 'unread'>('all');
  const msgs = [...s.messages].reverse().filter((m) => (cat === 'all' ? true : cat === 'unread' ? !m.read : m.category === cat));
  const [openId, setOpenId] = React.useState<string | null>(null);
  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'inbox', label: 'Nachrichten', badge: <Badge tone="primary">{s.messages.filter((m) => !m.read).length}</Badge> },
          { id: 'decisions', label: 'Entscheidungen', badge: s.decisions.length ? <Badge tone="danger">{s.decisions.length}</Badge> : undefined },
          { id: 'log', label: 'Ereignisprotokoll' },
        ]}
      />
      {tab === 'decisions' && (
        <div className="grid gap-4 lg:grid-cols-2">
          {!s.decisions.length && (
            <Card>
              <CardBody className="text-sm text-muted-fg">Keine offenen Entscheidungen.</CardBody>
            </Card>
          )}
          {s.decisions.map((d) => (
            <Card key={d.id}>
              <CardHeader title={d.title} subtitle={`Seit ${formatDate(d.day)} · Frist ${formatDate(d.expiresDay)}`} icon={<ListChecks size={16} />} />
              <CardBody className="space-y-3">
                <GfxImage id={`event.${d.eventId}`} fallbackId="event.generic" className="aspect-[12/5] w-full rounded-xl object-cover" />
                <p className="text-sm leading-relaxed">{d.text}</p>
                {d.options.map((o) => (
                  <button key={o.id} disabled={busy} onClick={() => dispatch({ type: 'resolveDecision', decisionId: d.id, optionId: o.id })} className="w-full rounded-xl border border-border p-3 text-left transition hover:border-primary hover:bg-primary/5">
                    <div className="flex justify-between text-sm font-semibold">
                      {o.label}
                      {o.id === d.defaultOptionId && <Badge>Standard</Badge>}
                    </div>
                    <div className="text-xs text-muted-fg">{o.description}</div>
                  </button>
                ))}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      {tab === 'inbox' && (
        <Card>
          <CardHeader
            title="Posteingang"
            icon={<Inbox size={16} />}
            actions={
              <>
                <select className="input h-8 w-40 text-xs" value={cat} onChange={(e) => setCat(e.target.value as typeof cat)} aria-label="Filter">
                  <option value="all">Alle</option>
                  <option value="unread">Ungelesen</option>
                  {Object.entries(CAT_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => dispatch({ type: 'markRead', messageId: 'all' })}>
                  <CheckCheck size={13} /> Alle gelesen
                </Button>
              </>
            }
          />
          <div className="divide-y divide-border">
            {msgs.length === 0 && <div className="p-6 text-center text-sm text-muted-fg">Keine Nachrichten.</div>}
            {msgs.slice(0, 150).map((m) => (
              <MessageRow
                key={m.id}
                m={m}
                open={openId === m.id}
                onToggle={() => {
                  setOpenId(openId === m.id ? null : m.id);
                  if (!m.read) dispatch({ type: 'markRead', messageId: m.id });
                }}
                onLink={() => m.link && navigate(m.link.page, m.link.id)}
              />
            ))}
          </div>
        </Card>
      )}
      {tab === 'log' && (
        <Card>
          <CardHeader title="Historie wichtiger Ereignisse" icon={<History size={16} />} />
          <DataTable
            rows={[...s.log].reverse()}
            rowKey={(l) => `${l.day}-${l.text}`}
            pageSize={30}
            columns={[
              { key: 'd', header: 'Datum', cell: (l) => <span className="num text-xs">{formatDate(l.day)}</span> },
              { key: 'k', header: 'Art', cell: (l) => <Badge>{l.kind}</Badge> },
              { key: 't', header: 'Ereignis', cell: (l) => <span className="text-sm">{l.text}</span> },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

/** Optional: lokale KI formuliert Mietertexte um – nur Anzeige, nie Spielzustand. */
const aiCache = new Map<string, string>();

function MessageRow({ m, open, onToggle, onLink }: { m: Message; open: boolean; onToggle: () => void; onLink: () => void }) {
  const { aiEnabled, aiUrl, aiModel } = useUi();
  const [text, setText] = React.useState(aiCache.get(m.id) ?? m.text);
  React.useEffect(() => {
    if (!open || !aiEnabled || m.category !== 'tenant' || aiCache.has(m.id)) return;
    const provider = aiEnabled ? ollamaProvider(aiUrl, aiModel) : nullProvider;
    let cancelled = false;
    void provider.rewrite({ kind: m.category, baseText: m.text, facts: {} }).then((r) => {
      if (r && !cancelled) {
        aiCache.set(m.id, r);
        setText(r);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, aiEnabled, aiUrl, aiModel, m]);
  return (
    <div className={cn('px-4 py-3', !m.read && 'bg-primary/[0.04]')}>
      <button onClick={onToggle} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', m.read ? 'bg-transparent' : 'bg-primary')} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-sm', !m.read && 'font-semibold')}>{m.title}</span>
            <Badge tone={SEV_TONE[m.severity]}>{CAT_LABEL[m.category]}</Badge>
          </div>
          {!open && <div className="truncate text-xs text-muted-fg">{m.text}</div>}
        </div>
        <span className="num shrink-0 text-xs text-muted-fg">{formatDate(m.day)}</span>
      </button>
      {open && (
        <div className="ml-5 mt-2 space-y-2">
          <p className="text-sm leading-relaxed">{text}</p>
          {m.link && (
            <Button size="sm" variant="outline" onClick={onLink}>
              <Bell size={13} /> Öffnen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
