/**
 * Optionale Schnittstelle für ein lokales Sprachmodell (z. B. Ollama), das Nachrichtentexte
 * sprachlich variiert. Das Modell erhält nur Text und Fakten und gibt nur Text zurück –
 * es kann keine Spielzustände, Beträge oder Verträge verändern. Ergebnisse werden nur
 * in der Anzeige verwendet, nie im Spielstand gespeichert.
 */
export interface TextRequest {
  kind: string;
  baseText: string;
  facts: Record<string, string | number>;
}

export interface TextProvider {
  id: string;
  label: string;
  available(): Promise<boolean>;
  rewrite(req: TextRequest): Promise<string | null>;
}

export const nullProvider: TextProvider = {
  id: 'none',
  label: 'Aus (Textvorlagen)',
  available: async () => true,
  rewrite: async () => null,
};

export function ollamaProvider(baseUrl: string, model: string): TextProvider {
  return {
    id: 'ollama',
    label: `Lokales Modell (${model})`,
    async available() {
      try {
        const r = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(1500) });
        return r.ok;
      } catch {
        return false;
      }
    },
    async rewrite(req) {
      try {
        const prompt = `Formuliere diese Nachricht eines Mieters an den Vermieter in natürlichem Deutsch um. Ändere keine Zahlen, Namen oder Fakten. Antworte nur mit dem Text.\n\nNachricht: ${req.baseText}`;
        const r = await fetch(`${baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, prompt, stream: false }),
          signal: AbortSignal.timeout(8000),
        });
        if (!r.ok) return null;
        const j = (await r.json()) as { response?: string };
        const text = j.response?.trim();
        // Schutz: Zahlen aus dem Original müssen erhalten bleiben, sonst wird verworfen
        const nums = req.baseText.match(/\d+[\d.,]*/g) ?? [];
        if (!text || nums.some((n) => !text.includes(n))) return null;
        return text.slice(0, 600);
      } catch {
        return null;
      }
    },
  };
}
