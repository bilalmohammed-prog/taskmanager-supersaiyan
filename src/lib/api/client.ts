import { supabase } from '@/lib/supabase/client';
import { ApiException } from './types';

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    throw new ApiException('No active session', 401);
  }

  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    const message =
      errorData?.error?.message ??
      errorData?.error ??
      errorData?.message ??
      `HTTP ${response.status}`;
    throw new ApiException(message, response.status);
  }

  return response;
}
