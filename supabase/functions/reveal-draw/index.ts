import { makeHandler } from './handler.mjs';
const url = Deno.env.get('SUPABASE_URL');
const key = Deno.env.get('DRAW_SERVICE_KEY'); // sb_secret_..., exclusivamente servidor.
Deno.serve(makeHandler({
  allowedOrigin: Deno.env.get('ALLOWED_ORIGIN'),
  async lookup(drawId: string, hash: string) {
    if (!url || !key?.startsWith('sb_secret_')) throw Error('Not configured');
    const response = await fetch(`${url}/rest/v1/rpc/reveal_draw`, {
      method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ draw_id: drawId, token_hash: hash }),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw Error('Unavailable');
    return await response.json();
  },
}));
