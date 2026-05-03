import { supabase } from '@/utils/supabase';

export type FindOrCreateConversationInput = {
  searcherId: string;
  ownerId: string;
  propertyId: string;
};

export type FindOrCreateConversationResult = {
  id: string;
  isNew: boolean;
};

/**
 * Find or create a conversation between a searcher and an owner about a property.
 * Idempotent: relies on the unique (searcher_id, owner_id, property_id) index in
 * `conversations` (see supabase/migrations/00001_initial_schema.sql:135).
 */
export async function findOrCreateConversation(
  input: FindOrCreateConversationInput,
): Promise<FindOrCreateConversationResult> {
  const { searcherId, ownerId, propertyId } = input;

  if (searcherId === ownerId) {
    throw new Error('Cannot start a conversation with yourself.');
  }

  const existing = await supabase
    .from('conversations')
    .select('id')
    .eq('searcher_id', searcherId)
    .eq('owner_id', ownerId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return { id: existing.data.id as string, isNew: false };

  const inserted = await supabase
    .from('conversations')
    .insert({
      searcher_id: searcherId,
      owner_id: ownerId,
      property_id: propertyId,
    })
    .select('id')
    .single();

  if (inserted.error) throw inserted.error;
  return { id: inserted.data.id as string, isNew: true };
}
