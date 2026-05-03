-- ============================================================
-- Conversations + Messages RLS
-- Enables row-level security and adds explicit policies so:
--   * A user can read conversations they participate in (searcher OR owner)
--   * Only the searcher can create a conversation
--   * Either participant can update last_message_at on their own row
--   * A user can read messages in conversations they participate in
--   * A user can insert their own message into conversations they participate in
-- A trigger keeps conversations.last_message_at fresh on every new message.
-- All operations are idempotent.
-- ============================================================

alter table conversations enable row level security;
alter table messages       enable row level security;

-- ----------------------------------------------------------------
-- Conversations
-- ----------------------------------------------------------------
drop policy if exists "Participants read conversations" on conversations;
create policy "Participants read conversations"
  on conversations for select
  to authenticated
  using (auth.uid() = searcher_id or auth.uid() = owner_id);

drop policy if exists "Searcher creates conversations" on conversations;
create policy "Searcher creates conversations"
  on conversations for insert
  to authenticated
  with check (auth.uid() = searcher_id);

drop policy if exists "Participants update conversations" on conversations;
create policy "Participants update conversations"
  on conversations for update
  to authenticated
  using (auth.uid() = searcher_id or auth.uid() = owner_id)
  with check (auth.uid() = searcher_id or auth.uid() = owner_id);

-- ----------------------------------------------------------------
-- Messages
-- ----------------------------------------------------------------
drop policy if exists "Participants read messages" on messages;
create policy "Participants read messages"
  on messages for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.searcher_id or auth.uid() = c.owner_id)
    )
  );

drop policy if exists "Participants send messages" on messages;
create policy "Participants send messages"
  on messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (auth.uid() = c.searcher_id or auth.uid() = c.owner_id)
    )
  );

-- ----------------------------------------------------------------
-- Trigger: bump conversations.last_message_at on insert
-- ----------------------------------------------------------------
create or replace function bump_conversation_last_message_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on messages;
create trigger messages_bump_conversation
  after insert on messages
  for each row execute function bump_conversation_last_message_at();
