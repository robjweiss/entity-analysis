export async function requestJson<T>(
  path: string,
  signal?: AbortSignal,
  fallbackMessage = 'Unable to load data. Please try again.',
): Promise<T> {
  const response = await fetch(path, { signal })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string }
    } | null
    throw new Error(body?.error?.message ?? fallbackMessage)
  }

  return response.json() as Promise<T>
}
