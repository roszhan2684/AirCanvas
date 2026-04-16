import Anthropic from '@anthropic-ai/sdk';
import type { IncomingMessage, ServerResponse } from 'node:http';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = IncomingMessage & { body?: any };

const DRAW_FNS = [
  'makeHeart','makeSun','makeRainbow','makeSmiley','makeSadFace',
  'makeHouse','makeTree','makeCloud','makeCat','makeSpiral',
  'makeZigzag','makeFlower','makeDiamond','makeWave','makeMountain',
  'makeFish','makeRocket','makeLightning','makePizza','makeStarOutline',
  'makeInfinity','makeSnowflake','makePlanet','makeUnicorn','makeLetterHi',
];

export default async function handler(req: Req, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end('{}'); return; }
  if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return; }

  const { prompt = '', canvasWidth = 900, canvasHeight = 600 } = req.body ?? {};

  if (!process.env.ANTHROPIC_API_KEY) {
    res.statusCode = 200;
    res.end(JSON.stringify({ fallback: true, reason: 'no_api_key' }));
    return;
  }

  const halfW = Math.floor((canvasWidth as number) / 2);
  const ch = canvasHeight as number;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: `You are an art director for a gesture drawing app. Given a text prompt, pick drawing functions and positions to build a scene. The drawing canvas is ${halfW}x${ch}px.

Available functions: ${DRAW_FNS.join(', ')}

Return ONLY raw JSON, no markdown fences:
{
  "pip_says": "one casual funny sentence about what you're drawing",
  "pip_emotion": "happy|excited|curious|love|thinking",
  "elements": [
    { "fn": "functionName", "cx": number, "cy": number, "size": number, "color": "#hex" }
  ]
}

Rules:
- cx: 50 to ${halfW - 50}
- cy: 80 to ${ch - 80}
- size: 40–110
- 2–5 elements, no overlaps (space centers by size*2+30)
- Colors must match the subject (dragons=green, fire=orange, sky=blue, water=blue)
- Be creative with positioning to tell a story`,
      messages: [{ role: 'user', content: `Draw: ${prompt}` }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
    // Strip any accidental markdown fences
    const clean = raw.replace(/^```[a-z]*\n?/,'').replace(/\n?```$/,'').trim();
    const data = JSON.parse(clean);
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (e) {
    console.error('draw api error:', e);
    res.statusCode = 200;
    res.end(JSON.stringify({ fallback: true, reason: 'api_error' }));
  }
}
