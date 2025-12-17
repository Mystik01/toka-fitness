/**
 * Error handler utility for logging backend errors to browser console
 * Helps with debugging by capturing detailed error info from API responses
 */

export interface ApiErrorResponse {
  error: string;
  debug_error?: string;
}

/**
 * Log API errors to browser console for debugging
 * In development, includes full traceback; in production, only user-friendly message
 */
export function logApiError(response: Response, data: any): void {
  if (!data) return;

  const timestamp = new Date().toISOString();
  const url = response.url || 'Unknown URL';
  const status = response.status || 'Unknown';

  // Always log the user-friendly error message
  console.error(`🔴 API Error [${status}] at ${timestamp}:`, data.error || 'Unknown error');

  // Log detailed debug info if available (development mode only)
  if (data.debug_error) {
    console.error('📋 Debug Details:', data.debug_error);
    console.error('🔗 Endpoint:', url);
    console.error('📊 Status:', status);
  }
}

/**
 * Fetch wrapper that auto-logs errors to console
 */
export async function fetchWithErrorLogging(
  url: string,
  options?: RequestInit
): Promise<{ response: Response; data: any }> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      logApiError(response, data);
    }

    return { response, data };
  } catch (err) {
    console.error('🔴 Network Error:', err);
    throw err;
  }
}
