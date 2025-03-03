
import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    try {
      // Try to set the session, but don't throw if it fails
      await supabase.auth.setSession({
        access_token: '',
        refresh_token: '',
      }).catch(error => {
        console.log("Non-critical auth session error:", error);
      });
    } catch (error) {
      console.log("Error setting session, but proceeding with existing ID:", error);
    }

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
    // Fallback to a local UUID if Supabase fails
    const fallbackId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_KEY, fallbackId);
    return fallbackId;
  }
};
