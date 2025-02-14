
import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    // Set the anonymous ID in the request headers
    supabase.rest.headers['anon-user-id'] = existingId;
    return existingId;
  }

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
  
  // Set the anonymous ID in the request headers
  supabase.rest.headers['anon-user-id'] = data.id;

  return data.id;
};
