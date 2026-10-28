import axios, { AxiosError } from 'axios'

/**
 * Shared axios instance. In development Vite proxies /api to the Express server.
 * In production set VITE_API_URL if the API is served from a different origin.
 */
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  withCredentials: true,
  timeout: 20000,
})

/** Extracts a human-readable message from an API error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof AxiosError) {
    if (!err.response) return 'Unable to reach the server. Please check your connection.'
    const data = err.response.data as { message?: string } | undefined
    return data?.message || fallback
  }
  return err instanceof Error ? err.message : fallback
}

export const errorStatus = (err: unknown) => (err instanceof AxiosError ? err.response?.status : undefined)
