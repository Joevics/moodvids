
import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    return existingId;
  }

  try {
    // Create new anonymous user
    const { data, error } = await supabase
      .from('anonymous_users')
      .insert({})
      .select()
      .single();

    if (error) {
      console.error('Error creating anonymous user:', error);
      throw error;
    }

    // Store the new ID
    localStorage.setItem(ANONYMOUS_USER_KEY, data.id);
    return data.id;
  } catch (error) {
    console.error('Error in getOrCreateAnonymousId:', error);
    // Fallback to generate a temporary ID if we can't create one in the database
    const fallbackId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_KEY, fallbackId);
    return fallbackId;
  }
};
