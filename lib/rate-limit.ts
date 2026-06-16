// In-memory rate limiting. Per-serverless-instance — use Vercel KV/Upstash for multi-instance production.
const store = new Map<string, number>()

export function checkRateLimit(key: string, windowMs: number): boolean {
  const last = store.get(key) ?? 0
  const now = Date.now()
  if (now - last < windowMs) return false
  store.set(key, now)
  return true
}
