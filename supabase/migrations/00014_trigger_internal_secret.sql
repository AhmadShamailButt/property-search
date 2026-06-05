-- Switch the embed trigger to read the dedicated edge_fn_internal_secret
-- vault entry instead of edge_fn_service_role, matching the Edge Function's
-- INTERNAL_SECRET gate.

create or replace function tg_enqueue_property_embedding()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  v_url text;
  v_key text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'edge_fn_embed_url' limit 1;
  select decrypted_secret into v_key
    from vault.decrypted_secrets where name = 'edge_fn_internal_secret' limit 1;

  if v_url is null or v_key is null then
    return new;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-internal-secret', v_key
    ),
    body    := jsonb_build_object('property_id', new.id)
  );

  return new;
end;
$$;
