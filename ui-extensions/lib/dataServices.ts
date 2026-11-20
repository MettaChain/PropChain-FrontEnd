export type EncryptedDoc = { iv: number[]; data: ArrayBuffer; keyVersion: number; recipients: string[] };
export async function encryptDocument(doc: ArrayBuffer, key: CryptoKey, recipients: string[], keyVersion = 1): Promise<EncryptedDoc> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  return { iv: [...iv], data: await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, doc), keyVersion, recipients };
}
export async function decryptDocument(e: EncryptedDoc, wallet: string, keys: Record<number, CryptoKey>) {
  if (!e.recipients.map((r) => r.toLowerCase()).includes(wallet.toLowerCase())) throw new Error("access denied");
  if (!keys[e.keyVersion]) throw new Error(`missing key version ${e.keyVersion}`);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(e.iv) }, keys[e.keyVersion], e.data);
}

export type ActivityEvent = { type: "page_view" | "click" | "search"; target: string; at: number; userId?: string };
export function createTracker(send: (batch: ActivityEvent[]) => Promise<void>, opts = { batchSize: 10, optedOut: false }) {
  let queue: ActivityEvent[] = [];
  const flush = async () => { if (!queue.length) return; const b = queue; queue = []; await send(b); };
  return {
    track(e: ActivityEvent) {
      if (opts.optedOut) return;
      queue.push({ type: e.type, target: e.target.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "[email]"), at: e.at }); // drop userId, mask emails
      if (queue.length >= opts.batchSize) void flush();
    },
    optOut() { opts.optedOut = true; queue = []; }, flush,
  };
}

export type ExportConfig<T> = { columns: (keyof T)[]; filter?: (row: T) => boolean; title?: string };
const csvCell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function exportCsv<T extends Record<string, unknown>>(rows: T[], cfg: ExportConfig<T>, now = new Date()) {
  const data = cfg.filter ? rows.filter(cfg.filter) : rows;
  const meta = `# ${cfg.title ?? "Property listings"} | exported ${now.toISOString()} | ${data.length} rows`;
  return [meta, cfg.columns.join(","), ...data.map((r) => cfg.columns.map((c) => csvCell(r[c])).join(","))].join("\n");
}
export const exportPrintableHtml = <T extends Record<string, unknown>>(rows: T[], cfg: ExportConfig<T>) =>
  `<h1>${cfg.title ?? "Property listings"}</h1><table><tr>${cfg.columns.map((c) => `<th>${String(c)}</th>`).join("")}</tr>${rows
    .filter(cfg.filter ?? (() => true)).map((r) => `<tr>${cfg.columns.map((c) => `<td>${String(r[c] ?? "")}</td>`).join("")}</tr>`).join("")}</table>`;

export type PriceUpdate = { propertyId: string; price: number; at: number };
export function createPriceFeed(url: string, Ws: typeof WebSocket = WebSocket, throttleMs = 250, retryMs = 1000) {
  const subs = new Set<(u: PriceUpdate[]) => void>();
  let buffer: PriceUpdate[] = [], timer: ReturnType<typeof setTimeout> | null = null, closed = false;
  const emit = () => { timer = null; if (buffer.length && subs.size) { const b = buffer; buffer = []; subs.forEach((s) => s(b)); } };
  const connect = () => {
    const ws = new Ws(url);
    ws.onmessage = (m) => { buffer.push(JSON.parse(String(m.data))); timer ??= setTimeout(emit, throttleMs); };
    ws.onclose = () => { if (!closed) setTimeout(() => (current = connect()), retryMs); };
    return ws;
  };
  let current = connect();
  return {
    subscribe(cb: (u: PriceUpdate[]) => void) { subs.add(cb); return () => subs.delete(cb); },
    close() { closed = true; current.close(); },
  };
}
