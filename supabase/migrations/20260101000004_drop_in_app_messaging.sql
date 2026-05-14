-- Drop the in-app messaging feature: conversations, messages, the per-property
-- AI chat history table, and their supporting trigger/function. The app no
-- longer renders any UI for these; contact between searchers and owners now
-- happens via the device's native dialer and SMS app.
--
-- Safe ordering: drop dependents (messages, ai_chat_messages) before
-- conversations. CASCADE on conversations covers the trigger automatically,
-- but we drop the bump function explicitly afterward.

drop table if exists public.messages cascade;
drop table if exists public.ai_chat_messages cascade;
drop table if exists public.conversations cascade;

drop function if exists public.bump_conversation_last_message_at();
