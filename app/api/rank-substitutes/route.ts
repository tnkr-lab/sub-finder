import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { haversineKm } from '@/lib/distance'
import { checkRateLimit } from '@/lib/rate-limit'
import type Anthropic from '@anthropic-ai/sdk'

const rankingTool: Anthropic.Tool = {
  name: 'rank_substitutes',
  description: 'Rank substitute teachers for an absence by match quality',
  input_schema: {
    type: 'object' as const,
    properties: {
      rankings: {
        type: 'array',
        items: {
          type: 'object',
          required: ['substitute_id', 'match_score', 'recommendation', 'flags', 'warnings'],
          properties: {
            substitute_id: { type: 'string' },
            match_score: { type: 'number', minimum: 0, maximum: 100 },
            recommendation: { type: 'string' },
            flags: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    required: ['rankings'],
  },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('org_admins')
    .select('id, org_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!checkRateLimit(`rank:${user.id}`, 10_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await request.json()
  const { absence } = body

  // Load org location
  const { data: org } = await supabase
    .from('organisations')
    .select('lat, lng')
    .eq('id', admin.org_id)
    .single()

  // Load pool
  const { data: poolMembers } = await supabase
    .from('pool_memberships')
    .select('substitutes(*)')
    .eq('org_id', admin.org_id)
    .eq('active', true)

  if (!poolMembers || poolMembers.length === 0) {
    return NextResponse.json({ rankings: [], message: 'No substitutes in pool' })
  }

  // Enrich with distance
  const poolWithDistances = poolMembers.map(pm => {
    const sub = pm.substitutes as unknown as Record<string, unknown>
    const dist = (org?.lat && org?.lng && sub.lat && sub.lng)
      ? haversineKm(
          Number(org.lat), Number(org.lng),
          Number(sub.lat), Number(sub.lng)
        )
      : null
    return { ...sub, distance_km: dist ? Math.round(dist * 10) / 10 : null }
  })

  const startMs = Date.now()
  let fallback = false
  let rankings: unknown[] = []
  let inputTokens = 0
  let outputTokens = 0

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: `You are a substitute matching engine for SubFill.
Rank substitutes by suitability. Consider: qualifications match, distance (closer = better),
day-of-week availability, cancellation history (lower = better), recency of last booking
(avoid over-relying on same person). Be specific in recommendations. Call rank_substitutes.`,
      messages: [{ role: 'user', content:
        `ABSENCE:\n${JSON.stringify(absence)}\n\nSUBSTITUTE POOL:\n${JSON.stringify(poolWithDistances)}`
      }],
      tools: [rankingTool],
      tool_choice: { type: 'any' },
    })

    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens

    const block = response.content.find(b => b.type === 'tool_use')
    if (!block || block.type !== 'tool_use') throw new Error('Claude did not call ranking tool')
    rankings = (block.input as { rankings: unknown[] }).rankings
  } catch {
    fallback = true
    rankings = []
  }

  // Log ranking attempt
  const latencyMs = Date.now() - startMs
  await supabase.from('ranking_logs').insert({
    org_id: admin.org_id,
    pool_size: poolWithDistances.length,
    latency_ms: latencyMs,
    fallback,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  })

  return NextResponse.json({ rankings, fallback })
}
