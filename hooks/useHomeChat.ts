import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { toProperty, type PropertyRow } from '@/utils/propertyHelpers';
import type { Property } from '@/components/property/PropertyCard';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  properties?: Property[];
};

const INTRO: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  text: "Hi! Tell me what you're looking for — bedrooms, budget, city, must-haves like a garden — and I'll pull matching listings.",
};

export function useHomeChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [pending, setPending] = useState(false);
  const idCounter = useRef(0);
  const nextId = () => `m_${Date.now()}_${idCounter.current++}`;

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: trimmed };
    // Snapshot last 10 *prior* messages as Vertex history. Assistant turns
    // carry the property ids they showed so the server can answer follow-ups
    // like "which of the above is cheapest" against the actual prior list.
    const history = messages
      .filter((m) => m.id !== 'intro')
      .slice(-10)
      .map((m) => ({
        role: m.role,
        text: m.text,
        property_ids: m.properties?.map((p) => String(p.id)),
      }));
    console.log('[useHomeChat] sending', {
      message: trimmed,
      historyLen: history.length,
      historyRoles: history.map((h) => h.role),
      historyPriorIdCounts: history.map((h) => h.property_ids?.length ?? 0),
    });
    setMessages((prev) => [...prev, userMsg]);
    setPending(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-search', {
        body: { message: trimmed, history },
      });
      console.log('[useHomeChat] received', {
        error,
        replyLen: data?.reply?.length,
        propertyCount: data?.properties?.length,
        propertyIds: data?.properties?.map((p: { id: string }) => p.id),
      });
      if (error) throw error;

      const rows = (data?.properties ?? []) as PropertyRow[];
      const properties = rows.map(toProperty);
      const reply = (data?.reply as string) ||
        (properties.length > 0
          ? `Found ${properties.length} ${properties.length === 1 ? 'listing' : 'listings'} that look close to what you described.`
          : `I couldn't find listings for that yet — could you share more details?`);

      setMessages((prev) => [...prev, {
        id: nextId(),
        role: 'assistant',
        text: reply,
        properties: properties.length ? properties : undefined,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: nextId(),
        role: 'assistant',
        text: "I couldn't reach the AI right now. Please try again in a moment.",
      }]);
    } finally {
      setPending(false);
    }
  }, [messages, pending]);

  const reset = useCallback(() => setMessages([INTRO]), []);

  return { messages, pending, sendMessage, reset };
}
