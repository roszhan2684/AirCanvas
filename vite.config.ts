import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── Local dev handler for /api/draw ────────────────────────────────────────────
// Mirrors the logic in api/draw.ts so the prompt box works during `npm run dev`.
const DRAW_FNS = [
  'makeHeart','makeSun','makeRainbow','makeSmiley','makeSadFace',
  'makeHouse','makeTree','makeCloud','makeCat','makeSpiral',
  'makeZigzag','makeFlower','makeDiamond','makeWave','makeMountain',
  'makeFish','makeRocket','makeLightning','makePizza','makeStarOutline',
  'makeInfinity','makeSnowflake','makePlanet','makeUnicorn','makeLetterHi',
];

function devApiPlugin() {
  return {
    name: 'dev-api-draw',
    configureServer(server: { middlewares: { use: (path: string, fn: (req: IncomingMessage, res: ServerResponse) => void) => void } }) {
      server.middlewares.use('/api/draw', (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        if (req.method === 'OPTIONS') { res.statusCode = 200; res.end('{}'); return; }
        if (req.method !== 'POST')    { res.statusCode = 405; res.end('{}'); return; }

        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', async () => {
          let body: Record<string, unknown> = {};
          try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { /* ignore */ }

          const apiKey = process.env.ANTHROPIC_API_KEY;
          if (!apiKey) {
            res.statusCode = 200;
            res.end(JSON.stringify({ fallback: true, reason: 'no_api_key' }));
            return;
          }

          const { prompt = '', canvasWidth = 900, canvasHeight = 600 } = body;
          const halfW = Math.floor((canvasWidth as number) / 2);
          const ch = canvasHeight as number;

          try {
            // Dynamic import keeps @anthropic-ai/sdk out of the browser bundle
            const { default: Anthropic } = await import('@anthropic-ai/sdk') as { default: typeof import('@anthropic-ai/sdk').default };
            const client = new Anthropic({ apiKey });

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
- Colors must match the subject`,
              messages: [{ role: 'user', content: `Draw: ${prompt}` }],
            });

            const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
            const clean = raw.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
            const data = JSON.parse(clean);
            res.statusCode = 200;
            res.end(JSON.stringify(data));
          } catch (e) {
            console.error('[dev api/draw]', e);
            res.statusCode = 200;
            res.end(JSON.stringify({ fallback: true, reason: 'api_error' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  resolve: {
    alias: {
      '@mediapipe/hands': path.resolve(__dirname, 'src/mediapipe-hands-shim.ts'),
    },
  },
})
