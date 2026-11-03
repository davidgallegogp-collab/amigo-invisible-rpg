begin;
create schema if not exists draw_private;
revoke all on schema draw_private from public, anon, authenticated, service_role;

create table draw_private.draws (
 id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
 request_id uuid not null unique,
 payload_digest text not null,
 locked boolean not null default false,
 created_at timestamptz not null default now()
);
create table draw_private.participants (
 draw_id text not null references draw_private.draws(id),
 id text not null check (id ~ '^[a-zA-Z0-9_-]{1,64}$'),
 name text not null check (length(btrim(name)) between 1 and 100),
 sprite_key text check (sprite_key ~ '^[a-z0-9_-]{1,40}$'),
 primary key (draw_id,id), unique(draw_id,name)
);
create table draw_private.assignments (
 draw_id text not null, giver text not null, recipient text not null,
 primary key(draw_id,giver), unique(draw_id,recipient), check(giver<>recipient),
 foreign key(draw_id,giver) references draw_private.participants(draw_id,id),
 foreign key(draw_id,recipient) references draw_private.participants(draw_id,id)
);
create table draw_private.invitations (
 draw_id text not null, participant text not null,
 token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),
 primary key(draw_id,participant),
 foreign key(draw_id,participant) references draw_private.participants(draw_id,id)
);
alter table draw_private.draws enable row level security;
alter table draw_private.participants enable row level security;
alter table draw_private.assignments enable row level security;
alter table draw_private.invitations enable row level security;
revoke all on all tables in schema draw_private from public, anon, authenticated, service_role;

create function draw_private.protect_locked() returns trigger
language plpgsql set search_path = '' as $$
declare d text;
begin
 if tg_table_name = 'draws' then
   if old.locked then raise exception 'Draw is locked'; end if;
 else
   if tg_op = 'INSERT' then d := new.draw_id; else d := old.draw_id; end if;
   if exists(select 1 from draw_private.draws where id=d and locked) then raise exception 'Draw is locked'; end if;
   if tg_op='UPDATE' and new.draw_id<>old.draw_id then raise exception 'Cannot move row'; end if;
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
create trigger locked_draw before update or delete on draw_private.draws for each row execute function draw_private.protect_locked();
create trigger locked_participant before insert or update or delete on draw_private.participants for each row execute function draw_private.protect_locked();
create trigger locked_assignment before insert or update or delete on draw_private.assignments for each row execute function draw_private.protect_locked();

-- Solo el administrador SQL puede confirmar. Inserción y bloqueo en una transacción.
create function draw_private.commit_draw(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare d text := payload->>'drawId'; digest text; existing draw_private.draws; n integer;
begin
 if d is null or d !~ '^[a-zA-Z0-9_-]{1,64}$' then raise exception 'Invalid draw'; end if;
 digest := encode(sha256(convert_to(payload::text,'UTF8')),'hex');
 perform pg_advisory_xact_lock(hashtextextended(d,0));
 select * into existing from draw_private.draws where id=d;
 if found then
   if existing.locked and existing.payload_digest=digest then return jsonb_build_object('id',d,'locked',true,'alreadyCommitted',true); end if;
   raise exception 'Draw already exists; cannot overwrite';
 end if;
 if jsonb_typeof(payload->'participants') is distinct from 'array' or jsonb_typeof(payload->'assignments') is distinct from 'array' or jsonb_typeof(payload->'invitations') is distinct from 'array' then raise exception 'Invalid payload'; end if;
 n := jsonb_array_length(payload->'participants');
 if n<2 or n>1000 or jsonb_array_length(payload->'assignments')<>n or jsonb_array_length(payload->'invitations')<>n then raise exception 'Invalid counts'; end if;
 if (select count(distinct lower(btrim(x->>'name'))) from jsonb_array_elements(payload->'participants') x)<>n then raise exception 'Duplicate names'; end if;
 insert into draw_private.draws(id,request_id,payload_digest) values(d,(payload->>'requestId')::uuid,digest);
 insert into draw_private.participants(draw_id,id,name,sprite_key)
 select d,x->>'id',x->>'name',x->>'spriteKey' from jsonb_array_elements(payload->'participants') x;
 insert into draw_private.assignments(draw_id,giver,recipient)
 select d,x->>'giver',x->>'recipient' from jsonb_array_elements(payload->'assignments') x;
 insert into draw_private.invitations(draw_id,participant,token_hash)
 select d,x->>'participant',x->>'hash' from jsonb_array_elements(payload->'invitations') x;
 -- PK, FK y UNIQUE, junto con los recuentos, garantizan cobertura uno-a-uno.
 update draw_private.draws set locked=true where id=d;
 return jsonb_build_object('id',d,'locked',true,'alreadyCommitted',false);
end $$;

create function draw_private.rotate_invitation(d text, p text, old_hash text, new_hash text) returns void
language plpgsql security definer set search_path = '' as $$
declare current_hash text;
begin
 perform pg_advisory_xact_lock(hashtextextended(d,0));
 if not exists(select 1 from draw_private.draws where id=d and locked) then raise exception 'Locked draw required'; end if;
 select token_hash into current_hash from draw_private.invitations where draw_id=d and participant=p for update;
 if not found then raise exception 'Unknown participant'; end if;
 if current_hash=new_hash then return; end if; -- Reintento tras respuesta perdida.
 if current_hash<>old_hash then raise exception 'Invitation changed; review local state'; end if;
 update draw_private.invitations set token_hash=new_hash where draw_id=d and participant=p;
end $$;

create function draw_private.lookup(d text, h text) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object('name',p.name,'spriteKey',p.sprite_key)
 from draw_private.invitations i
 join draw_private.draws d0 on d0.id=i.draw_id and d0.locked
 join draw_private.assignments a on a.draw_id=i.draw_id and a.giver=i.participant
 join draw_private.participants p on p.draw_id=a.draw_id and p.id=a.recipient
 where i.draw_id=d and i.token_hash=h;
$$;
-- Único RPC accesible al servidor. Es invoker; la función definer queda en esquema privado.
create function public.reveal_draw(draw_id text, token_hash text) returns jsonb
language sql stable security invoker set search_path = '' as $$
 select draw_private.lookup(draw_id,token_hash);
$$;
revoke all on all functions in schema draw_private from public, anon, authenticated, service_role;
revoke all on function public.reveal_draw(text,text) from public, anon, authenticated, service_role;
grant usage on schema draw_private to service_role;
grant execute on function draw_private.lookup(text,text) to service_role;
grant execute on function public.reveal_draw(text,text) to service_role;
commit;
