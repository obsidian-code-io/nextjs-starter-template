/**
 * Wrapper around fetch that handles 401 errors globally
 * Use this for all API calls to ensure consistent 401 handling
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 401 || response.status === 403) {
    // Import dynamically to avoid SSR issues
    if (typeof window !== "undefined") {
      const { handle401Unauthorized } = await import("./auth-utils-client");
      handle401Unauthorized();
    }
  }

  return response;
}
