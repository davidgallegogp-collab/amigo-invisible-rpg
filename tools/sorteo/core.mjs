import { randomInt, randomBytes, randomUUID, createHash } from 'node:crypto';
export const tokenHash = token => createHash('sha256').update(token,'utf8').digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
export function validateParticipants(input) {
  if (!Array.isArray(input)||input.length<2||input.length>1000)throw Error('Se necesitan entre 2 y 1000 participantes.');
  const ids=new Set(),names=new Set();
  return input.map(p=>{
    if(!p||typeof p.id!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(p.id)||typeof p.name!=='string')throw Error('Participante no válido.');
    const name=p.name.normalize('NFC').trim(), normalized=name.toLocaleLowerCase('es');
    if(!name||name.length>100||/[\u0000-\u001f\u007f]/.test(name)||ids.has(p.id)||names.has(normalized))throw Error('Nombre o identificador duplicado/no válido.');
    if(p.spriteKey!=null&&(typeof p.spriteKey!=='string'||!/^[a-z0-9_-]{1,40}$/.test(p.spriteKey)))throw Error('spriteKey no válido.');
    ids.add(p.id);names.add(normalized);return {id:p.id,name,spriteKey:p.spriteKey??null};
  });
}
// Fisher–Yates uniforme con crypto.randomInt (sin sesgo modular), rechazando puntos fijos.
// Condicionar una permutación uniforme a no tener puntos fijos da un desarreglo uniforme.
export function derangement(n, int=randomInt) {
  if(!Number.isInteger(n)||n<2||n>1000)throw Error('Tamaño no válido.');
  while(true){const a=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=int(i+1);[a[i],a[j]]=[a[j],a[i]]}if(a.every((v,i)=>v!==i))return a}
}
export function prepareDraw(drawId,input) {
  if(!/^[A-Za-z0-9_-]{1,64}$/.test(drawId))throw Error('Identificador de sorteo no válido.');
  const participants=validateParticipants(input), permutation=derangement(participants.length),tokens=Object.create(null);
  const used=new Set();
  for(const p of participants){let token;do{token=newToken()}while(used.has(token));used.add(token);tokens[p.id]=token;}
  return {version:1,tokens,payload:{drawId,requestId:randomUUID(),participants,
    assignments:participants.map((p,i)=>({giver:p.id,recipient:participants[permutation[i]].id})),
    invitations:participants.map(p=>({participant:p.id,hash:tokenHash(tokens[p.id])}))}};
}
export function distribution(journal,baseUrl) {
  const url=new URL(baseUrl);if(url.protocol!=='https:'||url.hash||url.search)throw Error('GAME_URL debe ser HTTPS sin parámetros ni fragmento.');
  return journal.payload.participants.map(p=>({name:p.name,link:url.href+'#invitacion='+journal.tokens[p.id]}));
}
