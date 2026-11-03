// Compartido por Deno y las pruebas Node. No registra cuerpos, tokens ni resultados.
export function makeHandler({ allowedOrigin, lookup, cryptoImpl = globalThis.crypto }) {
  return async request => {
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'Referrer-Policy': 'no-referrer' };
    const reply = (status, body) => new Response(JSON.stringify(body), {status,headers});
    if (!allowedOrigin || request.headers.get('origin') !== allowedOrigin) return reply(403,{error:'forbidden'});
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'content-type','Access-Control-Max-Age':'600'}});
    if (request.method !== 'POST') return reply(405,{error:'method'});
    if (!(request.headers.get('content-type') || '').startsWith('application/json')) return reply(400,{error:'invalid_request'});
    try {
      if (!request.body) return reply(400,{error:'invalid_request'});
      const reader = request.body.getReader(); let size=0, chunks=[];
      while (true) { const {value,done}=await reader.read(); if(done)break; size+=value.byteLength; if(size>2048){await reader.cancel();return reply(413,{error:'invalid_request'})} chunks.push(value); }
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
      let input;try{input=JSON.parse(new TextDecoder().decode(bytes))}catch{return reply(400,{error:'invalid_request'})}
      if (!input || typeof input.token!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(input.token) || typeof input.drawId!=='string' || !/^[A-Za-z0-9_-]{1,64}$/.test(input.drawId)) return reply(404,{error:'invalid_invitation'});
      const digest=await cryptoImpl.subtle.digest('SHA-256',new TextEncoder().encode(input.token));
      const hash=Array.from(new Uint8Array(digest),n=>n.toString(16).padStart(2,'0')).join('');
      const result=await lookup(input.drawId,hash);
      if (!result) return reply(404,{error:'invalid_invitation'});
      // Lista blanca de campos: nunca reenviar una respuesta administrativa completa.
      if(typeof result.name!=='string'||!result.name||result.name.length>100)throw Error('Malformed result');
      return reply(200,{recipient:{name:result.name,spriteKey:typeof result.spriteKey==='string'&&/^[a-z0-9_-]{1,40}$/.test(result.spriteKey)?result.spriteKey:null}});
    } catch { return reply(503,{error:'unavailable'}); }
  };
}
