import { NextRequest, NextResponse } from 'next/server'

const PROMPTS: Record<string, string> = {
  okrs: `You are an elite marketing strategist. What are exactly 3 measurable marketing OKRs to grow usage of {product} among {segment} with the goal to {objective}?
Format your response as:
**OKR 1: [Title]**
Objective: [clear objective statement]
Key Results:
- KR1: [specific measurable result with number/percentage]
- KR2: [specific measurable result with number/percentage]
- KR3: [specific measurable result with number/percentage]
**OKR 2: [Title]**
[same format]
**OKR 3: [Title]**
[same format]
Be extremely specific with metrics. No generic advice.`,

  strengths: `You are an elite product strategist. What product strengths of {product} matter most to {segment}?
List exactly 5 strengths. For each:
**[Strength Name]**
[2-3 sentence explanation of why this resonates with {segment}]
Be specific to this segment. No generic product features.`,

  weaknesses: `You are a brutally honest market analyst. What would {segment} be genuinely concerned about or dislike regarding {product}?
List exactly 5 weaknesses or concerns. For each:
**[Concern Name]**
[2-3 sentence explanation of why this is a real friction point for {segment}]
Be honest and specific. This is internal strategy, not marketing copy.`,

  opportunities: `You are a growth strategist. What product and brand opportunities can {product} unlock by targeting {segment} to {objective}?
List exactly 5 opportunities. For each:
**[Opportunity Name]**
[2-3 sentences on how to capture this opportunity and why it's specific to {segment}]
Be concrete and actionable.`,

  threats: `You are a risk analyst. What are the real threats that could prevent {segment} from adopting or staying loyal to {product}?
List exactly 5 threats. For each:
**[Threat Name]**
[2-3 sentences explaining the risk and its likelihood for {segment}]
Include competitive threats, behavioral barriers, and market forces.`,

  positioning: `You are a brand strategist. How should {product} be positioned to resonate deeply with {segment} in order to {objective}?
Structure your response as:
**Positioning Statement**
[One powerful positioning statement for this segment]
**Core Message**
[The single most important message for {segment}]
**Tone & Voice**
[How to communicate — 3-4 specific tone descriptors]
**Proof Points**
[3 specific proof points that will convince {segment}]
**What to Avoid**
[2-3 things that will turn {segment} off]`,

  persona: `You are a consumer insights researcher. Write a vivid, realistic buyer persona for a typical {segment} customer of {product}.
Structure exactly as:
**Name & Profile**
[Full name, age, job title, location, income range]
**A Day in Their Life**
[2-3 sentences painting their daily reality]
**Goals**
[3 specific goals relevant to {product}]
**Frustrations**
[3 specific frustrations that {product} could solve]
**Relationship with {product}**
[How they discovered it, how they use it, what they tell friends]
**Winning Quote**
[One sentence this person would say about {product} if they loved it]`,

  investment: `You are a venture strategist. Why is {segment} strategically valuable from a growth and investment perspective for {product}?
Structure as:
**Market Size**
[Estimated size and growth rate of this segment]
**Strategic Value**
[3 reasons why capturing {segment} creates compounding business value]
**Revenue Potential**
[LTV, conversion potential, and monetization angle]
**Competitive Moat**
[How winning {segment} creates defensibility]
**Investor Narrative**
[2-3 sentences you would say to an investor about this segment opportunity]`,

  channels: `You are a performance marketing expert. How should {product} reach and activate {segment} to {objective}?
List exactly 6 channels. For each:
**[Channel Name]**
Tactic: [specific activation tactic]
Message: [the exact angle/hook to use with {segment}]
Format: [content format or ad type]
Priority: [High / Medium]`,
}

const SYSTEM = `You are an elite marketing strategist and consumer insights expert with 20 years of experience advising Fortune 500 companies and venture-backed startups. Your insights are sharp, specific, and immediately actionable. You write in clear structured markdown. You never give generic advice — every insight is tailored to the exact product and segment combination. You write like you are being paid $1,000/hour.`

function computeConfidence(content: string, product: string, segment: string): number {
  let score = 70
  const lower = content.toLowerCase()
  const prod = product.toLowerCase()
  const seg = segment.toLowerCase()
  if (lower.includes(prod)) score += 8
  if (lower.includes(seg)) score += 8
  if (content.includes('**')) score += 5
  if (content.length > 600) score += 5
  if (content.includes('%') || content.includes('$')) score += 4
  return Math.min(score, 98)
}

export async function POST(req: NextRequest) {
  try {
    const { product, objective, segment, promptType, customPrompt } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured.' }, { status: 500 })

    let prompt: string
    if (promptType === 'custom') {
      if (!customPrompt) return NextResponse.json({ error: 'No question provided.' }, { status: 400 })
      prompt = `Context: Product = "${product}", Segment = "${segment}", Objective = "${objective}".\n\nQuestion: ${customPrompt}\n\nAnswer as an elite marketing strategist. Be specific, sharp, and actionable.`
    } else {
      const template = PROMPTS[promptType]
      if (!template) return NextResponse.json({ error: 'Invalid prompt type.' }, { status: 400 })
      prompt = template
        .replace(/{product}/g, product)
        .replace(/{segment}/g, segment)
        .replace(/{objective}/g, objective)
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        temperature: 0.68,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || 'OpenAI error' }, { status: 400 })
    }

    const data = await res.json()
    const content = data.choices[0]?.message?.content || ''
    const confidence = computeConfidence(content, product, segment)

    return NextResponse.json({ content, confidence, promptType, segment })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}