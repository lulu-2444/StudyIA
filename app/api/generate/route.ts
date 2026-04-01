import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export async function POST(req: NextRequest) {
  try {
    const { tool, courseText, imageBase64, mimeType } = await req.json()
    const prompts: Record<string, string> = {
      quiz: `Génère un quiz de 6 questions (2 QCM, 2 vrai/faux, 2 ouvertes) à partir de ce cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"questions":[{"type":"qcm","question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."},{"type":"vf","question":"...","options":["Vrai","Faux"],"answer":0,"explanation":"..."},{"type":"open","question":"...","options":[],"answer":null,"explanation":"..."}]}`,
      flashcards: `Génère 8 flashcards à partir de ce cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"flashcards":[{"front":"...","back":"..."}]}`,
      podcast: `Crée un podcast entre Alex (enthousiaste) et Sam (rigoureux). Cours:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"title":"...","duration":"~8 min","lines":[{"speaker":"Alex","text":"..."}]}`,
      cours: `Enrichis ce cours pour un lycéen:\n${courseText?.slice(0,6000)}\nRéponds UNIQUEMENT en JSON sans markdown:\n{"title":"...","sections":[{"number":"01","title":"...","subtitle":"...","content":"...","callout":{"title":"...","text":"..."},"concepts":[{"label":"...","value":"..."}]}]}`,
    }
    const content: Anthropic.MessageParam['content'] = []
    if (imageBase64) content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } } as Anthropic.ImageBlockParam)
    content.push({ type: 'text', text: prompts[tool] })
    const response = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 3000, messages: [{ role: 'user', content }] })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()))
  } catch(e) {
    return NextResponse.json({ error: 'Erreur' }, { status: 500 })
  }
}
