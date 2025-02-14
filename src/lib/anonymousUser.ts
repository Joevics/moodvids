
import { supabase } from "@/integrations/supabase/client";

const ANONYMOUS_USER_KEY = 'anonymous_user_id';

export const getOrCreateAnonymousId = async (): Promise<string> => {
  // Try to get existing ID from localStorage
  const existingId = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (existingId) {
    // Set custom header for anonymous user ID
    const customHeaders = { 'anon-user-id': existingId };
    
    // Update the client's configuration
    const { error } = await supabase.auth.updateUser({
      data: { anonymousId: existingId }
    });

    if (error) {
      console.error('Error updating user data:', error);
    }

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
  
  // Update the client's configuration with the new ID
  const { error: updateError } = await supabase.auth.updateUser({
    data: { anonymousId: data.id }
  });

  if (updateError) {
    console.error('Error updating user data:', updateError);
  }

  return data.id;
};
