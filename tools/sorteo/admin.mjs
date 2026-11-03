#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareDraw,distribution,newToken,tokenHash} from './core.mjs';
process.umask(0o077);
const [command,directory,arg,extra]=process.argv.slice(2);
const root=fs.realpathSync(fileURLToPath(new URL('../..',import.meta.url)));
function save(file,value,exclusive=false){
 const data=JSON.stringify(value,null,2)+'\n';
 if(exclusive){const fd=fs.openSync(file,'wx',0o600);try{fs.writeFileSync(fd,data);fs.fsyncSync(fd)}finally{fs.closeSync(fd)}}
 else {const tmp=file+'.tmp';save(tmp,value,true);fs.renameSync(tmp,file)}
 const fd=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
}
let sql,lock;
try{
 if(!directory||!['prepare','commit','status','export','rotate'].includes(command))throw Error('Uso: node admin.mjs prepare|commit|status|export|rotate DIRECTORIO_PRIVADO [argumentos]');
 fs.mkdirSync(directory,{recursive:true,mode:0o700});const dir=fs.realpathSync(directory);
 if(dir===root||dir.startsWith(root+path.sep))throw Error('El directorio privado debe estar fuera del repositorio.');
 fs.chmodSync(dir,0o700);
 const lockPath=path.join(dir,'.admin.lock');lock=fs.openSync(lockPath,'wx',0o600);
 const file=path.join(dir,'journal.json');
 try{
  if(command==='prepare'){
   if(!arg||!extra)throw Error('prepare DIRECTORIO DRAW_ID LISTA.json');
   save(file,prepareDraw(arg,JSON.parse(fs.readFileSync(extra,'utf8'))),true);
   console.log('Preparación guardada. No confirmada todavía. Conserve una copia privada del directorio.');
  }else{
   const journal=JSON.parse(fs.readFileSync(file,'utf8'));
   if(!process.env.DATABASE_URL)throw Error('Configure DATABASE_URL en el entorno privado.');
   const postgres=(await import('postgres')).default;
   sql=postgres(process.env.DATABASE_URL,{max:1,ssl:'verify-full',connect_timeout:10,prepare:false,debug:false});
   const d=journal.payload.drawId;
   async function verify(){
    const rows=await sql`select locked, payload_digest=encode(sha256(convert_to(${sql.json(journal.payload)}::jsonb::text,'UTF8')),'hex') as matches from draw_private.draws where id=${d}`;
    if(!rows[0]?.locked||!rows[0].matches)throw Error('No coincide el sorteo bloqueado. No se exportarán enlaces.');
    const inv=await sql`select participant,token_hash from draw_private.invitations where draw_id=${d}`;
    if(inv.length!==journal.payload.participants.length||inv.some(x=>tokenHash(journal.tokens[x.participant]||'')!==x.token_hash))throw Error('Hay una rotación pendiente o tokens que no coinciden.');
   }
   if(command==='commit'){
    await sql`select draw_private.commit_draw(${sql.json(journal.payload)})`;
    await verify();console.log('Sorteo confirmado y bloqueado. Un reintento con este mismo archivo no lo modifica.');
   }else if(command==='rotate'){
    if(!journal.payload.participants.some(p=>p.id===arg)||!extra||!/^[A-Za-z0-9_-]{1,64}$/.test(extra))throw Error('rotate DIRECTORIO PARTICIPANTE_ID OPERACION_UNICA');
    const operation=path.join(dir,'rotation-'+extra+'.json');let rotation;
    if(fs.existsSync(operation))rotation=JSON.parse(fs.readFileSync(operation,'utf8'));
    else {rotation={drawId:d,participant:arg,oldHash:tokenHash(journal.tokens[arg]),token:newToken()};save(operation,rotation,true)}
    if(rotation.drawId!==d||rotation.participant!==arg)throw Error('Operación ya usada para otra invitación.');
    await sql`select draw_private.rotate_invitation(${d},${arg},${rotation.oldHash},${tokenHash(rotation.token)})`;
    journal.tokens[arg]=rotation.token;save(file,journal);await verify();
    console.log('Invitación anterior revocada. Exporte y distribuya únicamente el enlace nuevo.');
   }else{
    await verify();
    if(command==='export'){
     if(!process.env.GAME_URL)throw Error('Configure GAME_URL.');
     save(path.join(dir,'invitaciones.json'),distribution(journal,process.env.GAME_URL));
     console.log('invitaciones.json generado: nombres y enlaces, sin destinatarios.');
    }else console.log('Sorteo bloqueado y copia local verificada.');
   }
  }
 }finally{fs.closeSync(lock);lock=undefined;fs.unlinkSync(lockPath)}
}catch(error){
 // No imprimir errores del driver: pueden incluir consultas o credenciales.
 console.error('Operación no completada. Uso: prepare DIRECTORIO DRAW_ID LISTA.json; commit|status|export DIRECTORIO; rotate DIRECTORIO PARTICIPANTE_ID OPERACION_UNICA. Revise conexión, permisos y copia privada. Reintente con el mismo directorio. No se imprimen errores internos para proteger los datos.');
 process.exitCode=1;
}finally{if(sql)await sql.end({timeout:5})}
