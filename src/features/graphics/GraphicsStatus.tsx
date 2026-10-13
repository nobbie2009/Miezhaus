import * as React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { GRAPHICS } from '@/content/graphics';
import { Badge, Progress, Tabs } from '@/components/ui';
import { useGfxStore } from './useGraphics';
import { cn } from '@/utils/misc';

/** Übersicht, welche Grafikdateien gefunden wurden – hilfreich beim Einpflegen eigener Texturen. */
export function GraphicsStatus() {
  const { urls, ready } = useGfxStore();
  const [filter, setFilter] = React.useState<'missing' | 'all' | 'found'>('missing');
  const found = GRAPHICS.filter((g) => urls[g.id]).length;
  const groups = [...new Set(GRAPHICS.map((g) => g.group))];
  if (!ready) return <p className="text-sm text-muted-fg">Prüfe Grafikdateien …</p>;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">
          <strong>{found}</strong> von {GRAPHICS.length} Grafiken vorhanden
        </span>
        <Progress value={(found / GRAPHICS.length) * 100} tone="primary" className="w-40" />
        <Tabs className="ml-auto" value={filter} onChange={setFilter} items={[{ id: 'missing', label: 'Fehlend' }, { id: 'found', label: 'Vorhanden' }, { id: 'all', label: 'Alle' }]} />
      </div>
      <p className="text-xs text-muted-fg">
        Dateien nach <code>public/gfx/&lt;Pfad&gt;.webp|png|svg</code> legen (im Docker-Image: <code>/usr/share/nginx/html/gfx/</code>) und die Seite neu laden. Fehlende Grafiken werden durch die eingebauten Zeichnungen ersetzt. Details: <code>docs/GRAFIKEN.md</code>.
      </p>
      <div className="scroll-thin max-h-[420px] space-y-4 overflow-y-auto pr-1">
        {groups.map((grp) => {
          const items = GRAPHICS.filter((g) => g.group === grp && (filter === 'all' || (filter === 'found') === !!urls[g.id]));
          if (!items.length) return null;
          return (
            <div key={grp}>
              <div className="label mb-1">{grp}</div>
              <ul className="space-y-1">
                {items.map((g) => (
                  <li key={g.id} className="flex items-center gap-2 text-xs">
                    {urls[g.id] ? <CheckCircle2 size={13} className="shrink-0 text-success" /> : <Circle size={13} className="shrink-0 text-muted-fg" />}
                    <code className={cn('shrink-0', urls[g.id] ? 'text-success' : '')}>{g.path}</code>
                    <span className="truncate text-muted-fg">{g.label}</span>
                    <span className="ml-auto shrink-0 text-muted-fg">
                      {g.size[0]}×{g.size[1]}
                    </span>
                    <Badge tone={g.priority === 1 ? 'danger' : g.priority === 2 ? 'warning' : 'neutral'}>P{g.priority}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
