export const QUALIFICATION_ALLOWLIST = [
  'year_1_6', 'year_7_12', 'maths', 'english',
  'science', 'arts', 'pe', 'esl', 'admin', 'early_childhood',
] as const

export function sanitiseText(input: string, maxLen: number): string {
  return input.trim().slice(0, maxLen)
}

export function validateDate(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

export function validatePayRate(value: unknown): number {
  const n = parseFloat(String(value))
  if (isNaN(n) || n <= 0) throw new Error('Invalid pay rate')
  return n
}

export function validateTime(t: string): boolean {
  return /^\d{2}:\d{2}$/.test(t)
}

export function validateQualifications(quals: string[]): boolean {
  return quals.every(q => (QUALIFICATION_ALLOWLIST as readonly string[]).includes(q))
}

export function validatePhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(phone.trim())
}
