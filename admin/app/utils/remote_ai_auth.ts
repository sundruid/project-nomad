import env from '#start/env'

/**
 * Return the optional API key for a remote OpenAI-compatible AI server.
 *
 * The key is intentionally environment-only: it is never written to KVStore,
 * returned by an API endpoint, or exposed to the browser.
 */
export function getRemoteAiApiKey(): string | undefined {
  const apiKey = env.get('REMOTE_AI_API_KEY')?.trim()
  return apiKey || undefined
}

export function buildBearerAuthHeaders(apiKey?: string | null): Record<string, string> {
  const normalizedKey = apiKey?.trim()
  return normalizedKey ? { Authorization: `Bearer ${normalizedKey}` } : {}
}

export function getRemoteAiAuthHeaders(): Record<string, string> {
  return buildBearerAuthHeaders(getRemoteAiApiKey())
}
