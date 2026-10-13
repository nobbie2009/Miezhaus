import * as React from 'react';
import { Copy, Download, FolderOpen, Trash2, Upload } from 'lucide-react';
import { useGame } from '@/store/gameStore';
import { Badge, Button, Confirm } from '@/components/ui';
import { deleteSave, duplicateSave, listSaves, loadSave, storeImported, type SaveMeta } from '@/persistence/db';
import { exportFileName, exportSave, importSave } from '@/persistence/saveFile';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export function downloadText(name: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Liste lokaler Spielstände mit Laden, Duplizieren, Löschen, Export und Import. */
export function SaveManager({ onLoaded }: { onLoaded?: () => void }) {
  const { loadGame, toast, game } = useGame();
  const [saves, setSaves] = React.useState<SaveMeta[] | null>(null);
  const [del, setDel] = React.useState<SaveMeta | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const refresh = React.useCallback(() => {
    listSaves()
      .then(setSaves)
      .catch((e) => {
        setErr(`Lokaler Speicher nicht verfügbar: ${(e as Error).message}. Nutzen Sie Export/Import.`);
        setSaves([]);
      });
  }, []);
  React.useEffect(refresh, [refresh, game?.saveId]);

  const load = async (id: string) => {
    const r = await loadSave(id);
    if (!r.ok || !r.state) {
      toast('error', `Spielstand beschädigt: ${r.errors.join('; ')}`);
      return;
    }
    r.warnings.forEach((w) => toast('warning', w));
    loadGame(r.state);
    toast('success', `Geladen: ${r.state.saveName}`);
    onLoaded?.();
  };

  const exportOne = async (id: string) => {
    const r = await loadSave(id);
    if (r.ok && r.state) downloadText(exportFileName(r.state), exportSave(r.state));
    else toast('error', 'Export fehlgeschlagen – Spielstand ist beschädigt.');
  };

  const onImport = async (f: File) => {
    const text = await f.text();
    const r = importSave(text);
    if (!r.ok || !r.state) {
      toast('error', `Import fehlgeschlagen: ${r.errors.join('; ')}`);
      return;
    }
    r.warnings.forEach((w) => toast('warning', w));
    try {
      await storeImported(r.state);
    } catch {
      /* Speicher evtl. nicht verfügbar – trotzdem laden */
    }
    loadGame(r.state);
    toast('success', `Importiert: ${r.state.saveName}`);
    refresh();
    onLoaded?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload size={14} /> Spielstand importieren
        </Button>
        {game && (
          <Button variant="outline" onClick={() => downloadText(exportFileName(game), exportSave(game))}>
            <Download size={14} /> Aktuelles Spiel exportieren
          </Button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          data-testid="import-input"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
      </div>
      {err && <p className="text-xs text-danger">{err}</p>}
      {saves === null ? (
        <p className="text-sm text-muted-fg">Lade Spielstände …</p>
      ) : saves.length === 0 ? (
        <p className="text-sm text-muted-fg">Noch keine gespeicherten Spiele.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {saves.map((sv) => (
            <li key={sv.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {sv.name}
                  {sv.kind === 'auto' && <Badge>Autosave</Badge>}
                  {sv.gameOver && <Badge tone={sv.gameOver === 'won' ? 'success' : 'danger'}>{sv.gameOver === 'won' ? 'gewonnen' : sv.gameOver === 'insolvency' ? 'insolvent' : 'verloren'}</Badge>}
                  {game?.saveId === sv.gameId && <Badge tone="primary">aktiv</Badge>}
                </div>
                <div className="text-xs text-muted-fg">
                  {sv.building} · Spieltag {formatDate(sv.day)} · {formatMoney(sv.cash, { decimals: false })} · Phase {sv.phase} · {sv.score} Pkt. · gespeichert {new Date(sv.updatedAt).toLocaleString('de-DE')}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" onClick={() => void load(sv.id)} aria-label={`${sv.name} laden`}>
                  <FolderOpen size={13} /> Laden
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void duplicateSave(sv.id).then(refresh)} aria-label="Duplizieren" title="Duplizieren">
                  <Copy size={13} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void exportOne(sv.id)} aria-label="Exportieren" title="Als JSON exportieren">
                  <Download size={13} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDel(sv)} aria-label="Löschen" title="Löschen">
                  <Trash2 size={13} className="text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Confirm open={!!del} onOpenChange={(v) => !v && setDel(null)} danger title="Spielstand löschen?" text={`„${del?.name}“ wird unwiderruflich aus diesem Browser gelöscht.`} confirmLabel="Löschen" onConfirm={() => del && void deleteSave(del.id).then(refresh)} />
    </div>
  );
}
