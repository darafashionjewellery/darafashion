import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage, errorStatus } from '../services/api'

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: string | null
  status: number | undefined
}

/**
 * Runs an async loader whenever `deps` change and tracks loading / error state.
 * Stale responses (from an earlier set of deps) are ignored.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, loading: true, error: null, status: undefined })
  const callId = useRef(0)
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const run = useCallback(() => {
    const id = ++callId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    loaderRef
      .current()
      .then((data) => {
        if (id === callId.current) setState({ data, loading: false, error: null, status: 200 })
      })
      .catch((err) => {
        if (id === callId.current) setState((s) => ({ ...s, loading: false, error: errorMessage(err), status: errorStatus(err) }))
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  const setData = useCallback((data: T) => setState((s) => ({ ...s, data })), [])

  return { ...state, reload: run, setData }
}
