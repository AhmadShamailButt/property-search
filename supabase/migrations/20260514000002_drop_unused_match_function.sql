-- Drop the unused `match_property_embeddings(vector, uuid, float, int)` RPC.
--
-- This is the per-property similarity search introduced in 00001 and resized
-- to 768 dims in 00012. The current RAG flow (chat-search Edge Function) only
-- ever calls `match_properties_global`, which JOINs properties + embeddings
-- in a single query and returns full property rows. `match_property_embeddings`
-- has no remaining callers in the app, edge functions, or other SQL.

drop function if exists public.match_property_embeddings(extensions.vector, uuid, float, int);
