import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    // We'll pass this ID with each functions call instead of setting it globally
    return existingId;
  }

  // Create new anonymous user
  try {
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
    console.error('Failed to create anonymous user:', error);
    // Fallback - generate a client-side ID if server fails
    const fallbackId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_KEY, fallbackId);
    return fallbackId;
  }
};

// Helper to get the current anonymous ID for use in function calls
export const ensureAnonymousContext = async () => {
  const userId = await getOrCreateAnonymousId();
  return userId;
};

// Helper to get headers with anonymous ID for function calls
export const getAnonymousHeaders = async () => {
  const userId = await getOrCreateAnonymousId();
  return {
    'anon-user-id': userId
  };
};
