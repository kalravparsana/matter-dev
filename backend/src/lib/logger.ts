export function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const entry = { level, message, ...meta, ts: new Date().toISOString() };
  console.log(JSON.stringify(entry));
}
