
import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    // Set the anonymous user ID in auth metadata and headers
    supabase.functions.setHeaders({
      'anon-user-id': existingId
    });
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
    
    // Set the anonymous user ID in headers
    supabase.functions.setHeaders({
      'anon-user-id': data.id
    });

    return data.id;
  } catch (error) {
    console.error('Failed to create anonymous user:', error);
    // Fallback - generate a client-side ID if server fails
    const fallbackId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_KEY, fallbackId);
    return fallbackId;
  }
};

// Helper to attach anonymous ID to the current session context
export const ensureAnonymousContext = async () => {
  const userId = await getOrCreateAnonymousId();
  
  // Set the header for all function calls
  supabase.functions.setHeaders({
    'anon-user-id': userId
  });
  
  return userId;
};
