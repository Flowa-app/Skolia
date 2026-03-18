import { NextRequest, NextResponse } from 'next/server';
import { buildCorrectionSystemPrompt, buildCorrectionUserMessage, MOCK_CORRECTION } from '@/lib/prompts';
import { CorrectionParams } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const params: CorrectionParams = await req.json();

    const devMode = process.env.DEV_MODE === 'true';

    if (devMode) {
      await new Promise(r => setTimeout(r, 1500)); // simulate delay
      return NextResponse.json({ success: true, result: MOCK_CORRECTION });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = buildCorrectionSystemPrompt(params);
    const userText = buildCorrectionUserMessage(params);

    type ValidImageMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    type ImageContent = { type: 'image'; source: { type: 'base64'; media_type: ValidImageMime; data: string } };
    type DocumentContent = { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } };
    type TextContent = { type: 'text'; text: string };
    type MessageContent = ImageContent | DocumentContent | TextContent;
    const content: MessageContent[] = [];

    if (params.imageBase64 && params.imageMimeType) {
      if (params.imageMimeType === 'application/pdf') {
        content.push({
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: params.imageBase64 }
        });
      } else {
        const validMimes: ValidImageMime[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const mimeType = validMimes.includes(params.imageMimeType as ValidImageMime)
          ? (params.imageMimeType as ValidImageMime)
          : 'image/jpeg';
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: params.imageBase64 }
        });
      }
    }
    content.push({ type: 'text', text: userText });

    const abortController = new AbortController();
    const serverTimeout = setTimeout(() => abortController.abort(), 25_000);

    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: content as Parameters<typeof client.messages.create>[0]['messages'][0]['content'] }],
      },
      { signal: abortController.signal },
    );
    clearTimeout(serverTimeout);

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (Claude may wrap in ```json blocks)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, result });

  } catch (error) {
    console.error('Correction error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la correction' },
      { status: 500 }
    );
  }
}
