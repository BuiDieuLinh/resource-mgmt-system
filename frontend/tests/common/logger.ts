const ts = () => new Date().toISOString().slice(11, 23);

export const log = {
  step: (msg: string) => console.log(`[${ts()}] 🔷 STEP  | ${msg}`),
  info: (msg: string) => console.log(`[${ts()}] ℹ️  INFO  | ${msg}`),
  ok: (msg: string) => console.log(`[${ts()}] ✅ OK    | ${msg}`),
  warn: (msg: string) => console.warn(`[${ts()}] ⚠️  WARN  | ${msg}`),
  error: (msg: string, err?: unknown) => {
    console.error(`[${ts()}] ❌ ERROR | ${msg}`);
    if (err) console.error(err);
  },
};
